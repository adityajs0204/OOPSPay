const express = require('express');
const router = express.Router();
const axios = require('axios');
const { db, auth } = require('../config/firebase');
const { verifyAuth } = require('../middleware/auth');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// POST /api/auth/register - Save rider profile to Firestore
router.post('/register', async (req, res) => {
  try {
    const { uid, name, email, phone, city, zone, platform, avgWeeklyEarnings, vehicleType } = req.body;

    if (!uid || !name || !email) {
      return res.status(400).json({ error: 'uid, name and email are required' });
    }

    const validPlatforms = ['zomato', 'swiggy', 'zepto', 'blinkit', 'dunzo'];
    if (platform && !validPlatforms.includes(platform.toLowerCase())) {
      return res.status(400).json({ error: `platform must be one of: ${validPlatforms.join(', ')}` });
    }

    const profile = {
      uid,
      name,
      email,
      phone: phone || '',
      city: city || '',
      zone: zone || 'medium',
      platform: (platform || 'zomato').toLowerCase(),
      avgWeeklyEarnings: avgWeeklyEarnings || 0,
      vehicleType: vehicleType || 'bike',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      consecutiveWeeks: 0,
      claimCount: 0,
    };

    await db.collection('riders').doc(uid).set(profile);

    res.status(201).json({ message: 'Rider registered successfully', profile });
  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// POST /api/auth/login - Verify Firebase token and return user profile
router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required' });
    }

    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const doc = await db.collection('riders').doc(uid).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Rider profile not found. Please register first.' });
    }

    res.json({ message: 'Login successful', profile: doc.data() });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(401).json({ error: 'Authentication failed', details: err.message });
  }
});

// GET /api/auth/profile/:uid - Get rider profile
router.get('/profile/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const doc = await db.collection('riders').doc(uid).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    res.json({ profile: doc.data() });
  } catch (err) {
    console.error('[Auth] Profile fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch profile', details: err.message });
  }
});

// GET /api/auth/risk-profile/:uid - Get rider's risk profile from ML service
router.get('/risk-profile/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    const riderDoc = await db.collection('riders').doc(uid).get();
    if (!riderDoc.exists) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    const rider = riderDoc.data();

    // Get claim history count
    let claimCount = rider.claimCount || 0;
    try {
      const claimsSnap = await db.collection('claims').where('userId', '==', uid).get();
      claimCount = claimsSnap.docs.length;
    } catch {
      // use rider.claimCount as fallback
    }

    const currentMonth = new Date().getMonth() + 1;

    try {
      const mlRes = await axios.post(`${ML_SERVICE_URL}/api/risk-score`, {
        city: rider.city || 'mumbai',
        zone: rider.zone || 'medium',
        platform: rider.platform || 'zomato',
        claim_history: claimCount,
        month: currentMonth,
      }, { timeout: 5000 });

      res.json({
        uid,
        riskProfile: {
          riskScore: mlRes.data.risk_score || mlRes.data.riskScore,
          premiumMultiplier: mlRes.data.premium_multiplier || mlRes.data.premiumMultiplier,
          riskFactors: mlRes.data.risk_factors || mlRes.data.riskFactors || {},
          riskLevel: mlRes.data.risk_level || mlRes.data.riskLevel,
        },
        riderInfo: {
          city: rider.city,
          zone: rider.zone,
          platform: rider.platform,
          claimCount,
        },
      });
    } catch (mlErr) {
      console.warn('[Auth] ML risk-score unavailable, using fallback:', mlErr.message);

      // Fallback risk calculation
      let baseRisk = 0.5;
      if (claimCount > 5) baseRisk += 0.2;
      else if (claimCount > 2) baseRisk += 0.1;

      const zoneRisk = { high: 0.15, medium: 0, low: -0.1 };
      baseRisk += zoneRisk[rider.zone] || 0;

      // Monsoon months are riskier
      if ([6, 7, 8, 9].includes(currentMonth)) baseRisk += 0.1;

      const riskScore = Math.min(Math.max(baseRisk, 0), 1);
      const premiumMultiplier = 0.8 + riskScore * 0.6;

      let riskLevel = 'medium';
      if (riskScore < 0.3) riskLevel = 'low';
      else if (riskScore > 0.7) riskLevel = 'high';

      res.json({
        uid,
        riskProfile: {
          riskScore: Math.round(riskScore * 100) / 100,
          premiumMultiplier: Math.round(premiumMultiplier * 100) / 100,
          riskFactors: {
            claimHistory: claimCount,
            zone: rider.zone || 'medium',
            seasonalRisk: [6, 7, 8, 9].includes(currentMonth) ? 'high' : 'normal',
          },
          riskLevel,
        },
        riderInfo: {
          city: rider.city,
          zone: rider.zone,
          platform: rider.platform,
          claimCount,
        },
        source: 'fallback',
      });
    }
  } catch (err) {
    console.error('[Auth] Risk profile error:', err.message);
    res.status(500).json({ error: 'Failed to fetch risk profile', details: err.message });
  }
});

module.exports = router;
