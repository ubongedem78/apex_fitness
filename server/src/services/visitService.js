const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { User, Subscription, Visit, Location, MembershipPlan, LockerSubscription } = require('../models');
const { signAvatarUrl } = require('../utils/r2');
const { resolveAccess } = require('../utils/accessStatus');

const err = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const decodeNumber = (displayNumber) => {
  const n = parseInt(displayNumber, 10);
  if (isNaN(n) || n <= 100000 || n > 999999) return null;
  return n - 100000;
};

const lookupMember = async (displayMemberNumber) => {
  const memberNumber = decodeNumber(displayMemberNumber);
  if (!memberNumber) throw err('Invalid member number', 400);

  const user = await User.findOne({ where: { memberNumber } });
  if (!user) throw err('Member not found', 404);

  const today = new Date().toISOString().split('T')[0];
  const [subscription, todayVisit, totalVisits, lockerSub] = await Promise.all([
    Subscription.findOne({
      where: { userId: user.id },
      include: [{ model: MembershipPlan, as: 'plan' }],
      order: [['createdAt', 'DESC']],
    }),
    Visit.findOne({ where: { userId: user.id, visitDate: today } }),
    Visit.count({ where: { userId: user.id } }),
    LockerSubscription.findOne({ where: { userId: user.id }, order: [['createdAt', 'DESC']] }),
  ]);

  if (subscription && ['active', 'attention'].includes(subscription.status)
      && subscription.endDate && subscription.endDate < today) {
    await subscription.update({ status: 'expired' });
  }

  let accessStatus = 'no_membership';
  let accessMessage = 'No active membership.';
  const cancelled = !!(subscription && subscription.cancelledAt);

  if (subscription) {
    const endDate = subscription.endDate;
    const daysLeft = Math.ceil((new Date(endDate) - new Date(today)) / (1000 * 60 * 60 * 24));

    if (subscription.status === 'paused') {
      accessStatus = 'paused';
      accessMessage = `Membership is paused until ${subscription.freezeEndDate || 'further notice'}.`;
    } else if (subscription.status === 'attention') {
      const grace = subscription.gracePeriodEnds ? new Date(subscription.gracePeriodEnds) : null;
      if (grace && new Date() > grace) {
        accessStatus = 'payment_issue';
        accessMessage = 'Payment failed and grace period has ended. Please update payment method.';
      } else {
        accessStatus = 'attention';
        accessMessage = `Payment failed - allow access but remind member to update their card. Grace period ends ${grace ? grace.toLocaleDateString('en-NG') : 'soon'}.`;
      }
    } else if (subscription.status === 'cancelled' || subscription.status === 'expired' || daysLeft <= 0) {
      if (cancelled) {
        accessStatus = 'cancelled';
        accessMessage = `Membership cancelled. Access ended ${endDate}.`;
      } else {
        accessStatus = 'expired';
        accessMessage = `Membership expired on ${endDate}.`;
      }
    } else if (cancelled) {
      accessStatus = daysLeft <= 7 ? 'expiring' : 'active';
      accessMessage = `Cancelled - access until ${endDate} (${daysLeft} day${daysLeft !== 1 ? 's' : ''} left). Will not renew.`;
    } else if (daysLeft <= 7) {
      accessStatus = 'expiring';
      accessMessage = `Membership expires on ${endDate} (${daysLeft} day${daysLeft !== 1 ? 's' : ''} left).`;
    } else {
      accessStatus = 'active';
      accessMessage = `Active - expires ${endDate}.`;
    }
  }

  let locker = null;
  if (lockerSub) {
    if (lockerSub.status === 'active' && lockerSub.endDate && lockerSub.endDate < today) {
      await lockerSub.update({ status: 'expired' });
    }
    const lk = resolveAccess(lockerSub, { noun: 'Locker subscription', today });
    locker = {
      billingCycle: lockerSub.billingCycle,
      endDate: lockerSub.endDate,
      accessStatus: lk.accessStatus,
      accessMessage: lk.accessMessage,
      cancelled: lk.cancelled,
      canAccess: lk.canAccess,
    };
  }

  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatarUrl: signAvatarUrl(user.avatarUrl),
      displayMemberNumber: String(100000 + user.memberNumber),
      memberNumber: user.memberNumber,
    },
    subscription: subscription || null,
    accessStatus,
    accessMessage,
    cancelled,
    locker,
    alreadyCheckedIn: !!todayVisit,
    todayCheckInTime: todayVisit ? todayVisit.visitTime : null,
    totalVisits,
  };
};

const checkIn = async ({ displayMemberNumber, locationId }, receptionistUser) => {
  const memberNumber = decodeNumber(displayMemberNumber);
  if (!memberNumber) throw err('Invalid member number', 400);

  const user = await User.findOne({ where: { memberNumber } });
  if (!user) throw err('Member not found', 404);

  const today = new Date().toISOString().split('T')[0];

  const subscription = await Subscription.findOne({
    where: {
      userId: user.id,
      status: { [Op.in]: ['active', 'attention'] },
      endDate: { [Op.gte]: today },
    },
    order: [['createdAt', 'DESC']],
  });

  if (!subscription) throw err('Member does not have an active membership', 403);

  const now = new Date();
  const visitTime = now.toTimeString().split(' ')[0];

  const { visit, already } = await sequelize.transaction(async (t) => {
    await User.findByPk(user.id, { lock: t.LOCK.UPDATE, transaction: t });
    const existing = await Visit.findOne({
      where: { userId: user.id, visitDate: today },
      transaction: t,
    });
    if (existing) return { visit: existing, already: true };
    const created = await Visit.create({
      userId: user.id,
      locationId: locationId || receptionistUser.locationId || null,
      checkedInByUserId: receptionistUser.id,
      visitDate: today,
      visitTime,
    }, { transaction: t });
    return { visit: created, already: false };
  });

  if (already) {
    return {
      alreadyCheckedIn: true,
      message: `${user.firstName} already checked in today at ${visit.visitTime}.`,
      visit,
    };
  }

  return {
    alreadyCheckedIn: false,
    message: `${user.firstName} ${user.lastName} checked in successfully.`,
    visit,
    member: {
      firstName: user.firstName,
      lastName: user.lastName,
      displayMemberNumber: String(100000 + user.memberNumber),
      avatarUrl: signAvatarUrl(user.avatarUrl),
    },
  };
};

const getTodayVisits = async (receptionistUser) => {
  const today = new Date().toISOString().split('T')[0];
  const locationId = receptionistUser.locationId;

  const where = { visitDate: today };
  if (locationId) where.locationId = locationId;

  const rows = await Visit.findAll({
    where,
    include: [
      { model: User, attributes: ['id', 'firstName', 'lastName', 'avatarUrl', 'memberNumber'] },
      { model: Location, attributes: ['id', 'name'] },
    ],
    order: [['visitTime', 'DESC']],
  });

  const visits = rows.map((row) => {
    const v = row.toJSON();
    if (v.User) v.User.avatarUrl = signAvatarUrl(v.User.avatarUrl);
    return v;
  });

  return { visits, total: visits.length, date: today };
};

module.exports = { lookupMember, checkIn, getTodayVisits };
