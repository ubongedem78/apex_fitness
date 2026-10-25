const crypto = require('crypto');
const { Op } = require('sequelize');
const { MembershipPlan, Subscription, Payment, Promotion, Location, User } = require('../models');
const {
  initializeTransaction, chargeAuthorization,
  initializeSubscription,
  disableSubscriptionByCode, enableSubscriptionByCode,
} = require('../utils/paystack');
const { sendPaymentReceipt, sendMembershipActivation } = require('../utils/email');
const { getJoiningFee } = require('./settingService');

const err = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const getPlans = async () => {
  const [plans, joiningFee] = await Promise.all([
    MembershipPlan.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['price', 'ASC']],
    }),
    getJoiningFee().catch(() => 0),
  ]);
  return { plans, joiningFee };
};

const getPlanById = async (planId) => {
  const plan = await MembershipPlan.findByPk(planId);
  if (!plan) throw err('Plan not found', 404);
  return { plan };
};

const applyPromoDiscount = (finalAmount, promo, planId) => {
  if (!promo) return finalAmount;
  if (promo.usageLimit && promo.usageCount >= promo.usageLimit) return finalAmount;
  if (promo.minimumAmount && finalAmount < parseFloat(promo.minimumAmount)) return finalAmount;
  if (promo.applicablePlans && promo.applicablePlans.length > 0 && !promo.applicablePlans.includes(planId)) return finalAmount;

  if (promo.discountType === 'percentage') {
    return finalAmount * (1 - parseFloat(promo.discountAmount) / 100);
  }
  return Math.max(0, finalAmount - parseFloat(promo.discountAmount));
};

const findPromo = async (promoCode) => {
  return Promotion.findOne({
    where: {
      code: promoCode.toUpperCase(),
      isActive: true,
      validFrom: { [Op.lte]: new Date() },
      validTo: { [Op.gte]: new Date() }
    }
  });
};

const isFirstTimeSubscriber = async (userId) => {
  const legacyDailyPassPlans = await MembershipPlan.findAll({
    where: { isDailyPass: true },
    attributes: ['id'],
  });
  const legacyIds = legacyDailyPassPlans.map((p) => p.id);
  const where = { userId };
  if (legacyIds.length > 0) where.planId = { [Op.notIn]: legacyIds };
  const count = await Subscription.count({ where });
  return count === 0;
};

const calcEndDate = (startDate, billingCycle) => {
  const end = new Date(startDate);
  if (billingCycle === 'daily') {
    end.setDate(end.getDate() + 1);
  } else if (billingCycle === 'monthly') {
    end.setMonth(end.getMonth() + 1);
  } else if (billingCycle === 'quarterly') {
    end.setMonth(end.getMonth() + 3);
  } else {
    end.setFullYear(end.getFullYear() + 1);
  }
  return end.toISOString().split('T')[0];
};

const createSubscriptionRecord = async ({ user, plan, locationId, payment, authorizationCode }) => {
  const startDate = new Date().toISOString().split('T')[0];
  const endDate = calcEndDate(startDate, plan.billingCycle);

  await Subscription.update(
    { status: 'cancelled', cancelledAt: new Date(), cancelReason: 'Replaced by new subscription' },
    { where: { userId: user.id, status: ['active', 'attention'] } }
  );

  const subscription = await Subscription.create({
    userId: user.id,
    planId: plan.id,
    locationId: locationId || null,
    status: 'active',
    startDate,
    endDate,
    nextBillingDate: endDate,
    paystackAuthorizationCode: authorizationCode || null,
  });

  await payment.update({ subscriptionId: subscription.id });

  if (plan.paystackPlanCode && authorizationCode) {
    try {
      const subResponse = await initializeSubscription({
        planCode: plan.paystackPlanCode,
        email: user.email,
        authorizationCode,
        startDate: endDate,
      });
      if (subResponse.data && subResponse.data.subscription_code) {
        await subscription.update({ paystackSubscriptionCode: subResponse.data.subscription_code });
      }
    } catch (_) {}
  }

  return subscription;
};

