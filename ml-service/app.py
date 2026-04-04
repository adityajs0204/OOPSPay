"""
Earnly ML Microservice
Flask API serving fraud detection, risk scoring, disruption validation,
and payout calculation for parametric insurance.
"""

import os
import sys
import traceback
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

# Ensure local imports resolve
sys.path.insert(0, os.path.dirname(__file__))

from models.fraud_detector import FraudDetector
from models.risk_scorer import RiskScorer
from models.disruption_validator import DisruptionValidator

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = Flask(__name__)
CORS(app)

# Initialize models once at startup
print("[Earnly ML] Initializing fraud detector (training on synthetic data)...")
fraud_detector = FraudDetector()
print("[Earnly ML] Fraud detector ready.")

risk_scorer = RiskScorer()
disruption_validator = DisruptionValidator()


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------
def error_response(message: str, status: int = 400):
    return jsonify({"error": message}), status


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "earnly-ml",
        "timestamp": datetime.utcnow().isoformat(),
        "models": {
            "fraud_detector": "loaded",
            "risk_scorer": "loaded",
            "disruption_validator": "loaded",
        },
    })


@app.route("/api/validate-disruption", methods=["POST"])
def validate_disruption():
    """
    Validate a disruption event using multi-source data.
    Body: {weatherData, aqiData, newsAlerts, city, zone}
    """
    try:
        body = request.get_json(force=True)
        if not body:
            return error_response("Request body is required")

        weather_data = body.get("weatherData", {})
        aqi_data = body.get("aqiData", {})
        news_alerts = body.get("newsAlerts", [])
        city = body.get("city", "")
        # zone accepted but not directly used in validation logic today
        # zone = body.get("zone", "")

        result = disruption_validator.validate(
            weather_data=weather_data,
            aqi_data=aqi_data,
            news_alerts=news_alerts,
            city=city,
        )

        return jsonify({
            "isValid": result["is_valid"],
            "confidence": result["confidence"],
            "sources_agreeing": result["agreeing_sources"],
            "total_sources": result["total_sources"],
            "details": result["details"],
        })

    except Exception as e:
        traceback.print_exc()
        return error_response(f"Disruption validation failed: {str(e)}", 500)


@app.route("/api/fraud-check", methods=["POST"])
def fraud_check():
    """
    Check a claim for fraud signals.
    Body: {userId, location_history, delivery_count, active_hours, claim_amount}
    """
    try:
        body = request.get_json(force=True)
        if not body:
            return error_response("Request body is required")

        location_history = body.get("location_history", [])
        delivery_count = int(body.get("delivery_count", 0))
        active_hours = float(body.get("active_hours", 0))
        claim_amount = float(body.get("claim_amount", 0))
        avg_weekly_earnings = body.get("avg_weekly_earnings")
        zone_claims = body.get("zone_claims")

        if claim_amount <= 0:
            return error_response("claim_amount must be positive")

        result = fraud_detector.detect(
            location_history=location_history,
            delivery_count=delivery_count,
            active_hours=active_hours,
            claim_amount=claim_amount,
            avg_weekly_earnings=float(avg_weekly_earnings) if avg_weekly_earnings else None,
            zone_claims=zone_claims,
        )

        return jsonify({
            "userId": body.get("userId"),
            "fraudScore": result["fraud_score"],
            "flags": result["flags"],
            "recommendation": result["recommendation"],
        })

    except (ValueError, TypeError) as e:
        return error_response(f"Invalid input: {str(e)}")
    except Exception as e:
        traceback.print_exc()
        return error_response(f"Fraud check failed: {str(e)}", 500)


