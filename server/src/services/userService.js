const { Op } = require('sequelize');
const {
  Booking, Subscription, Notification, Class,
  Trainer, User, Location, MembershipPlan, TrainerAssignment, Visit,
} = require('../models');
const { paginate, paginateResponse } = require('../utils/pagination');
const { isConfigured, buildAvatarKey, presignAvatarUpload } = require('../utils/r2');

const err = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const getMe = async (user) => {

  const today = new Date().toISOString().split('T')[0];

  const [subscription, legacyDailyPassPlans, ptAssignment, totalVisits] = await Promise.all([
    Subscription.findOne({
      where: {
        userId: user.id,
        [Op.or]: [
          { status: ['active', 'paused', 'attention'] },
          { status: 'cancelled', endDate: { [Op.gte]: today } },
        ],
      },
      include: [
        { model: MembershipPlan, as: 'plan' },
        { model: Location, attributes: ['id', 'name', 'city'] },
      ],
      order: [['createdAt', 'DESC']],
    }),
    MembershipPlan.findAll({ where: { isDailyPass: true }, attributes: ['id'] }),
    TrainerAssignment.findOne({
      where: { userId: user.id, isActive: true },
      include: [
        {
          model: Trainer,
          include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] }],
        },
      ],
    }),
    Visit.count({ where: { userId: user.id } }),
  ]);

  const legacyIds = legacyDailyPassPlans.map((p) => p.id);
  const membershipWhere = { userId: user.id };
  if (legacyIds.length > 0) membershipWhere.planId = { [Op.notIn]: legacyIds };
  const priorMembershipCount = await Subscription.count({ where: membershipWhere });
  const isFirstTimeMember = priorMembershipCount === 0;

  return {
    user,
    subscription: subscription || null,
    isFirstTimeMember,
    ptAssignment: ptAssignment || null,
    totalVisits,
  };
};

const getBookings = async (query, user) => {
  const { filter } = query;
  const { page, limit, offset } = paginate(query);
  const today = new Date().toISOString().split('T')[0];

  const classWhere = {};
  if (filter === 'upcoming') classWhere.date = { [Op.gte]: today };
  else if (filter === 'past') classWhere.date = { [Op.lt]: today };

  const { count, rows } = await Booking.findAndCountAll({
    where: { userId: user.id, status: { [Op.ne]: 'cancelled' } },
    include: [
      {
        model: Class,
        where: classWhere,
        include: [
          {
            model: Trainer,
            include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] }],
          },
          { model: Location, attributes: ['id', 'name', 'city'] },
        ],
      },
    ],
    order: [[Class, 'date', 'ASC'], [Class, 'startTime', 'ASC']],
    limit,
    offset,
  });

  return paginateResponse(rows, count, page, limit);
};

const getSubscriptions = async (user) => {
  const subscriptions = await Subscription.findAll({
    where: { userId: user.id },
    include: [
      { model: MembershipPlan, as: 'plan' },
      { model: Location, attributes: ['id', 'name', 'city'] },
    ],
    order: [['createdAt', 'DESC']],
  });

  return { subscriptions };
};

const getNotifications = async (query, user) => {
  const { page, limit, offset } = paginate(query);

  const { count, rows } = await Notification.findAndCountAll({
    where: { userId: user.id },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return paginateResponse(rows, count, page, limit);
};

const markNotificationRead = async (notificationId, user) => {
  const notification = await Notification.findOne({
    where: { id: notificationId, userId: user.id },
  });

  if (!notification) {
    const err = new Error('Notification not found');
    err.statusCode = 404;
    throw err;
  }

  await notification.update({ isRead: true });
  return { notification };
};

const markAllNotificationsRead = async (user) => {
  await Notification.update(
    { isRead: true },
    { where: { userId: user.id, isRead: false } }
  );

  return { message: 'All notifications marked as read' };
};

const getAvatarUploadUrl = async (user) => {
  if (!isConfigured()) throw err('Photo uploads are not available right now', 503);
  const uploadUrl = presignAvatarUpload(user.id);
  return { uploadUrl, key: buildAvatarKey(user.id), contentType: 'image/webp' };
};

const saveAvatar = async (user) => {
  if (!isConfigured()) throw err('Photo uploads are not available right now', 503);
  await user.update({ avatarUrl: buildAvatarKey(user.id) });
  return { user };
};

module.exports = {
  getMe,
  getBookings,
  getSubscriptions,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getAvatarUploadUrl,
  saveAvatar,
};
