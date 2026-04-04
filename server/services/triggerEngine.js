/**
 * Parametric Trigger Engine
 *
 * Evaluates weather, AQI and news data against predefined rules to decide
 * whether a disruption event has been triggered.  Each rule maps to a payout
 * percentage that the claims pipeline will use.
 */

const TRIGGER_RULES = [
  {
    id: 'heavy_rain',
    name: 'Heavy Rainfall',
    evaluate: (weather) => weather.rainfall >= 50,
    type: 'rain',
    severity: 'high',
    confidence: 0.92,
    estimatedDuration: 2, // hours
    payoutPercent: 80,
    description: 'Rainfall >= 50 mm/hr sustained',
  },
  {
    id: 'moderate_rain',
    name: 'Moderate Rainfall',
    evaluate: (weather) => weather.rainfall >= 20 && weather.rainfall < 50,
    type: 'rain',
    severity: 'medium',
    confidence: 0.85,
    estimatedDuration: 2,
    payoutPercent: 50,
    description: 'Rainfall 20-50 mm/hr',
  },
  {
    id: 'extreme_heat',
    name: 'Extreme Heat',
    evaluate: (weather) => weather.temp >= 42,
    type: 'heatwave',
    severity: 'high',
    confidence: 0.95,
    estimatedDuration: 3,
    payoutPercent: 60,
    description: 'Temperature >= 42C for 3+ hours',
  },
  {
    id: 'hazardous_aqi',
    name: 'Hazardous Air Quality',
    evaluate: (_weather, aqi) => aqi.aqi >= 300,
    type: 'pollution',
    severity: 'high',
    confidence: 0.9,
    estimatedDuration: 4,
    payoutPercent: 70,
    description: 'AQI >= 300 for 4+ hours',
  },
  {
    id: 'very_unhealthy_aqi',
    name: 'Very Unhealthy Air Quality',
    evaluate: (_weather, aqi) => aqi.aqi >= 200 && aqi.aqi < 300,
    type: 'pollution',
    severity: 'medium',
    confidence: 0.8,
    estimatedDuration: 4,
    payoutPercent: 40,
    description: 'AQI 200-300',
  },
  {
    id: 'flood_alert',
    name: 'Flood Alert',
    evaluate: (_weather, _aqi, alerts) =>
      alerts.some((a) => a.type === 'flood' && a.severity === 'high'),
    type: 'flood',
    severity: 'critical',
    confidence: 0.88,
    estimatedDuration: 6,
    payoutPercent: 100,
    description: 'High-severity flood alert from news sources',
  },
  {
    id: 'cyclone_alert',
    name: 'Cyclone Alert',
    evaluate: (_weather, _aqi, alerts) =>
      alerts.some((a) => a.type === 'cyclone' && a.severity === 'high'),
    type: 'cyclone',
    severity: 'critical',
    confidence: 0.85,
    estimatedDuration: 12,
    payoutPercent: 100,
    description: 'Cyclone alert from news sources',
  },
  {
    id: 'curfew_alert',
    name: 'Curfew / Bandh',
    evaluate: (_weather, _aqi, alerts) =>
      alerts.some((a) => a.type === 'curfew' && ['high', 'medium'].includes(a.severity)),
    type: 'curfew',
    severity: 'high',
    confidence: 0.82,
    estimatedDuration: 8,
    payoutPercent: 90,
    description: 'Curfew or bandh alert',
  },
  {
    id: 'high_wind',
    name: 'High Wind Speed',
    evaluate: (weather) => weather.windSpeed >= 60,
    type: 'storm',
    severity: 'high',
    confidence: 0.87,
    estimatedDuration: 3,
    payoutPercent: 70,
    description: 'Wind speed >= 60 km/h',
  },
];

/**
 * Evaluate all trigger rules against current data.
 * @returns {Array} Array of triggered disruption objects
 */
const evaluateTriggers = (weatherData, aqiData, newsAlerts, city) => {
  const triggered = [];

  for (const rule of TRIGGER_RULES) {
    try {
      if (rule.evaluate(weatherData, aqiData, newsAlerts)) {
        triggered.push({
          triggerId: rule.id,
          name: rule.name,
          type: rule.type,
          severity: rule.severity,
          confidence: rule.confidence,
          estimatedDuration: rule.estimatedDuration,
          payoutPercent: rule.payoutPercent,
          description: rule.description,
          city,
          triggeredAt: new Date().toISOString(),
          weatherSnapshot: weatherData,
          aqiSnapshot: aqiData,
        });
      }
    } catch (err) {
      console.error(`[TriggerEngine] Error evaluating rule ${rule.id}:`, err.message);
    }
  }

  return triggered;
};

module.exports = { evaluateTriggers, TRIGGER_RULES };
