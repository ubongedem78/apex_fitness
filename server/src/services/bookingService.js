const { Op } = require('sequelize');
const sequelize = require('../config/database');
const {
  Booking, Class, Trainer, Location, User,
  Subscription, Notification, Waitlist,
} = require('../models');
const { paginate, paginateResponse } = require('../utils/pagination');
const { sendBookingConfirmation, sendBookingCancellation, sendWaitlistNotification } = require('../utils/email');

const getAll = async (query, user) => {
  const { upcoming, past, filter } = query;
  const { page, limit, offset } = paginate(query);
  const today = new Date().toISOString().split('T')[0];

  const classWhere = {};
  if (upcoming === 'true' || filter === 'upcoming') {
    classWhere.date = { [Op.gte]: today };
  } else if (past === 'true' || filter === 'past') {
    classWhere.date = { [Op.lt]: today };
  }

  const { count, rows } = await Booking.findAndCountAll({
    where: { userId: user.id, status: { [Op.ne]: 'cancelled' } },
    include: [
      {
        model: Class,
        where: Object.keys(classWhere).length ? classWhere : undefined,
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

const create = async ({ classId }, user) => {
  if (!classId) {
    const err = new Error('classId is required');
    err.statusCode = 400;
    throw err;
  }

  const classItem = await Class.findByPk(classId, {
    include: [
      { model: Trainer, include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }] },
      { model: Location, attributes: ['id', 'name', 'address', 'city'] },
    ],
  });

  if (!classItem) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }

  if (classItem.status !== 'scheduled') {
    const err = new Error('This class is not available for booking');
    err.statusCode = 400;
    throw err;
  }

  const subscription = await Subscription.findOne({
    where: {
      userId: user.id,
      status: 'active',
      endDate: { [Op.gte]: new Date().toISOString().split('T')[0] },
    },
  });
  if (!subscription) {
    const err = new Error('You need an active membership to book classes');
    err.statusCode = 403;
    throw err;
  }

  const booking = await sequelize.transaction(async (t) => {
    const locked = await Class.findByPk(classId, { lock: t.LOCK.UPDATE, transaction: t });
    if (!locked || locked.status !== 'scheduled') {
      const err = new Error('This class is not available for booking');
      err.statusCode = 400;
      throw err;
    }
    if (locked.bookedCount >= locked.capacity) {
      const err = new Error('Class is full. Join the waitlist instead.');
      err.statusCode = 400;
      throw err;
    }
    const existingBooking = await Booking.findOne({
      where: { classId, userId: user.id, status: ['booked', 'attended'] },
      transaction: t,
    });
    if (existingBooking) {
      const err = new Error('You have already booked this class');
      err.statusCode = 409;
      throw err;
    }
    const created = await Booking.create(
      { classId, userId: user.id, status: 'booked', bookedAt: new Date() },
      { transaction: t }
    );
    await locked.increment('bookedCount', { transaction: t });
    return created;
  });

  try {
    await sendBookingConfirmation(user, booking, classItem);
  } catch (_) {}

  try {
    await Notification.create({
      userId: user.id,
      title: 'Class Booked!',
      message: `You've successfully booked ${classItem.name} on ${classItem.date}`,
      type: 'booking',
      metadata: { bookingId: booking.id, classId: classItem.id },
    });
  } catch (_) {}

  return { booking };
};

const cancel = async (bookingId, user) => {
  const booking = await Booking.findOne({
    where: { id: bookingId, userId: user.id, status: 'booked' },
  });

  if (!booking) {
    const err = new Error('Active booking not found');
    err.statusCode = 404;
    throw err;
  }

  const classItem = await Class.findByPk(booking.classId, {
    include: [
      { model: Trainer, include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }] },
      { model: Location, attributes: ['id', 'name'] },
    ],
  });

  await booking.update({ status: 'cancelled', cancelledAt: new Date() });

  if (classItem) {
    await classItem.decrement('bookedCount');

    const firstWaiting = await Waitlist.findOne({
      where: { classId: booking.classId, status: 'waiting' },
      order: [['position', 'ASC']],
      include: [{ model: User }],
    });

    if (firstWaiting) {
      await firstWaiting.update({ status: 'notified', notifiedAt: new Date() });
      try {
        await sendWaitlistNotification(firstWaiting.User, classItem);
      } catch (_) {}
      await Notification.create({
        userId: firstWaiting.userId,
        title: 'Spot Available!',
        message: `A spot opened up in ${classItem.name} on ${classItem.date}. Book now!`,
        type: 'waitlist',
        metadata: { classId: classItem.id },
      });
    }

    try {
      await sendBookingCancellation(user, booking, classItem);
    } catch (_) {}
  }

  return { message: 'Booking cancelled successfully' };
};

module.exports = { getAll, create, cancel };
