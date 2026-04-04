"""
Fraud detection model for Earnly parametric insurance claims.
Uses an IsolationForest trained on synthetic data to flag suspicious claims,
plus rule-based checks for GPS spoofing, activity anomalies, and group fraud.
"""

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from data.mock_data import generate_fraud_training_data


class FraudDetector:
    """Detects potentially fraudulent parametric insurance claims."""

    def __init__(self):
        self.scaler = StandardScaler()
        self.model = IsolationForest(
            n_estimators=150,
            contamination=0.05,
            random_state=42,
            n_jobs=-1,
        )
        self._train()

    # ------------------------------------------------------------------
    # Training
    # ------------------------------------------------------------------
    def _train(self):
        """Train the IsolationForest on synthetic fraud data."""
        df = generate_fraud_training_data(n=1000)
        feature_cols = [
            "delivery_count",
            "active_hours",
            "claim_amount",
            "gps_max_jump_km",
            "claims_same_zone_24h",
            "claim_to_earnings_ratio",
            "account_age_days",
            "previous_claims",
        ]
        X = df[feature_cols].values
        self.feature_cols = feature_cols
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)
        self.model.fit(X_scaled)

        # Store average claim amount from training data for threshold checks
        self._avg_claim = float(df["claim_amount"].mean())

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def detect(
        self,
        location_history: list | None,
        delivery_count: int,
        active_hours: float,
        claim_amount: float,
        avg_weekly_earnings: float | None = None,
        zone_claims: list | None = None,
    ) -> dict:
        """
        Run fraud detection on a single claim.

        Parameters
        ----------
        location_history : list of dicts with keys lat, lng, timestamp
        delivery_count   : deliveries completed in the claim period
        active_hours     : hours the rider was active
        claim_amount     : amount claimed in INR
        avg_weekly_earnings : rider's average weekly earnings (optional)
        zone_claims      : list of recent claim timestamps from same zone (optional)

        Returns
        -------
        dict with fraud_score (0-1), flags (list[str]), recommendation (str)
        """
        flags: list[str] = []

        # --- Rule-based checks ---
        gps_max_jump = self._check_gps_spoofing(location_history or [])
        if gps_max_jump > 50:
            flags.append(
                f"GPS spoofing suspected: {gps_max_jump:.1f} km jump in <10 min"
            )

        if active_hours > 0 and delivery_count == 0:
            flags.append(
                "Activity anomaly: active hours recorded but zero deliveries"
            )

        earnings_ref = avg_weekly_earnings if avg_weekly_earnings else self._avg_claim
        if claim_amount > 2 * earnings_ref:
            flags.append(
                f"Amount anomaly: claim ({claim_amount:.0f}) > 2x reference earnings ({earnings_ref:.0f})"
            )

        group_flag = self._check_group_fraud(zone_claims)
        if group_flag:
            flags.append(group_flag)

        # --- ML-based anomaly score ---
        claims_same_zone = len(zone_claims) if zone_claims else 0
        claim_ratio = claim_amount / max(earnings_ref, 1)
        feature_vector = np.array([[
            delivery_count,
            active_hours,
            claim_amount,
            gps_max_jump,
            claims_same_zone,
            claim_ratio,
            90,   # default account age placeholder
            1,    # default previous claims placeholder
        ]])
        scaled = self.scaler.transform(feature_vector)
        anomaly_score_raw = self.model.decision_function(scaled)[0]
        # Convert IsolationForest score (negative = more anomalous) to 0-1
        # Typical range is roughly -0.5 to 0.3; we clamp and invert
        fraud_score = float(np.clip(0.5 - anomaly_score_raw, 0, 1))

        # Boost score if rule-based flags fire
        fraud_score = min(1.0, fraud_score + 0.1 * len(flags))
        fraud_score = round(fraud_score, 3)

        # Recommendation
        if fraud_score >= 0.7 or len(flags) >= 3:
            recommendation = "reject"
        elif fraud_score >= 0.4 or len(flags) >= 1:
            recommendation = "review"
        else:
            recommendation = "approve"

        return {
            "fraud_score": fraud_score,
            "flags": flags,
            "recommendation": recommendation,
        }

    # ------------------------------------------------------------------
    # Internal checks
    # ------------------------------------------------------------------
    @staticmethod
    def _check_gps_spoofing(location_history: list) -> float:
        """
        Detect unrealistic GPS jumps (>50 km in <10 min).
        Returns the maximum jump distance in km found.
        """
        if len(location_history) < 2:
            return 0.0

        max_jump = 0.0
        sorted_locs = sorted(location_history, key=lambda p: p.get("timestamp", 0))
        for i in range(1, len(sorted_locs)):
            prev, curr = sorted_locs[i - 1], sorted_locs[i]
            try:
                dt_seconds = abs(curr["timestamp"] - prev["timestamp"])
                if dt_seconds > 600:  # only flag if within 10 minutes
                    continue
                dist = FraudDetector._haversine(
                    prev["lat"], prev["lng"], curr["lat"], curr["lng"]
                )
                max_jump = max(max_jump, dist)
            except (KeyError, TypeError):
                continue

        return round(max_jump, 2)

    @staticmethod
    def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Haversine distance in kilometres."""
        R = 6371.0
        dlat = np.radians(lat2 - lat1)
        dlng = np.radians(lng2 - lng1)
        a = (
            np.sin(dlat / 2) ** 2
            + np.cos(np.radians(lat1))
            * np.cos(np.radians(lat2))
            * np.sin(dlng / 2) ** 2
        )
        return float(R * 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a)))

    @staticmethod
    def _check_group_fraud(zone_claims: list | None) -> str | None:
        """
        Flag if multiple claims originate from the same zone in a short
        time window. zone_claims is a list of epoch timestamps.
        """
        if not zone_claims or len(zone_claims) < 3:
            return None

        sorted_ts = sorted(zone_claims)
        # Check if 3+ claims within a 1-hour window
        for i in range(len(sorted_ts) - 2):
            window = sorted_ts[i + 2] - sorted_ts[i]
            if window <= 3600:  # 1 hour in seconds
                return (
                    f"Group fraud risk: {len(zone_claims)} claims from same zone, "
                    f"3+ within 1-hour window"
                )
        return None
