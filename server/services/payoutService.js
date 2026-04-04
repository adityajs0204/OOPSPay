/**
 * Payout Service (Mock Razorpay Integration)
 *
 * In production this would call the Razorpay Payouts API.
 * For demo purposes it always returns a successful payout.
 */

const crypto = require('crypto');

/**
 * Process a payout to a rider.
 * @param {string} userId
 * @param {number} amount - INR
 * @param {string} claimId
 * @returns {object} payout result
 */
const processPayout = async (userId, amount, claimId) => {
  const payoutId = `pay_${crypto.randomBytes(8).toString('hex')}`;
  const timestamp = new Date().toISOString();

  // Simulate a small processing delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  console.log(`[Payout] Processed INR ${amount} to user ${userId} for claim ${claimId}`);

  return {
    payoutId,
    status: 'success',
    amount,
    currency: 'INR',
    userId,
    claimId,
    timestamp,
    method: 'bank_transfer',
    message: 'Payout processed successfully (demo mode)',
  };
};

module.exports = { processPayout };
