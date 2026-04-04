"""
Risk scoring engine for Earnly parametric insurance.
Computes a composite risk score and premium multiplier based on
city, zone, platform, claims history, and season.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from data.mock_data import CITY_RISK_SCORES


class RiskScorer:
    """Calculates risk scores and premium multipliers for policies."""

    # Season risk multipliers (month number -> multiplier)
    SEASON_MAP = {
        # Monsoon: Jun-Sep
        6: 1.4, 7: 1.4, 8: 1.4, 9: 1.4,
        # Winter: Nov-Feb
        11: 1.1, 12: 1.1, 1: 1.1, 2: 1.1,
        # Summer: Mar-May
        3: 1.2, 4: 1.2, 5: 1.2,
        # Rest (Oct)
        10: 1.0,
    }

    SEASON_LABELS = {
        6: "monsoon", 7: "monsoon", 8: "monsoon", 9: "monsoon",
        11: "winter", 12: "winter", 1: "winter", 2: "winter",
        3: "summer", 4: "summer", 5: "summer",
        10: "post-monsoon",
    }

    # Platform risk multipliers
    PLATFORM_RISK = {
        "swiggy": 1.15,
        "zomato": 1.15,
        "dunzo": 1.10,
        "blinkit": 1.05,
        "zepto": 1.05,
        "ecommerce": 1.00,
        "default": 1.10,
    }

    def score(
        self,
        city: str,
        zone: str | None = None,
        platform: str = "default",
        historical_claims: int = 0,
        season_month: int | None = None,
    ) -> dict:
        """
        Compute a composite risk score and premium multiplier.

        Parameters
        ----------
        city              : city name (case-insensitive)
        zone              : optional zone identifier within the city
        platform          : delivery platform name
        historical_claims : number of past claims for this policy/rider
        season_month      : month number (1-12); used to look up season risk

        Returns
        -------
        dict with risk_score (0-100), premium_multiplier (float), factors (list)
        """
        factors: list[dict] = []

        # --- City base risk ---
        city_key = city.strip().lower()
        city_score = CITY_RISK_SCORES.get(city_key, 50)  # default mid-range
        factors.append({
            "name": "city_risk",
            "value": city_score,
            "description": f"Base risk for {city_key}: {city_score}/100",
        })

        # --- Zone modifier (simple hash-based variation +/- 8 points) ---
        zone_mod = 0
        if zone:
            zone_mod = (hash(zone) % 17) - 8  # range -8 to +8
            factors.append({
                "name": "zone_modifier",
                "value": zone_mod,
                "description": f"Zone '{zone}' adjustment: {zone_mod:+d}",
            })

        # --- Season risk ---
        month = season_month if season_month else 1
        season_mult = self.SEASON_MAP.get(month, 1.0)
        season_label = self.SEASON_LABELS.get(month, "unknown")
        factors.append({
            "name": "season_risk",
            "value": season_mult,
            "description": f"Season '{season_label}' (month {month}) multiplier: {season_mult}",
        })

        # --- Platform risk ---
        plat_key = platform.strip().lower()
        plat_mult = self.PLATFORM_RISK.get(plat_key, self.PLATFORM_RISK["default"])
        factors.append({
            "name": "platform_risk",
            "value": plat_mult,
            "description": f"Platform '{plat_key}' multiplier: {plat_mult}",
        })

        # --- Claims history factor ---
        if historical_claims <= 1:
            claims_mult = 1.0
        elif historical_claims <= 3:
            claims_mult = 1.1
        elif historical_claims <= 5:
            claims_mult = 1.25
        else:
            claims_mult = 1.4
        factors.append({
            "name": "claims_history",
            "value": claims_mult,
            "description": (
                f"{historical_claims} past claims -> multiplier {claims_mult}"
            ),
        })

        # --- Composite risk score (0-100 scale) ---
        base = min(max(city_score + zone_mod, 0), 100)
        composite = base * season_mult * plat_mult * claims_mult
        risk_score = round(min(composite / 1.0, 100), 1)  # cap at 100

        # --- Premium multiplier (1.0 = base premium) ---
        premium_multiplier = round(
            (risk_score / 50) * season_mult * plat_mult * claims_mult, 3
        )
        premium_multiplier = max(0.5, min(premium_multiplier, 5.0))  # clamp

        return {
            "risk_score": risk_score,
            "premium_multiplier": premium_multiplier,
            "factors": factors,
        }
