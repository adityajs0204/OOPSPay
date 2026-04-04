"""
Mock/synthetic data generators for Earnly ML models.
Provides training data, city risk scores, and disruption thresholds
so the demo runs without any external data dependencies.
"""

import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta


# ---------------------------------------------------------------------------
# City risk scores for major Indian cities (0-100 scale)
# Higher = more disruption-prone (weather, traffic, AQI, flood history)
# ---------------------------------------------------------------------------
CITY_RISK_SCORES = {
    "mumbai": 82,
    "delhi": 78,
    "bangalore": 55,
    "chennai": 74,
    "kolkata": 76,
    "hyderabad": 58,
    "pune": 52,
    "ahmedabad": 48,
    "jaipur": 45,
    "lucknow": 60,
    "chandigarh": 42,
    "kochi": 70,
    "guwahati": 72,
    "bhopal": 50,
    "patna": 68,
    "indore": 46,
    "nagpur": 44,
    "surat": 50,
    "visakhapatnam": 62,
    "thiruvananthapuram": 65,
}

# ---------------------------------------------------------------------------
# Disruption trigger thresholds
# ---------------------------------------------------------------------------
DISRUPTION_THRESHOLDS = {
    "rainfall_mm_per_hour": 30,       # Heavy rain trigger
    "wind_speed_kmh": 60,             # High wind trigger
    "temperature_celsius_max": 45,    # Extreme heat trigger
    "temperature_celsius_min": 4,     # Extreme cold trigger
    "aqi_danger_level": 300,          # Severe+ AQI
    "aqi_unhealthy_level": 200,       # Unhealthy AQI
    "flood_water_level_cm": 30,       # Road flooding trigger
    "visibility_meters": 200,         # Low visibility trigger
}

# Keywords that indicate genuine disruption in news alerts
DISRUPTION_KEYWORDS = [
    "flood", "flooding", "waterlogging", "heavy rain", "downpour",
    "cyclone", "hurricane", "storm", "thunderstorm", "hailstorm",
    "heatwave", "heat wave", "extreme heat",
    "smog", "air quality", "aqi", "pollution emergency",
    "road closure", "road blocked", "traffic jam", "gridlock",
    "power outage", "blackout",
    "bandh", "strike", "protest", "curfew",
    "earthquake", "landslide",
]


def generate_rider_history(n: int = 100) -> pd.DataFrame:
    """Generate synthetic rider delivery history data."""
    np.random.seed(42)
    random.seed(42)

    cities = list(CITY_RISK_SCORES.keys())
    platforms = ["swiggy", "zomato", "blinkit", "zepto", "dunzo"]

    records = []
    for i in range(n):
        city = random.choice(cities)
        avg_weekly_earnings = round(np.random.normal(4500, 1200), 2)
        avg_weekly_earnings = max(avg_weekly_earnings, 1500)

        records.append({
            "rider_id": f"RID{1000 + i}",
            "city": city,
            "zone": f"{city}_zone_{random.randint(1, 5)}",
            "platform": random.choice(platforms),
            "avg_weekly_earnings": avg_weekly_earnings,
            "avg_daily_deliveries": random.randint(8, 30),
            "avg_active_hours": round(np.random.uniform(4, 14), 1),
            "tenure_months": random.randint(1, 48),
            "past_claims": random.randint(0, 6),
            "past_fraud_flags": random.randint(0, 2),
            "rating": round(np.random.uniform(3.5, 5.0), 1),
        })

    return pd.DataFrame(records)


def generate_disruption_events(n: int = 50) -> pd.DataFrame:
    """Generate synthetic past disruption events."""
    np.random.seed(43)
    random.seed(43)

    cities = list(CITY_RISK_SCORES.keys())
    disruption_types = [
        "heavy_rain", "flood", "extreme_heat", "aqi_emergency",
        "cyclone", "storm", "cold_wave", "bandh",
    ]

    records = []
    base_date = datetime(2025, 1, 1)
    for i in range(n):
        city = random.choice(cities)
        d_type = random.choice(disruption_types)
        event_date = base_date + timedelta(days=random.randint(0, 365))

        records.append({
            "event_id": f"EVT{2000 + i}",
            "city": city,
            "zone": f"{city}_zone_{random.randint(1, 5)}",
            "disruption_type": d_type,
            "date": event_date.strftime("%Y-%m-%d"),
            "duration_hours": round(np.random.uniform(2, 48), 1),
            "severity": random.choice(["moderate", "severe", "extreme"]),
            "riders_affected": random.randint(20, 500),
            "total_payouts_inr": round(np.random.uniform(50000, 500000), 2),
            "validated": True,
        })

    return pd.DataFrame(records)


def generate_fraud_training_data(n: int = 1000) -> pd.DataFrame:
    """
    Generate labeled fraud/legitimate data for model training.
    ~5% fraud rate to reflect realistic imbalance.
    """
    np.random.seed(44)
    random.seed(44)

    records = []
    for i in range(n):
        is_fraud = 1 if random.random() < 0.05 else 0

        if is_fraud:
            # Fraudulent patterns
            delivery_count = random.randint(0, 3)
            active_hours = round(np.random.uniform(0, 2), 1)
            claim_amount = round(np.random.uniform(8000, 20000), 2)
            gps_max_jump_km = round(np.random.uniform(40, 150), 1)
            claims_same_zone_24h = random.randint(3, 10)
            avg_weekly_earnings = round(np.random.uniform(2000, 4000), 2)
            account_age_days = random.randint(5, 60)
            previous_claims = random.randint(2, 8)
        else:
            # Legitimate patterns
            delivery_count = random.randint(5, 30)
            active_hours = round(np.random.uniform(4, 14), 1)
            claim_amount = round(np.random.uniform(1000, 6000), 2)
            gps_max_jump_km = round(np.random.uniform(0.1, 15), 1)
            claims_same_zone_24h = random.randint(0, 2)
            avg_weekly_earnings = round(np.random.uniform(3000, 7000), 2)
            account_age_days = random.randint(30, 800)
            previous_claims = random.randint(0, 4)

        records.append({
            "sample_id": i,
            "delivery_count": delivery_count,
            "active_hours": active_hours,
            "claim_amount": claim_amount,
            "gps_max_jump_km": gps_max_jump_km,
            "claims_same_zone_24h": claims_same_zone_24h,
            "avg_weekly_earnings": avg_weekly_earnings,
            "claim_to_earnings_ratio": round(
                claim_amount / max(avg_weekly_earnings, 1), 3
            ),
            "account_age_days": account_age_days,
            "previous_claims": previous_claims,
            "is_fraud": is_fraud,
        })

    return pd.DataFrame(records)
