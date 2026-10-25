const crypto = require('crypto');
const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const { User, Subscription, Booking, Payment, MembershipPlan, Class, Trainer, Location, Notification, LockerSubscription } = require('../../models');
const { paginate, paginateResponse } = require('../../utils/pagination');
const { resolveAccess } = require('../../utils/accessStatus');
const { getJoiningFee } = require('../settingService');
const { isFirstTimeSubscriber } = require('../membershipService');

const getAll = async (query) => {
  const { search, status, planId } = query;
  const { page, limit, offset } = paginate(query);

  const where = { role: 'member' };
  if (status === 'active') where.isActive = true;
  if (status === 'suspended') where.isActive = false;
  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const includeOptions = [];
  if (planId) {
    includeOptions.push({
      model: Subscription,
      where: { planId, status: 'active' },
      required: true,
      include: [{ model: MembershipPlan, as: 'plan' }]
    });
  } else {
    includeOptions.push({
      model: Subscription,
      required: false,
      where: { status: 'active' },
      include: [{ model: MembershipPlan, as: 'plan' }]
    });
  }

  const { count, rows } = await User.findAndCountAll({
    where,

    attributes: {
      exclude: [
        'cardLast4', 'cardType', 'cardBank', 'cardExpMonth', 'cardExpYear',
        'paystackCustomerCode', 'paystackAuthorizationCode',
        'twoFactorSecret', 'twoFactorEnabled',
        'passwordResetToken', 'passwordResetExpiry', 'emailVerificationToken',
      ],
    },
    include: includeOptions,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    distinct: true
  });

  return paginateResponse(rows, count, page, limit);
};

const getOne = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: {
      exclude: [
        'cardLast4', 'cardType', 'cardBank', 'cardExpMonth', 'cardExpYear',
        'paystackCustomerCode', 'paystackAuthorizationCode',
        'twoFactorSecret', 'twoFactorEnabled',
        'passwordResetToken', 'passwordResetExpiry', 'emailVerificationToken',
      ],
    },
    include: [
      {
        model: Subscription,
        include: [{ model: MembershipPlan, as: 'plan' }, { model: Location, attributes: ['id', 'name'] }],
        order: [['createdAt', 'DESC']],
        limit: 1
      }
    ]
  });

  if (!user || user.role !== 'member') {
    const err = new Error('Member not found');
    err.statusCode = 404;
    throw err;
  }

  const recentBookings = await Booking.findAll({
    where: { userId },
    include: [
      {
        model: Class,
        include: [
          { model: Trainer, include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }] },
          { model: Location, attributes: ['id', 'name'] }
        ]
      }
    ],
    order: [['bookedAt', 'DESC']],
    limit: 5
  });

  const recentPayments = await Payment.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: 5
  });

  const today = new Date().toISOString().split('T')[0];
  const lockerSub = await LockerSubscription.findOne({ where: { userId }, order: [['createdAt', 'DESC']] });
  if (lockerSub && lockerSub.status === 'active' && lockerSub.endDate && lockerSub.endDate < today) {
    await lockerSub.update({ status: 'expired' });
  }
  const locker = lockerSub
    ? { billingCycle: lockerSub.billingCycle, ...resolveAccess(lockerSub, { noun: 'Locker subscription', today }) }
    : null;

  return { user, recentBookings, recentPayments, locker };
};

const update = async (userId, body) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('Member not found');
    err.statusCode = 404;
    throw err;
  }

  if (user.role !== 'member') {
    const err = new Error('Member not found');
    err.statusCode = 404;
    throw err;
  }

  const allowedFields = ['firstName', 'lastName', 'phone', 'isEmailVerified', 'dateOfBirth', 'gender', 'emergencyContactName', 'emergencyContactPhone', 'avatarUrl'];
  const updates = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  await user.update(updates);
  return { user };
};

const suspend = async (userId, adminUser) => {
  const user = await User.findByPk(userId);
  if (!user || user.role !== 'member') {
    const err = new Error('Member not found');
    err.statusCode = 404;
    throw err;
  }

  await user.update({ isActive: false });

  await Notification.create({
    userId: user.id,
    title: 'Account Suspended',
    message: 'Your account has been suspended. Please contact support for assistance.',
    type: 'general',
    metadata: { suspendedBy: adminUser.id }
  });

  return { message: 'Member suspended', user };
};

const reactivate = async (userId, adminUser) => {
  const user = await User.findByPk(userId);
  if (!user || user.role !== 'member') {
    const err = new Error('Member not found');
    err.statusCode = 404;
    throw err;
  }

  await user.update({ isActive: true });

  await Notification.create({
    userId: user.id,
    title: 'Account Reactivated',
    message: 'Your account has been reactivated. Welcome back!',
    type: 'general',
    metadata: { reactivatedBy: adminUser.id }
  });

  return { message: 'Member reactivated', user };
};

const assertMember = async (userId) => {
  const member = await User.findByPk(userId, { attributes: ['id', 'role'] });
  if (!member || member.role !== 'member') {
    const err = new Error('Member not found');
    err.statusCode = 404;
    throw err;
  }
};

