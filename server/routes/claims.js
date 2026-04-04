const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const axios = require('axios');
const { processPayout } = require('../services/payoutService');
const { createNotification } = require('../services/automationPipeline');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// POST /api/claims/initiate - Auto-initiate a claim
router.post('/initiate', async (req, res) => {
  try {
    const { disruptionId, userId, policyId, estimatedLoss } = req.body;

    if (!userId || !policyId) {
      return res.status(400).json({ error: 'userId and policyId are required' });
    }

    // Verify policy exists and is active
    const policyDoc = await db.collection('policies').doc(policyId).get();
    if (!policyDoc.exists) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const policy = policyDoc.data();
    if (policy.status !== 'active') {
      return res.status(400).json({ error: 'Policy is not active' });
    }

    if (policy.userId !== userId) {
      return res.status(403).json({ error: 'Policy does not belong to this user' });
    }

    // Check if policy is expired
    if (new Date(policy.endDate) < new Date()) {
      await db.collection('policies').doc(policyId).update({ status: 'expired' });
      return res.status(400).json({ error: 'Policy has expired' });
    }

    // Calculate max payout based on coverage
    const maxPayout = estimatedLoss
      ? Math.round((estimatedLoss * policy.coveragePercent) / 100)
      : 0;

    const claim = {
      disruptionId: disruptionId || 'manual',
      userId,
      policyId,
      planName: policy.planName || policy.planId,
      estimatedLoss: estimatedLoss || 0,
      coveragePercent: policy.coveragePercent,
      maxPayout,
      payoutAmount: 0,
      status: 'pending',
      fraudFlag: false,
      fraudScore: 0,
      fraudFlags: [],
      automationInitiated: req.body.automationInitiated || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // ML fraud check
    try {
      const riderDoc = await db.collection('riders').doc(userId).get();
      const riderData = riderDoc.exists ? riderDoc.data() : {};

      const fraudRes = await axios.post(`${ML_SERVICE_URL}/api/fraud-check`, {
        rider_id: userId,
        city: riderData.city || '',
        zone: riderData.zone || 'medium',
        platform: riderData.platform || 'zomato',
        claim_amount: maxPayout,
        claim_count: riderData.claimCount || 0,
        consecutive_weeks: riderData.consecutiveWeeks || 0,
        disruption_type: disruptionId ? 'unknown' : 'manual',
      }, { timeout: 5000 });

      const fraudScore = fraudRes.data.fraud_score || fraudRes.data.fraudScore || 0;
      const fraudFlags = fraudRes.data.flags || fraudRes.data.fraud_flags || [];

      claim.fraudScore = fraudScore;
      claim.fraudFlags = fraudFlags;
      claim.fraudFlag = fraudScore > 0.5;

      if (fraudScore > 0.7) {
        claim.status = 'rejected';
        claim.rejectionReason = 'Automated fraud detection';
        claim.rejectedAt = new Date().toISOString();
      } else if (fraudScore < 0.3 && claim.automationInitiated) {
        claim.status = 'approved';
        claim.payoutAmount = maxPayout;
        claim.approvedAt = new Date().toISOString();
        claim.approvalMethod = 'automation';
      }
      // Otherwise stays as 'pending' for manual review
    } catch (mlErr) {
      console.warn('[Claims] ML fraud-check unavailable, keeping pending:', mlErr.message);
    }

    const docRef = await db.collection('claims').add(claim);

    // Process payout if auto-approved
    if (claim.status === 'approved' && claim.payoutAmount > 0) {
      try {
        const payoutRes = await processPayout(userId, claim.payoutAmount, docRef.id);
        await db.collection('claims').doc(docRef.id).update({
          payoutId: payoutRes.payoutId,
          payoutTimestamp: payoutRes.timestamp,
        });
      } catch {
        // ignore payout errors here
      }
    }

    // Update rider claim count
    try {
      const riderDoc = await db.collection('riders').doc(userId).get();
      if (riderDoc.exists) {
        const riderData = riderDoc.data();
        await db.collection('riders').doc(userId).update({
          claimCount: (riderData.claimCount || 0) + 1,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch {
      // ignore
    }

    // Create notification for the rider
    try {
      if (claim.status === 'approved') {
        await createNotification(db, userId, 'claim_approved',
          'Claim Approved',
          `Your claim has been automatically approved. Payout of INR ${claim.payoutAmount} is being processed.`,
          { claimId: docRef.id, payoutAmount: claim.payoutAmount }
        );
      } else if (claim.status === 'rejected') {
        await createNotification(db, userId, 'claim_rejected',
          'Claim Rejected',
          'Your claim has been rejected due to automated fraud detection. Contact support to appeal.',
          { claimId: docRef.id, fraudScore: claim.fraudScore }
        );
      } else {
        await createNotification(db, userId, 'claim_pending',
          'Claim Submitted',
          'Your claim has been submitted and is pending review.',
          { claimId: docRef.id }
        );
      }
    } catch {
      // ignore notification errors
    }

    res.status(201).json({
      message: 'Claim initiated successfully',
      claim: { id: docRef.id, ...claim },
    });
  } catch (err) {
    console.error('[Claims] Initiate error:', err.message);
    res.status(500).json({ error: 'Claim initiation failed', details: err.message });
  }
});

// GET /api/claims/my-claims/:uid - Get user's claims
router.get('/my-claims/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const snapshot = await db.collection('claims').where('userId', '==', uid).get();

    const claims = [];
    snapshot.docs.forEach((doc) => {
      claims.push({ id: doc.id, ...doc.data() });
    });

    res.json({ claims });
  } catch (err) {
    console.error('[Claims] Fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch claims', details: err.message });
  }
});

// PATCH /api/claims/:claimId/approve - Approve a claim and process payout
router.patch('/:claimId/approve', async (req, res) => {
  try {
    const { claimId } = req.params;
    const { payoutAmount } = req.body;

    const claimDoc = await db.collection('claims').doc(claimId).get();
    if (!claimDoc.exists) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    const claim = claimDoc.data();

    if (claim.status !== 'pending') {
      return res.status(400).json({ error: `Claim is already ${claim.status}` });
    }

    const finalPayout = payoutAmount || claim.maxPayout;

    // Process mock payout
    const payoutResult = await processPayout(claim.userId, finalPayout, claimId);

    await db.collection('claims').doc(claimId).update({
      status: 'approved',
      payoutAmount: finalPayout,
      payoutId: payoutResult.payoutId,
      payoutTimestamp: payoutResult.timestamp,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.json({
      message: 'Claim approved and payout processed',
      claimId,
      payoutAmount: finalPayout,
      payout: payoutResult,
    });
  } catch (err) {
    console.error('[Claims] Approve error:', err.message);
    res.status(500).json({ error: 'Claim approval failed', details: err.message });
  }
});

// PATCH /api/claims/:claimId/reject - Reject a claim
router.patch('/:claimId/reject', async (req, res) => {
  try {
    const { claimId } = req.params;
    const { reason } = req.body;

    const claimDoc = await db.collection('claims').doc(claimId).get();
    if (!claimDoc.exists) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    const claim = claimDoc.data();

    if (claim.status !== 'pending') {
      return res.status(400).json({ error: `Claim is already ${claim.status}` });
    }

    await db.collection('claims').doc(claimId).update({
      status: 'rejected',
      rejectionReason: reason || 'No reason provided',
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.json({
      message: 'Claim rejected',
      claimId,
      reason: reason || 'No reason provided',
    });
  } catch (err) {
    console.error('[Claims] Reject error:', err.message);
    res.status(500).json({ error: 'Claim rejection failed', details: err.message });
  }
});

module.exports = router;
