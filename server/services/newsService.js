const axios = require('axios');

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const BASE_URL = 'https://newsapi.org/v2/everything';

const ALERT_KEYWORDS = ['flood', 'cyclone', 'curfew', 'bandh', 'strike', 'protest', 'waterlogging', 'storm'];

const MOCK_ALERTS = {
  mumbai: [
    { title: 'Heavy rainfall warning issued for Mumbai', source: 'IMD', type: 'flood', severity: 'high' },
    { title: 'Waterlogging reported in Andheri and Dadar', source: 'TOI', type: 'flood', severity: 'medium' },
  ],
  delhi: [
    { title: 'Air quality reaches severe levels in Delhi NCR', source: 'CPCB', type: 'pollution', severity: 'high' },
  ],
  bangalore: [],
  hyderabad: [],
  chennai: [
    { title: 'Cyclone alert for Tamil Nadu coast', source: 'IMD', type: 'cyclone', severity: 'high' },
  ],
  kolkata: [],
  pune: [],
};

const getAlerts = async (city) => {
  if (!NEWS_API_KEY) {
    console.log('[News] No API key, returning mock alerts for:', city);
    const key = city.toLowerCase().trim();
    return MOCK_ALERTS[key] || [];
  }

  try {
    const query = `${city} AND (${ALERT_KEYWORDS.join(' OR ')})`;
    const response = await axios.get(BASE_URL, {
      params: {
        q: query,
        apiKey: NEWS_API_KEY,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 10,
      },
      timeout: 5000,
    });

    const articles = response.data.articles || [];

    return articles.map((article) => {
      const titleLower = (article.title || '').toLowerCase();
      let type = 'general';
      let severity = 'low';

      if (titleLower.includes('flood') || titleLower.includes('waterlogging')) {
        type = 'flood';
        severity = 'high';
      } else if (titleLower.includes('cyclone') || titleLower.includes('storm')) {
        type = 'cyclone';
        severity = 'high';
      } else if (titleLower.includes('curfew') || titleLower.includes('bandh') || titleLower.includes('strike')) {
        type = 'curfew';
        severity = 'medium';
      } else if (titleLower.includes('protest')) {
        type = 'protest';
        severity = 'medium';
      }

      return {
        title: article.title,
        source: article.source?.name || 'Unknown',
        type,
        severity,
      };
    });
  } catch (err) {
    console.error('[News] API call failed, using mock:', err.message);
    const key = city.toLowerCase().trim();
    return MOCK_ALERTS[key] || [];
  }
};

module.exports = { getAlerts };
