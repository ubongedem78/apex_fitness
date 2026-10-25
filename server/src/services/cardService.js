const crypto = require('crypto');
const { User } = require('../models');
const { initializeTransaction, verifyTransaction, refundTransaction } = require('../utils/paystack');

const err = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const CARD_CAPTURE_AMOUNT = 50;

const initializeCardCapture = async (user) => {
  const reference = `APEX-CARD-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

  const paystackResponse = await initializeTransaction({
    email: user.email,
    amount: CARD_CAPTURE_AMOUNT,
    reference,
    metadata: {
      userId: user.id,
      isCardCapture: true,
    },
    callbackUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/register/card-verify?reference=${reference}`,
  });

  return {
    reference,
    accessCode: paystackResponse.data.access_code,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
  };
};

const verifyCardCapture = async ({ reference }, user) => {
  if (!reference) throw err('reference is required', 400);

  const paystackResponse = await verifyTransaction(reference);

  if (!paystackResponse.data || paystackResponse.data.status !== 'success') {
    throw err('Card verification failed. Please try again.', 400);
  }

  const meta = paystackResponse.data.metadata || {};
  if (String(meta.userId) !== String(user.id)) {
    throw err('This card verification does not belong to your account.', 403);
  }

  const { authorization } = paystackResponse.data;
  if (!authorization || !authorization.authorization_code) {
    throw err('No card authorization returned. Please try again.', 400);
  }

  await user.update({
    paystackAuthorizationCode: authorization.authorization_code,
    cardLast4: authorization.last4,
    cardType: authorization.card_type,
    cardBank: authorization.bank,
    cardExpMonth: authorization.exp_month,
    cardExpYear: authorization.exp_year,
  });

  try {
    await refundTransaction({ transactionId: String(paystackResponse.data.id) });
  } catch (_) {
  }

  const updatedUser = await User.findByPk(user.id);

  return {
    cardLast4: authorization.last4,
    cardType: authorization.card_type,
    cardBank: authorization.bank,
    cardExpMonth: authorization.exp_month,
    cardExpYear: authorization.exp_year,
    user: updatedUser,
  };
};

const getCardManageLink = async (user) => {
  const { Subscription } = require('../models');
  const { getSubscriptionManageLink } = require('../utils/paystack');

  const subscription = await Subscription.findOne({
    where: { userId: user.id, status: ['active', 'attention'] },
    order: [['createdAt', 'DESC']],
  });

  if (!subscription || !subscription.paystackSubscriptionCode) {
    throw err('No active subscription found to manage card for', 404);
  }

  const response = await getSubscriptionManageLink(subscription.paystackSubscriptionCode);
  return { manageLink: response.data.link };
};

module.exports = { initializeCardCapture, verifyCardCapture, getCardManageLink };