const subscribe = async ({ planId, locationId, promoCode }, user) => {
  if (!planId) throw err('planId is required', 400);

  const plan = await MembershipPlan.findByPk(planId);
  if (!plan || !plan.isActive) throw err('Plan not found or inactive', 404);

  if ((plan.locationAccess === 'single' || plan.isDailyPass) && !locationId) {
    throw err('locationId is required for this plan', 400);
  }

  if (locationId) {
    const location = await Location.findByPk(locationId);
    if (!location) throw err('Location not found', 404);
  }

  const guardToday = new Date().toISOString().split('T')[0];
  const currentAccess = await Subscription.findOne({
    where: { userId: user.id, status: ['active', 'paused'], endDate: { [Op.gte]: guardToday } },
  });
  if (currentAccess) {
    throw err(`You already have an active membership until ${currentAccess.endDate}. You do not need to pay again.`, 400);
  }

  let finalAmount = parseFloat(plan.price);

  const firstTime = await isFirstTimeSubscriber(user.id);
  const globalJoiningFee = firstTime ? await getJoiningFee().catch(() => 0) : 0;
  const joiningFeeAmount = globalJoiningFee > 0 ? globalJoiningFee : 0;
  if (joiningFeeAmount > 0) finalAmount += joiningFeeAmount;

  if (promoCode) {
    const promo = await findPromo(promoCode);
    if (promo) finalAmount = applyPromoDiscount(finalAmount, promo, planId);
  }

  const reference = `APEX-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

  const description = joiningFeeAmount > 0
    ? `${plan.name} + Joining Fee`
    : `${plan.name} - ${plan.billingCycle} subscription`;

  if (user.paystackAuthorizationCode) {
    const chargeResponse = await chargeAuthorization({
      email: user.email,
      amount: finalAmount,
      authorizationCode: user.paystackAuthorizationCode,
      reference,
      metadata: {
        userId: user.id,
        planId,
        locationId: locationId || null,
        joiningFee: joiningFeeAmount,
      },
    });

    if (!chargeResponse.data || chargeResponse.data.status !== 'success') {
      throw err('Payment failed. Please update your card and try again.', 402);
    }

    const payment = await Payment.create({
      userId: user.id,
      amount: finalAmount,
      joiningFee: joiningFeeAmount,
      currency: 'NGN',
      type: 'subscription',
      status: 'success',
      paystackReference: reference,
      paystackTransactionId: String(chargeResponse.data.id),
      description,
      metadata: {
        planId,
        locationId: locationId || null,
        originalAmount: plan.price,
        joiningFee: joiningFeeAmount,
        isDailyPass: plan.isDailyPass || false,
      },
    });

    const subscription = await createSubscriptionRecord({
      user,
      plan,
      locationId,
      payment,
      authorizationCode: user.paystackAuthorizationCode,
    });

    sendPaymentReceipt(user, payment).catch((e) => {
      console.error('[email] sendPaymentReceipt failed:', e?.message || e);
    });
    sendMembershipActivation(user, plan, subscription).catch((e) => {
      console.error('[email] sendMembershipActivation failed:', e?.message || e);
    });

    return {
      charged: true,
      payment,
      subscription,
      amount: finalAmount,
      joiningFee: joiningFeeAmount,
      planPrice: parseFloat(plan.price),
    };
  }

  const paystackResponse = await initializeTransaction({
    email: user.email,
    amount: finalAmount,
    reference,
    metadata: {
      userId: user.id,
      planId,
      locationId: locationId || null,
      joiningFee: joiningFeeAmount,
    },
    callbackUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/memberships/verify?reference=${reference}`,
  });

  await Payment.create({
    userId: user.id,
    amount: finalAmount,
    joiningFee: joiningFeeAmount,
    currency: 'NGN',
    type: 'subscription',
    status: 'pending',
    paystackReference: reference,
    description,
    metadata: {
      planId,
      locationId: locationId || null,
      originalAmount: plan.price,
      joiningFee: joiningFeeAmount,
      isDailyPass: plan.isDailyPass || false,
    },
  });

  return {
    checkoutUrl: paystackResponse.data.authorization_url,
    reference,
    amount: finalAmount,
    joiningFee: joiningFeeAmount,
    planPrice: parseFloat(plan.price),
  };
};