const getBookings = async (userId, query) => {
  await assertMember(userId);
  const { page, limit, offset } = paginate(query);

  const { count, rows } = await Booking.findAndCountAll({
    where: { userId },
    include: [
      {
        model: Class,
        include: [
          { model: Trainer, include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }] },
          { model: Location, attributes: ['id', 'name'] }
        ]
      }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return paginateResponse(rows, count, page, limit);
};

const getPayments = async (userId, query) => {
  await assertMember(userId);
  const { page, limit, offset } = paginate(query);

  const { count, rows } = await Payment.findAndCountAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return paginateResponse(rows, count, page, limit);
};

const activateSubscription = async (userId, { planId, billingCycle, locationId, paymentMethod, notes, startDate, includeJoiningFee }, adminUser) => {
  if (!planId) {
    const err = new Error('planId is required');
    err.statusCode = 400;
    throw err;
  }

  const member = await User.findByPk(userId);
  if (!member || member.role !== 'member') {
    const err = new Error('Member not found');
    err.statusCode = 404;
    throw err;
  }

  const plan = await MembershipPlan.findByPk(planId);
  if (!plan || !plan.isActive) {
    const err = new Error('Plan not found or inactive');
    err.statusCode = 404;
    throw err;
  }

  const start = startDate ? new Date(startDate) : new Date();
  const end = new Date(start);

  const cycle = billingCycle || plan.billingCycle || 'monthly';
  switch (cycle) {
    case 'annual':    end.setFullYear(end.getFullYear() + 1); break;
    case 'biannual':  end.setMonth(end.getMonth() + 6); break;
    case 'quarterly': end.setMonth(end.getMonth() + 3); break;
    default:          end.setMonth(end.getMonth() + 1);
  }

  const startDateStr = start.toISOString().split('T')[0];
  const endDateStr = end.toISOString().split('T')[0];

  const firstTime = await isFirstTimeSubscriber(member.id);
  const joiningFeeAmount = (firstTime && includeJoiningFee)
    ? await getJoiningFee().catch(() => 0)
    : 0;
  const totalAmount = parseFloat(plan.price) + parseFloat(joiningFeeAmount || 0);

  const description = joiningFeeAmount > 0
    ? `${plan.name} - ${cycle} + Joining Fee (manual activation by admin)`
    : `${plan.name} - ${cycle} (manual activation by admin)`;

  const recentDuplicate = await Payment.findOne({
    where: {
      userId: member.id,
      description,
      paystackReference: { [Op.like]: 'APEX-MANUAL-%' },
      createdAt: { [Op.gte]: new Date(Date.now() - 60 * 1000) },
    },
    order: [['createdAt', 'DESC']],
  });
  if (recentDuplicate) {
    const existing = await Subscription.findByPk(recentDuplicate.subscriptionId);
    return { subscription: existing, payment: recentDuplicate, duplicate: true };
  }

  const result = await sequelize.transaction(async (t) => {
    await Subscription.update(
      { status: 'cancelled', cancelledAt: new Date(), cancelReason: 'Replaced by admin manual activation' },
      { where: { userId: member.id, status: ['active', 'paused'] }, transaction: t }
    );

    const subscription = await Subscription.create({
      userId: member.id,
      planId,
      locationId: locationId || null,
      status: 'active',
      startDate: startDateStr,
      endDate: endDateStr,
      nextBillingDate: endDateStr,
      billingCycle: cycle,
    }, { transaction: t });

    const reference = `APEX-MANUAL-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const payment = await Payment.create({
      userId: member.id,
      subscriptionId: subscription.id,
      amount: totalAmount,
      joiningFee: joiningFeeAmount,
      currency: 'NGN',
      type: 'subscription',
      status: 'success',
      paystackReference: reference,
      description,
      metadata: {
        manualActivation: true,
        activatedBy: adminUser.id,
        paymentMethod: paymentMethod || 'cash',
        notes: notes || null,
        planPrice: parseFloat(plan.price),
        joiningFee: joiningFeeAmount,
        firstTimeSubscriber: firstTime,
      },
    }, { transaction: t });

    await Notification.create({
      userId: member.id,
      title: 'Membership Activated',
      message: `Your ${plan.name} membership has been activated. Valid until ${endDateStr}.`,
      type: 'subscription',
      metadata: { subscriptionId: subscription.id, planId },
    }, { transaction: t });

    return { subscription, payment };
  });

  return result;
};

const getSubscription = async (userId) => {
  await assertMember(userId);
  const subscription = await Subscription.findOne({
    where: { userId, status: ['active', 'paused'] },
    include: [
      { model: MembershipPlan, as: 'plan' },
      { model: Location, attributes: ['id', 'name'] },
    ],
    order: [['createdAt', 'DESC']],
  });

  const [firstTime, joiningFee] = await Promise.all([
    isFirstTimeSubscriber(userId),
    getJoiningFee().catch(() => 0),
  ]);

  return { subscription, firstTimeSubscriber: firstTime, joiningFee: firstTime ? joiningFee : 0 };
};

module.exports = { getAll, getOne, update, suspend, reactivate, getBookings, getPayments, activateSubscription, getSubscription };
