/**
 * Dynamic Premium Calculation Engine
 *
 * Adjusts the base premium for a plan based on city risk, seasonal risk,
 * claim history, platform and loyalty.
 */

const CITY_RISK = {
  mumbai: 1.3,
  delhi: 1.2,
  chennai: 1.15,
  kolkata: 1.15,
  hyderabad: 1.05,
  pune: 1.05,
  bangalore: 1.0,
  bengaluru: 1.0,
};

const ZONE_RISK = {
  high: 1.2,
  medium: 1.0,
  low: 0.9,
};

const PLATFORM_RISK = {
  zomato: 1.0,
  swiggy: 1.0,
  zepto: 1.05, // quick-commerce slightly higher risk due to speed pressure
  blinkit: 1.05,
  dunzo: 1.02,
};

/**
 * Monsoon months (Jun-Sep) carry higher risk.
 * Winter smog (Nov-Jan) also slightly elevated for north India.
 */
const getSeasonRisk = (city) => {
  const month = new Date().getMonth(); // 0-indexed
  const isMonsoon = month >= 5 && month <= 8; // Jun-Sep
  const isWinterSmog = month >= 10 || month <= 0; // Nov-Jan
  const northCities = ['delhi', 'kolkata'];

  if (isMonsoon) return 1.4;
  if (isWinterSmog && northCities.includes(city?.toLowerCase())) return 1.2;
  return 1.0;
};

/**
 * More past claims = higher premium (soft penalty).
 */
const getClaimHistoryMultiplier = (claimCount = 0) => {
  if (claimCount === 0) return 0.95; // no-claim bonus
  if (claimCount <= 2) return 1.0;
  if (claimCount <= 5) return 1.1;
  return 1.2; // frequent claimant
};

/**
 * Loyalty discount: 4+ consecutive weeks insured.
 */
const getLoyaltyDiscount = (consecutiveWeeks = 0) => {
  if (consecutiveWeeks >= 12) return 0.88;
  if (consecutiveWeeks >= 8) return 0.92;
  if (consecutiveWeeks >= 4) return 0.95;
  return 1.0;
};

/**
 * Calculate the adjusted premium.
 * @param {number} basePremium - Plan base price (e.g. 49, 99, 149)
 * @param {string} city
 * @param {string} zone - high / medium / low
 * @param {string} platform - zomato / swiggy / zepto etc.
 * @param {object} claimHistory - { count, consecutiveWeeks }
 * @returns {object} { adjustedPremium, breakdown }
 */
const calculatePremium = (basePremium, city, zone, platform, claimHistory = {}) => {
  const cityMultiplier = CITY_RISK[city?.toLowerCase()] || 1.0;
  const zoneMultiplier = ZONE_RISK[zone?.toLowerCase()] || 1.0;
  const platformMultiplier = PLATFORM_RISK[platform?.toLowerCase()] || 1.0;
  const seasonMultiplier = getSeasonRisk(city);
  const claimMultiplier = getClaimHistoryMultiplier(claimHistory.count);
  const loyaltyMultiplier = getLoyaltyDiscount(claimHistory.consecutiveWeeks);

  const rawPremium =
    basePremium *
    cityMultiplier *
    zoneMultiplier *
    platformMultiplier *
    seasonMultiplier *
    claimMultiplier *
    loyaltyMultiplier;

  const adjustedPremium = Math.round(rawPremium);

  return {
    adjustedPremium,
    basePremium,
    breakdown: {
      cityRisk: { city, multiplier: cityMultiplier },
      zoneRisk: { zone, multiplier: zoneMultiplier },
      platformRisk: { platform, multiplier: platformMultiplier },
      seasonRisk: { multiplier: seasonMultiplier },
      claimHistory: { count: claimHistory.count || 0, multiplier: claimMultiplier },
      loyaltyDiscount: { consecutiveWeeks: claimHistory.consecutiveWeeks || 0, multiplier: loyaltyMultiplier },
    },
  };
};

module.exports = { calculatePremium };