const verifyPayment = async ({ reference }, user) => {
  if (!reference) throw err('reference is required', 400);

  const payment = await Payment.findOne({ where: { paystackReference: reference, userId: user.id } });
  if (!payment) throw err('Payment not found', 404);

  if (payment.status === 'success' && payment.subscriptionId) {
    const subscription = await Subscription.findByPk(payment.subscriptionId);
    return { message: 'Payment already verified', payment, subscription };
  }

  const { verifyTransaction } = require('../utils/paystack');
  const paystackResponse = await verifyTransaction(reference);

  if (!paystackResponse.data || paystackResponse.data.status !== 'success') {
    const refreshed = await Payment.findOne({ where: { id: payment.id } });
    if (refreshed && refreshed.status === 'success' && refreshed.subscriptionId) {
      const subscription = await Subscription.findByPk(refreshed.subscriptionId);
      return { message: 'Payment verified', payment: refreshed, subscription };
    }
    throw err('Payment verification failed. Please try again in a moment.', 400);
  }

  await payment.update({
    status: 'success',
    paystackTransactionId: String(paystackResponse.data.id),
  });

  const { planId, locationId } = payment.metadata;
  const plan = await MembershipPlan.findByPk(planId);
  const authorizationCode = paystackResponse.data.authorization?.authorization_code || null;

  if (authorizationCode && !user.cardLast4 && paystackResponse.data.authorization) {
    const auth = paystackResponse.data.authorization;
    await user.update({
      paystackAuthorizationCode: authorizationCode,
      cardLast4: auth.last4,
      cardType: auth.card_type,
      cardBank: auth.bank,
      cardExpMonth: auth.exp_month,
      cardExpYear: auth.exp_year,
    });
  }

  const freshPayment = await Payment.findOne({ where: { id: payment.id } });
  if (freshPayment && freshPayment.subscriptionId) {
    const existingSub = await Subscription.findByPk(freshPayment.subscriptionId);
    return { payment: freshPayment, subscription: existingSub };
  }

  const subscription = await createSubscriptionRecord({
    user,
    plan,
    locationId,
    payment,
    authorizationCode,
  });

  sendPaymentReceipt(user, payment).catch((e) => {
    console.error('[email] sendPaymentReceipt failed:', e?.message || e);
  });
  sendMembershipActivation(user, plan, subscription).catch((e) => {
    console.error('[email] sendMembershipActivation failed:', e?.message || e);
  });

  return { payment, subscription };
};

const applyPromo = async ({ code, planId, amount }, user) => {
  if (!code || !amount) throw err('code and amount are required', 400);

  const promo = await findPromo(code);
  if (!promo) throw err('Invalid or expired promo code', 404);

  if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
    throw err('Promo code usage limit reached', 400);
  }

  if (promo.minimumAmount && parseFloat(amount) < parseFloat(promo.minimumAmount)) {
    throw err(`Minimum order amount is ${promo.minimumAmount}`, 400);
  }

  if (planId && promo.applicablePlans && promo.applicablePlans.length > 0 && !promo.applicablePlans.includes(planId)) {
    throw err('Promo code not valid for this plan', 400);
  }

  let discountedAmount;
  let discountApplied;
  if (promo.discountType === 'percentage') {
    discountApplied = parseFloat(amount) * parseFloat(promo.discountAmount) / 100;
    discountedAmount = parseFloat(amount) - discountApplied;
  } else {
    discountApplied = parseFloat(promo.discountAmount);
    discountedAmount = Math.max(0, parseFloat(amount) - discountApplied);
  }

  return {
    promo: { id: promo.id, name: promo.name, code: promo.code, discountType: promo.discountType, discountAmount: promo.discountAmount },
    originalAmount: parseFloat(amount),
    discountApplied: parseFloat(discountApplied.toFixed(2)),
    finalAmount: parseFloat(discountedAmount.toFixed(2)),
  };
};

const cancelMembership = async (body, user) => {
  const { cancelReason } = body || {};
  const subscription = await Subscription.findOne({
    where: { userId: user.id, status: ['active', 'paused', 'attention'] }
  });
  if (!subscription) throw err('No active subscription found', 404);

  const today = new Date().toISOString().split('T')[0];
  const alreadyEnded = subscription.endDate && subscription.endDate < today;

  await subscription.update({
    status: alreadyEnded ? 'expired' : subscription.status,
    cancelledAt: new Date(),
    cancelReason: cancelReason || null,
  });

  if (subscription.paystackSubscriptionCode) {
    try {
      await disableSubscriptionByCode(subscription.paystackSubscriptionCode);
    } catch (_) {}
  }

  const message = alreadyEnded
    ? 'Subscription cancelled. It will not renew.'
    : `Subscription cancelled. You keep access until ${subscription.endDate}, and it will not renew.`;
  return { message, subscription };
};

