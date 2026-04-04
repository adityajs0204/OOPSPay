const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET /api/admin/dashboard - Aggregate stats
router.get('/dashboard', async (req, res) => {
  try {
    const [policiesSnap, claimsSnap] = await Promise.all([
      db.collection('policies').get(),
      db.collection('claims').get(),
    ]);

    const policies = policiesSnap.docs.map((d) => d.data());
    const claims = claimsSnap.docs.map((d) => d.data());

    const totalPolicies = policies.length;
    const activePolicies = policies.filter((p) => p.status === 'active').length;
    const expiredPolicies = policies.filter((p) => p.status === 'expired').length;
    const totalPremiumCollected = policies.reduce((sum, p) => sum + (p.premium || 0), 0);

    const totalClaims = claims.length;
    const pendingClaims = claims.filter((c) => c.status === 'pending').length;
    const approvedClaims = claims.filter((c) => c.status === 'approved').length;
    const rejectedClaims = claims.filter((c) => c.status === 'rejected').length;
    const totalPayouts = claims.reduce((sum, c) => sum + (c.payoutAmount || 0), 0);
    const totalEstimatedLoss = claims.reduce((sum, c) => sum + (c.estimatedLoss || 0), 0);

    const lossRatio = totalPremiumCollected > 0
      ? Math.round((totalPayouts / totalPremiumCollected) * 100) / 100
      : 0;

    const avgClaimAmount = approvedClaims > 0
      ? Math.round(totalPayouts / approvedClaims)
      : 0;

    // Fetch recent activity (last 10 notifications across all users)
    let recentActivity = [];
    try {
      const notifSnap = await db.collection('notifications').get();
      recentActivity = notifSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      recentActivity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      recentActivity = recentActivity.slice(0, 10);
    } catch {
      // ignore
    }

    // Automation stats from claims data
    const autoApproved = claims.filter((c) => c.approvalMethod === 'automation').length;
    const autoRejected = claims.filter((c) => c.status === 'rejected' && c.automationInitiated).length;
    const manualReview = claims.filter((c) => c.status === 'flagged' || (c.status === 'pending' && c.automationInitiated)).length;
    const processingTimes = claims
      .filter((c) => c.approvedAt && c.createdAt)
      .map((c) => new Date(c.approvedAt) - new Date(c.createdAt));
    const avgProcessingTime = processingTimes.length > 0
      ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
      : 0;

    // Predictive data: mock next-week disruption forecast
    const month = new Date().getMonth() + 1;
    const isMonsoon = [6, 7, 8, 9].includes(month);
    const isWinter = [11, 12, 1, 2].includes(month);
    const predictiveData = {
      forecast: [
        {
          city: 'Mumbai',
          type: isMonsoon ? 'flood' : isWinter ? 'pollution' : 'heatwave',
          probability: isMonsoon ? 0.75 : isWinter ? 0.6 : 0.4,
          expectedSeverity: isMonsoon ? 'high' : 'medium',
        },
        {
          city: 'Delhi',
          type: isWinter ? 'pollution' : isMonsoon ? 'rain' : 'heatwave',
          probability: isWinter ? 0.85 : isMonsoon ? 0.65 : 0.5,
          expectedSeverity: isWinter ? 'critical' : 'medium',
        },
        {
          city: 'Bangalore',
          type: isMonsoon ? 'rain' : 'heatwave',
          probability: isMonsoon ? 0.6 : 0.35,
          expectedSeverity: 'medium',
        },
      ],
      season: isMonsoon ? 'monsoon' : isWinter ? 'winter' : 'summer',
      generatedAt: new Date().toISOString(),
    };

    res.json({
      dashboard: {
        policies: {
          total: totalPolicies,
          active: activePolicies,
          expired: expiredPolicies,
          totalPremiumCollected,
        },
        claims: {
          total: totalClaims,
          pending: pendingClaims,
          approved: approvedClaims,
          rejected: rejectedClaims,
          totalPayouts,
          totalEstimatedLoss,
          avgClaimAmount,
        },
        financials: {
          lossRatio,
          profitMargin: totalPremiumCollected > 0
            ? Math.round(((totalPremiumCollected - totalPayouts) / totalPremiumCollected) * 100) / 100
            : 0,
        },
        recentActivity,
        automationStats: {
          autoApproved,
          autoRejected,
          manualReview,
          avgProcessingTime,
        },
        predictiveData,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[Admin] Dashboard error:', err.message);
    res.status(500).json({ error: 'Failed to load dashboard', details: err.message });
  }
});

// GET /api/admin/fraud-flags - Get flagged claims
router.get('/fraud-flags', async (req, res) => {
  try {
    const snapshot = await db.collection('claims').where('fraudFlag', '==', true).get();

    const flaggedClaims = [];
    snapshot.docs.forEach((doc) => {
      flaggedClaims.push({ id: doc.id, ...doc.data() });
    });

    // Also check for suspicious patterns: multiple claims in a short window
    const allClaimsSnap = await db.collection('claims').get();
    const allClaims = allClaimsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Group claims by userId
    const userClaims = {};
    for (const claim of allClaims) {
      if (!userClaims[claim.userId]) userClaims[claim.userId] = [];
      userClaims[claim.userId].push(claim);
    }

    const suspiciousUsers = [];
    for (const [userId, claims] of Object.entries(userClaims)) {
      // Flag users with 3+ claims in the last 7 days
      const recentClaims = claims.filter((c) => {
        const created = new Date(c.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created >= weekAgo;
      });

      if (recentClaims.length >= 3) {
        suspiciousUsers.push({
          userId,
          recentClaimCount: recentClaims.length,
          reason: 'Multiple claims within 7 days',
          claims: recentClaims.map((c) => c.id),
        });
      }
    }

    res.json({
      flaggedClaims,
      suspiciousUsers,
      totalFlags: flaggedClaims.length + suspiciousUsers.length,
    });
  } catch (err) {
    console.error('[Admin] Fraud flags error:', err.message);
    res.status(500).json({ error: 'Failed to fetch fraud flags', details: err.message });
  }
});

// PATCH /api/admin/override/:claimId - Manual override for edge cases
router.patch('/override/:claimId', async (req, res) => {
  try {
    const { claimId } = req.params;
    const { action, payoutAmount, reason, fraudFlag } = req.body;

    const claimDoc = await db.collection('claims').doc(claimId).get();
    if (!claimDoc.exists) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    const updates = {
      overrideBy: 'admin',
      overrideReason: reason || 'Admin manual override',
      overrideAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (action === 'approve') {
      updates.status = 'approved';
      updates.payoutAmount = payoutAmount || claimDoc.data().maxPayout || 0;
    } else if (action === 'reject') {
      updates.status = 'rejected';
      updates.rejectionReason = reason || 'Admin override';
    } else if (action === 'flag') {
      updates.fraudFlag = true;
      updates.fraudReason = reason || 'Flagged by admin';
    } else if (action === 'unflag') {
      updates.fraudFlag = false;
    }

    if (typeof fraudFlag === 'boolean') {
      updates.fraudFlag = fraudFlag;
    }

    await db.collection('claims').doc(claimId).update(updates);

    res.json({
      message: 'Override applied successfully',
      claimId,
      updates,
    });
  } catch (err) {
    console.error('[Admin] Override error:', err.message);
    res.status(500).json({ error: 'Override failed', details: err.message });
  }
});

// GET /api/admin/claims/live-feed - Last 20 claims for live feed
router.get('/claims/live-feed', async (req, res) => {
  try {
    const claimsSnap = await db.collection('claims').get();

    let claims = claimsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Sort by createdAt descending, take last 20
    claims.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    claims = claims.slice(0, 20);

    res.json({ claims });
  } catch (err) {
    console.error('[Admin] Live feed error:', err.message);
    res.status(500).json({ error: 'Failed to fetch live feed', details: err.message });
  }
});

module.exports = router;