@app.route("/api/risk-score", methods=["POST"])
def risk_score():
    """
    Calculate risk score and premium multiplier.
    Body: {city, zone, platform, historical_claims, season}
    """
    try:
        body = request.get_json(force=True)
        if not body:
            return error_response("Request body is required")

        city = body.get("city", "")
        if not city:
            return error_response("city is required")

        zone = body.get("zone")
        platform = body.get("platform", "default")
        historical_claims = int(body.get("historical_claims", 0))

        # Season can be a month number or a string like "monsoon"
        season_raw = body.get("season")
        season_month = None
        if isinstance(season_raw, int) and 1 <= season_raw <= 12:
            season_month = season_raw
        elif isinstance(season_raw, str):
            season_name_map = {
                "monsoon": 7, "winter": 12, "summer": 4, "post-monsoon": 10,
            }
            season_month = season_name_map.get(season_raw.lower())
        if season_month is None:
            season_month = datetime.utcnow().month

        result = risk_scorer.score(
            city=city,
            zone=zone,
            platform=platform,
            historical_claims=historical_claims,
            season_month=season_month,
        )

        return jsonify({
            "riskScore": result["risk_score"],
            "premiumMultiplier": result["premium_multiplier"],
            "factors": result["factors"],
        })

    except (ValueError, TypeError) as e:
        return error_response(f"Invalid input: {str(e)}")
    except Exception as e:
        traceback.print_exc()
        return error_response(f"Risk scoring failed: {str(e)}", 500)


@app.route("/api/calculate-payout", methods=["POST"])
def calculate_payout():
    """
    Calculate estimated payout for a disruption event.
    Body: {avgWeeklyEarnings, activeDays, disruptionHours, coveragePercent, disruptionType}
    """
    try:
        body = request.get_json(force=True)
        if not body:
            return error_response("Request body is required")

        avg_weekly = float(body.get("avgWeeklyEarnings", 0))
        active_days = int(body.get("activeDays", 6))
        disruption_hours = float(body.get("disruptionHours", 0))
        coverage_pct = float(body.get("coveragePercent", 80))
        disruption_type = body.get("disruptionType", "general")

        if avg_weekly <= 0:
            return error_response("avgWeeklyEarnings must be positive")
        if disruption_hours <= 0:
            return error_response("disruptionHours must be positive")

        # Clamp coverage to reasonable bounds
        coverage_pct = max(0, min(coverage_pct, 100))

        # Disruption type severity multipliers
        type_multipliers = {
            "heavy_rain": 1.0,
            "flood": 1.3,
            "cyclone": 1.5,
            "extreme_heat": 0.8,
            "aqi_emergency": 0.9,
            "cold_wave": 0.7,
            "storm": 1.2,
            "bandh": 1.0,
            "general": 1.0,
        }
        type_mult = type_multipliers.get(disruption_type.lower(), 1.0)

        # Calculations
        daily_earnings = avg_weekly / max(active_days, 1)
        hourly_earnings = daily_earnings / 10  # assume ~10 active hours per day
        estimated_loss = round(hourly_earnings * disruption_hours * type_mult, 2)
        payout_amount = round(estimated_loss * (coverage_pct / 100), 2)

        breakdown = {
            "avg_weekly_earnings": avg_weekly,
            "active_days_per_week": active_days,
            "daily_earnings": round(daily_earnings, 2),
            "hourly_earnings": round(hourly_earnings, 2),
            "disruption_hours": disruption_hours,
            "disruption_type": disruption_type,
            "type_multiplier": type_mult,
            "estimated_loss_before_coverage": estimated_loss,
            "coverage_percent": coverage_pct,
            "final_payout": payout_amount,
        }

        return jsonify({
            "estimatedLoss": estimated_loss,
            "payoutAmount": payout_amount,
            "calculation_breakdown": breakdown,
        })

    except (ValueError, TypeError) as e:
        return error_response(f"Invalid input: {str(e)}")
    except Exception as e:
        traceback.print_exc()
        return error_response(f"Payout calculation failed: {str(e)}", 500)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    print(f"[Earnly ML] Starting on port {port} (debug={debug})")
    app.run(host="0.0.0.0", port=port, debug=debug)
