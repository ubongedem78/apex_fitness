const crypto = require('crypto');
const { Op } = require('sequelize');
const { LockerSubscription, Payment, User, Subscription } = require('../models');
const { getSetting } = require('./settingService');
const {
  initializeTransaction,
  chargeAuthorization,
  initializeSubscription,
  disableSubscriptionByCode,
} = require('../utils/paystack');
const { sendPaymentReceipt } = require('../utils/email');

const err = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const getLockerPrices = async () => {
  const [monthlyPrice, quarterlyPrice, monthlyPlanCode, quarterlyPlanCode, setupFee] = await Promise.all([
    getSetting('locker_monthly_price').catch(() => '0'),
    getSetting('locker_quarterly_price').catch(() => '0'),
    getSetting('locker_paystack_monthly_plan_code').catch(() => ''),
    getSetting('locker_paystack_quarterly_plan_code').catch(() => ''),
    getSetting('locker_setup_fee').catch(() => '0'),
  ]);
  return {
    monthly: parseFloat(monthlyPrice) || 0,
    quarterly: parseFloat(quarterlyPrice) || 0,
    monthlyPlanCode: monthlyPlanCode || '',
    quarterlyPlanCode: quarterlyPlanCode || '',
    setupFee: parseFloat(setupFee) || 0,
  };
};

const isFirstLocker = async (userId) => {
  const prior = await LockerSubscription.findOne({ where: { userId } });
  return !prior;
};

const calcLockerEndDate = (startDate, billingCycle) => {
  const end = new Date(startDate);
  if (billingCycle === 'quarterly') {
    end.setMonth(end.getMonth() + 3);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end.toISOString().split('T')[0];
};

const getMyLocker = async (user) => {
  const today = new Date().toISOString().split('T')[0];
  let locker = await LockerSubscription.findOne({
    where: { userId: user.id, status: 'active' },
    order: [['createdAt', 'DESC']],
  });
  if (locker && locker.endDate && locker.endDate < today) {
    await locker.update({ status: 'expired' });
    locker = null;
  }
  const prices = await getLockerPrices();
  const setupFeeApplies = await isFirstLocker(user.id);
  return {
    locker: locker || null,
    setupFee: prices.setupFee,
    setupFeeApplies,
  };
};

const subscribe = async ({ billingCycle }, user) => {
  if (!billingCycle || !['monthly', 'quarterly'].includes(billingCycle)) {
    throw err('billingCycle must be monthly or quarterly', 400);
  }

  const today = new Date().toISOString().split('T')[0];
  const membership = await Subscription.findOne({
    where: { userId: user.id, status: 'active', endDate: { [Op.gte]: today } },
  });
  if (!membership) throw err('You need an active membership to rent a locker. Please subscribe to a plan first.', 403);

  const existing = await LockerSubscription.findOne({
    where: { userId: user.id, status: 'active', endDate: { [Op.gte]: today } },
  });
  if (existing) throw err('You already have an active locker subscription', 400);

  const prices = await getLockerPrices();
  const amount = billingCycle === 'quarterly' ? prices.quarterly : prices.monthly;
  if (!amount || amount <= 0) throw err('Locker pricing is not configured. Please contact us.', 503);

  const setupFee = (await isFirstLocker(user.id)) ? (prices.setupFee || 0) : 0;
  const chargeAmount = amount + setupFee;

  const planCode = billingCycle === 'quarterly' ? prices.quarterlyPlanCode : prices.monthlyPlanCode;
  const reference = `APEX-LKR-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  const cycleLabel = billingCycle === 'quarterly' ? 'Quarterly' : 'Monthly';
  const description = setupFee > 0
    ? `Locker Rental (${cycleLabel}) + Setup Fee`
    : `Locker Rental - ${cycleLabel}`;
  const startDate = new Date().toISOString().split('T')[0];
  const endDate = calcLockerEndDate(startDate, billingCycle);

  if (user.paystackAuthorizationCode) {
    const chargeResponse = await chargeAuthorization({
      email: user.email,
      amount: chargeAmount,
      authorizationCode: user.paystackAuthorizationCode,
      reference,
      metadata: { userId: user.id, billingCycle, type: 'locker', setupFee },
    });

    if (!chargeResponse.data || chargeResponse.data.status !== 'success') {
      throw err('Payment failed. Please update your card and try again.', 402);
    }

    const payment = await Payment.create({
      userId: user.id,
      amount: chargeAmount,
      currency: 'NGN',
      type: 'locker',
      status: 'success',
      paystackReference: reference,
      paystackTransactionId: String(chargeResponse.data.id),
      description,
      metadata: { billingCycle, type: 'locker', setupFee, recurringAmount: amount },
    });

    const locker = await LockerSubscription.create({
      userId: user.id,
      billingCycle,
      status: 'active',
      startDate,
      endDate,
      authorizationCode: user.paystackAuthorizationCode,
      termsAcceptedAt: new Date(),
    });

    if (planCode) {
      try {
        const subRes = await initializeSubscription({
          planCode,
          email: user.email,
          authorizationCode: user.paystackAuthorizationCode,
          startDate: endDate,
        });
        if (subRes.data?.subscription_code) {
          await locker.update({ paystackSubscriptionCode: subRes.data.subscription_code });
        }
        if (subRes.data?.customer?.customer_code) {
          await locker.update({ paystackCustomerCode: subRes.data.customer.customer_code });
        }
      } catch (_) {}
    }

    sendPaymentReceipt(user, payment).catch((e) => {
      console.error('[email] locker sendPaymentReceipt failed:', e?.message || e);
    });

    return { charged: true, locker, payment };
  }

  const paystackResponse = await initializeTransaction({
    email: user.email,
    amount: chargeAmount,
    reference,
    metadata: { userId: user.id, billingCycle, type: 'locker', setupFee },
    callbackUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/locker/verify?reference=${reference}&billingCycle=${billingCycle}`,
  });

  await Payment.create({
    userId: user.id,
    amount: chargeAmount,
    currency: 'NGN',
    type: 'locker',
    status: 'pending',
    paystackReference: reference,
    description,
    metadata: { billingCycle, type: 'locker', setupFee, recurringAmount: amount },
  });

  return { checkoutUrl: paystackResponse.data.authorization_url, reference, amount: chargeAmount, setupFee };
};

const cancelLocker = async (user) => {
  const locker = await LockerSubscription.findOne({
    where: { userId: user.id, status: 'active' },
  });
  if (!locker) throw err('No active locker subscription found', 404);

  const today = new Date().toISOString().split('T')[0];
  const alreadyEnded = locker.endDate && locker.endDate < today;

  await locker.update({
    status: alreadyEnded ? 'expired' : locker.status,
    cancelledAt: new Date(),
  });

  if (locker.paystackSubscriptionCode) {
    try {
      await disableSubscriptionByCode(locker.paystackSubscriptionCode);
    } catch (_) {}
  }

  const message = alreadyEnded
    ? 'Locker subscription cancelled. It will not renew.'
    : `Locker subscription cancelled. You keep access until ${locker.endDate}, and it will not renew.`;
  return { message, locker };
};

module.exports = { getMyLocker, subscribe, cancelLocker, getLockerPrices };
