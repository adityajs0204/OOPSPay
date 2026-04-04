const axios = require('axios');

const AQI_API_KEY = process.env.AQI_API_KEY;
const BASE_URL = 'https://api.waqi.info/feed';

const AQI_LEVELS = [
  { max: 50, level: 'Good' },
  { max: 100, level: 'Moderate' },
  { max: 150, level: 'Unhealthy for Sensitive Groups' },
  { max: 200, level: 'Unhealthy' },
  { max: 300, level: 'Very Unhealthy' },
  { max: Infinity, level: 'Hazardous' },
];

const getAQILevel = (aqi) => {
  for (const l of AQI_LEVELS) {
    if (aqi <= l.max) return l.level;
  }
  return 'Hazardous';
};

const MOCK_AQI = {
  mumbai: { aqi: 145, level: 'Unhealthy for Sensitive Groups', dominant_pollutant: 'pm25' },
  delhi: { aqi: 320, level: 'Hazardous', dominant_pollutant: 'pm25' },
  bangalore: { aqi: 85, level: 'Moderate', dominant_pollutant: 'pm10' },
  hyderabad: { aqi: 110, level: 'Unhealthy for Sensitive Groups', dominant_pollutant: 'pm25' },
  chennai: { aqi: 95, level: 'Moderate', dominant_pollutant: 'o3' },
  kolkata: { aqi: 180, level: 'Unhealthy', dominant_pollutant: 'pm25' },
  pune: { aqi: 75, level: 'Moderate', dominant_pollutant: 'pm10' },
};

const getAQI = async (city) => {
  if (!AQI_API_KEY) {
    console.log('[AQI] No API key, returning mock data for:', city);
    const key = city.toLowerCase().trim();
    return MOCK_AQI[key] || MOCK_AQI.bangalore;
  }

  try {
    const response = await axios.get(`${BASE_URL}/${city}/`, {
      params: { token: AQI_API_KEY },
      timeout: 5000,
    });

    if (response.data.status !== 'ok') {
      throw new Error('AQI API returned non-ok status');
    }

    const data = response.data.data;
    const aqi = data.aqi;

    return {
      aqi,
      level: getAQILevel(aqi),
      dominant_pollutant: data.dominentpol || 'pm25',
    };
  } catch (err) {
    console.error('[AQI] API call failed, using mock:', err.message);
    const key = city.toLowerCase().trim();
    return MOCK_AQI[key] || MOCK_AQI.bangalore;
  }
};

module.exports = { getAQI };
