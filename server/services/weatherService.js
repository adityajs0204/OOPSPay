const axios = require('axios');

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

const MOCK_WEATHER = {
  mumbai: { temp: 32, humidity: 85, rainfall: 12, windSpeed: 18, description: 'light rain' },
  delhi: { temp: 40, humidity: 45, rainfall: 0, windSpeed: 10, description: 'haze' },
  bangalore: { temp: 28, humidity: 65, rainfall: 3, windSpeed: 12, description: 'partly cloudy' },
  hyderabad: { temp: 35, humidity: 55, rainfall: 0, windSpeed: 8, description: 'clear sky' },
  chennai: { temp: 34, humidity: 78, rainfall: 5, windSpeed: 15, description: 'scattered clouds' },
  kolkata: { temp: 33, humidity: 80, rainfall: 8, windSpeed: 14, description: 'overcast clouds' },
  pune: { temp: 30, humidity: 60, rainfall: 2, windSpeed: 11, description: 'partly cloudy' },
};

const getCurrentWeather = async (city) => {
  if (!OPENWEATHER_API_KEY) {
    console.log('[Weather] No API key, returning mock data for:', city);
    const key = city.toLowerCase().trim();
    return MOCK_WEATHER[key] || MOCK_WEATHER.bangalore;
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        q: `${city},IN`,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
      },
      timeout: 5000,
    });

    const data = response.data;
    return {
      temp: data.main.temp,
      humidity: data.main.humidity,
      rainfall: data.rain ? data.rain['1h'] || data.rain['3h'] || 0 : 0,
      windSpeed: data.wind.speed * 3.6, // m/s to km/h
      description: data.weather[0]?.description || 'unknown',
    };
  } catch (err) {
    console.error('[Weather] API call failed, using mock:', err.message);
    const key = city.toLowerCase().trim();
    return MOCK_WEATHER[key] || MOCK_WEATHER.bangalore;
  }
};

module.exports = { getCurrentWeather };