const resumeMembership = async (user) => {
  const today = new Date().toISOString().split('T')[0];
  const subscription = await Subscription.findOne({
    where: {
      userId: user.id,
      status: ['active', 'attention', 'paused'],
      cancelledAt: { [Op.ne]: null },
      endDate: { [Op.gte]: today },
    },
    order: [['createdAt', 'DESC']],
  });
  if (!subscription) throw err('No cancelled membership to resume', 404);

  if (subscription.paystackSubscriptionCode) {
    try {
      await enableSubscriptionByCode(subscription.paystackSubscriptionCode);
    } catch (_) {}
  }

  await subscription.update({ cancelledAt: null, cancelReason: null });

  return { message: `Membership resumed. It will renew on ${subscription.endDate} as normal.`, subscription };
};

const upgrade = async ({ planId, locationId, promoCode }, user) => {
  if (!planId) throw err('planId is required', 400);

  const plan = await MembershipPlan.findByPk(planId);
  if (!plan || !plan.isActive) throw err('Plan not found or inactive', 404);

  if (plan.locationAccess === 'single' && !locationId) {
    throw err('locationId is required for single-location plans', 400);
  }

  if (locationId) {
    const location = await Location.findByPk(locationId);
    if (!location) throw err('Location not found', 404);
  }

  let finalAmount = parseFloat(plan.price);

  const firstTime = await isFirstTimeSubscriber(user.id);
  const globalJoiningFee = firstTime ? await getJoiningFee().catch(() => 0) : 0;
  const joiningFeeAmount = globalJoiningFee > 0 ? globalJoiningFee : 0;
  if (joiningFeeAmount > 0) finalAmount += joiningFeeAmount;

  if (promoCode) {
    const promo = await findPromo(promoCode);
    if (promo && (!promo.usageLimit || promo.usageCount < promo.usageLimit)) {
      finalAmount = applyPromoDiscount(finalAmount, promo, planId);
    }
  }

  const reference = `APEX-UPG-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  const description = joiningFeeAmount > 0 ? `${plan.name} + Joining Fee` : `${plan.name} - ${plan.billingCycle} upgrade`;

  if (user.paystackAuthorizationCode) {
    const chargeResponse = await chargeAuthorization({
      email: user.email,
      amount: finalAmount,
      authorizationCode: user.paystackAuthorizationCode,
      reference,
      metadata: { userId: user.id, planId, locationId: locationId || null, joiningFee: joiningFeeAmount, isUpgrade: true },
    });

    if (!chargeResponse.data || chargeResponse.data.status !== 'success') {
      throw err('Payment failed. Please update your card and try again.', 402);
    }

    const payment = await Payment.create({
      userId: user.id,
      amount: finalAmount,
      joiningFee: joiningFeeAmount,
      currency: 'NGN',
      type: 'subscription',
      status: 'success',
      paystackReference: reference,
      paystackTransactionId: String(chargeResponse.data.id),
      description,
      metadata: {
        planId,
        locationId: locationId || null,
        originalAmount: plan.price,
        joiningFee: joiningFeeAmount,
        isUpgrade: true,
      },
    });

    const subscription = await createSubscriptionRecord({
      user, plan, locationId, payment,
      authorizationCode: user.paystackAuthorizationCode,
    });

    sendPaymentReceipt(user, payment).catch(() => {});
    sendMembershipActivation(user, plan, subscription).catch(() => {});

    return { charged: true, payment, subscription, amount: finalAmount, joiningFee: joiningFeeAmount };
  }

  const paystackResponse = await initializeTransaction({
    email: user.email,
    amount: finalAmount,
    reference,
    metadata: { userId: user.id, planId, locationId: locationId || null, joiningFee: joiningFeeAmount, isUpgrade: true },
    callbackUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/memberships/verify?reference=${reference}`,
  });

  await Payment.create({
    userId: user.id,
    amount: finalAmount,
    joiningFee: joiningFeeAmount,
    currency: 'NGN',
    type: 'subscription',
    status: 'pending',
    paystackReference: reference,
    description,
    metadata: {
      planId,
      locationId: locationId || null,
      originalAmount: plan.price,
      joiningFee: joiningFeeAmount,
      isUpgrade: true,
    },
  });

  return { checkoutUrl: paystackResponse.data.authorization_url, reference, amount: finalAmount, joiningFee: joiningFeeAmount };
};

module.exports = { getPlans, getPlanById, subscribe, verifyPayment, applyPromo, cancelMembership, resumeMembership, upgrade, isFirstTimeSubscriber };
