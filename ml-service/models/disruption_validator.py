"""
Multi-source disruption validation for Earnly parametric insurance.
Cross-references weather data, AQI data, and news alerts to confirm
whether a genuine disruption event has occurred.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from data.mock_data import DISRUPTION_THRESHOLDS, DISRUPTION_KEYWORDS


class DisruptionValidator:
    """Validates disruption claims by cross-referencing multiple data sources."""

    def validate(
        self,
        weather_data: dict | None,
        aqi_data: dict | None,
        news_alerts: list | None,
        city: str = "",
    ) -> dict:
        """
        Validate whether a real disruption event is occurring.

        Parameters
        ----------
        weather_data : dict with keys like rainfall_mm, wind_speed_kmh,
                       temperature_celsius, visibility_meters
        aqi_data     : dict with key "aqi" (integer)
        news_alerts  : list of dicts with key "headline" (str)
        city         : city name for context

        Returns
        -------
        dict with is_valid (bool), confidence (0-1), agreeing_sources (int),
             details (list of per-source results)
        """
        weather_data = weather_data or {}
        aqi_data = aqi_data or {}
        news_alerts = news_alerts or []

        details: list[dict] = []

        # --- Weather validation ---
        weather_result = self._validate_weather(weather_data)
        details.append(weather_result)

        # --- AQI validation ---
        aqi_result = self._validate_aqi(aqi_data)
        details.append(aqi_result)

        # --- News validation ---
        news_result = self._validate_news(news_alerts, city)
        details.append(news_result)

        # --- Multi-source agreement ---
        agreeing = sum(1 for d in details if d["triggered"])
        total_sources = len(details)

        # At least 2 of 3 sources must agree for valid disruption
        is_valid = agreeing >= 2

        # Confidence scoring
        if agreeing == 0:
            confidence = 0.0
        elif agreeing == 1:
            # Single source: low confidence
            single_conf = next(d["confidence"] for d in details if d["triggered"])
            confidence = single_conf * 0.35
        elif agreeing == 2:
            avg_conf = sum(d["confidence"] for d in details if d["triggered"]) / 2
            confidence = 0.6 + avg_conf * 0.25
        else:
            avg_conf = sum(d["confidence"] for d in details if d["triggered"]) / 3
            confidence = 0.85 + avg_conf * 0.15

        confidence = round(min(confidence, 1.0), 3)

        return {
            "is_valid": is_valid,
            "confidence": confidence,
            "agreeing_sources": agreeing,
            "total_sources": total_sources,
            "details": details,
        }

    # ------------------------------------------------------------------
    # Source-specific validators
    # ------------------------------------------------------------------
    def _validate_weather(self, data: dict) -> dict:
        """Check weather data against disruption thresholds."""
        triggers: list[str] = []
        severity = 0.0

        rainfall = data.get("rainfall_mm", 0)
        if rainfall >= DISRUPTION_THRESHOLDS["rainfall_mm_per_hour"]:
            triggers.append(f"Heavy rainfall: {rainfall} mm/hr")
            severity = max(severity, min(rainfall / 60, 1.0))

        wind = data.get("wind_speed_kmh", 0)
        if wind >= DISRUPTION_THRESHOLDS["wind_speed_kmh"]:
            triggers.append(f"High wind: {wind} km/h")
            severity = max(severity, min(wind / 100, 1.0))

        temp = data.get("temperature_celsius")
        if temp is not None:
            if temp >= DISRUPTION_THRESHOLDS["temperature_celsius_max"]:
                triggers.append(f"Extreme heat: {temp} C")
                severity = max(severity, 0.7)
            elif temp <= DISRUPTION_THRESHOLDS["temperature_celsius_min"]:
                triggers.append(f"Extreme cold: {temp} C")
                severity = max(severity, 0.6)

        visibility = data.get("visibility_meters")
        if visibility is not None and visibility <= DISRUPTION_THRESHOLDS["visibility_meters"]:
            triggers.append(f"Low visibility: {visibility} m")
            severity = max(severity, 0.5)

        flood = data.get("flood_water_level_cm", 0)
        if flood >= DISRUPTION_THRESHOLDS["flood_water_level_cm"]:
            triggers.append(f"Flooding: {flood} cm water level")
            severity = max(severity, min(flood / 60, 1.0))

        triggered = len(triggers) > 0
        confidence = round(min(severity, 1.0), 3) if triggered else 0.0

        return {
            "source": "weather",
            "triggered": triggered,
            "confidence": confidence,
            "triggers": triggers,
        }

    def _validate_aqi(self, data: dict) -> dict:
        """Check AQI data against danger thresholds."""
        aqi = data.get("aqi", 0)
        triggers: list[str] = []

        if aqi >= DISRUPTION_THRESHOLDS["aqi_danger_level"]:
            triggers.append(f"Severe AQI: {aqi} (danger level)")
            confidence = min(aqi / 500, 1.0)
        elif aqi >= DISRUPTION_THRESHOLDS["aqi_unhealthy_level"]:
            triggers.append(f"Unhealthy AQI: {aqi}")
            confidence = 0.5 + (aqi - 200) / 200 * 0.3
        else:
            confidence = 0.0

        triggered = len(triggers) > 0
        return {
            "source": "aqi",
            "triggered": triggered,
            "confidence": round(confidence, 3) if triggered else 0.0,
            "triggers": triggers,
        }

    def _validate_news(self, alerts: list, city: str = "") -> dict:
        """Check news alerts for disruption-related keywords."""
        if not alerts:
            return {
                "source": "news",
                "triggered": False,
                "confidence": 0.0,
                "triggers": [],
            }

        triggers: list[str] = []
        city_lower = city.strip().lower()

        for alert in alerts:
            headline = alert.get("headline", "").lower()
            matched_keywords = [
                kw for kw in DISRUPTION_KEYWORDS if kw in headline
            ]
            if matched_keywords:
                # Boost confidence if city name appears in headline
                city_match = city_lower in headline if city_lower else False
                triggers.append(
                    f"News alert matched: '{alert.get('headline', '')[:80]}' "
                    f"(keywords: {', '.join(matched_keywords[:3])})"
                    + (" [city match]" if city_match else "")
                )

        if not triggers:
            return {
                "source": "news",
                "triggered": False,
                "confidence": 0.0,
                "triggers": [],
            }

        # Confidence based on number of matching alerts and city presence
        base_conf = min(len(triggers) / 3, 1.0)
        city_in_any = any(city_lower in t.lower() for t in triggers) if city_lower else False
        confidence = base_conf * (1.0 if city_in_any else 0.75)

        return {
            "source": "news",
            "triggered": True,
            "confidence": round(min(confidence, 1.0), 3),
            "triggers": triggers,
        }
