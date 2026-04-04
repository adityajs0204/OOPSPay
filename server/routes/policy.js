const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { calculatePremium } = require('../services/premiumEngine');

const PLANS = [
  {
    id: 'basic',
    name: 'Basic Shield',
    premium: 49,
    coveragePercent: 60,
    description: 'Essential coverage for common disruptions like moderate rain and mild heatwaves.',
    features: ['Rain coverage (moderate)', 'Heatwave coverage', 'Up to 60% earnings protection'],
  },
  {
    id: 'standard',
    name: 'Standard Guard',
    premium: 99,
    coveragePercent: 80,
    description: 'Comprehensive coverage including pollution alerts and regional disruptions.',
    features: [
      'All Basic features',
      'AQI-based disruption coverage',
      'Flood alerts',
      'Up to 80% earnings protection',
      'Priority claim processing',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Fortress',
    premium: 149,
    coveragePercent: 100,
    description: 'Full protection against all disruptions with instant auto-payouts.',
    features: [
      'All Standard features',
      'Cyclone & storm coverage',
      'Curfew / bandh coverage',
      '100% earnings protection',
      'Instant auto-payout',
      'Dedicated support',
    ],
  },
];

// GET /api/policies/plans - Return available plans
router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

// POST /api/policies/purchase - Purchase a policy
router.post('/purchase', async (req, res) => {
  try {
    const { userId, planId, city, zone, platform } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({ error: 'userId and planId are required' });
    }

    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) {
      return res.status(400).json({ error: 'Invalid planId. Choose: basic, standard, or premium' });
    }

    // Fetch rider claim history for dynamic premium
    let claimHistory = { count: 0, consecutiveWeeks: 0 };
    try {
      const riderDoc = await db.collection('riders').doc(userId).get();
      if (riderDoc.exists) {
        const riderData = riderDoc.data();
        claimHistory.count = riderData.claimCount || 0;
        claimHistory.consecutiveWeeks = riderData.consecutiveWeeks || 0;
      }
    } catch {
      // ignore - use defaults
    }

    const { adjustedPremium } = calculatePremium(
      plan.premium,
      city || 'bangalore',
      zone || 'medium',
      platform || 'zomato',
      claimHistory
    );

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const policy = {
      userId,
      planId: plan.id,
      planName: plan.name,
      basePremium: plan.premium,
      premium: adjustedPremium,
      coveragePercent: plan.coveragePercent,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'active',
      city: city || '',
      zone: zone || 'medium',
      platform: platform || 'zomato',
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('policies').add(policy);

    // Increment rider's consecutive weeks
    try {
      const riderDoc = await db.collection('riders').doc(userId).get();
      if (riderDoc.exists) {
        const riderData = riderDoc.data();
        await db.collection('riders').doc(userId).update({
          consecutiveWeeks: (riderData.consecutiveWeeks || 0) + 1,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch {
      // ignore
    }

    res.status(201).json({
      message: 'Policy purchased successfully',
      policy: { id: docRef.id, ...policy },
    });
  } catch (err) {
    console.error('[Policy] Purchase error:', err.message);
    res.status(500).json({ error: 'Policy purchase failed', details: err.message });
  }
});

// GET /api/policies/my-policies/:uid - Get user's policies
router.get('/my-policies/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const snapshot = await db.collection('policies').where('userId', '==', uid).get();

    const policies = [];
    snapshot.docs.forEach((doc) => {
      policies.push({ id: doc.id, ...doc.data() });
    });

    // Mark expired policies
    const now = new Date();
    for (const p of policies) {
      if (p.status === 'active' && new Date(p.endDate) < now) {
        p.status = 'expired';
        try {
          await db.collection('policies').doc(p.id).update({ status: 'expired' });
        } catch {
          // ignore
        }
      }
    }

    res.json({ policies });
  } catch (err) {
    console.error('[Policy] Fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch policies', details: err.message });
  }
});

// POST /api/policies/calculate-premium - Dynamic premium calculation
router.post('/calculate-premium', async (req, res) => {
  try {
    const { planId, city, zone, platform, claimHistory } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'planId is required' });
    }

    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) {
      return res.status(400).json({ error: 'Invalid planId' });
    }

    const result = calculatePremium(
      plan.premium,
      city || 'bangalore',
      zone || 'medium',
      platform || 'zomato',
      claimHistory || {}
    );

    res.json({
      planId: plan.id,
      planName: plan.name,
      ...result,
    });
  } catch (err) {
    console.error('[Policy] Premium calc error:', err.message);
    res.status(500).json({ error: 'Premium calculation failed', details: err.message });
  }
});

module.exports = router;
