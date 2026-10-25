const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Class, Booking, Waitlist, Trainer, Location, User, Subscription, Review, Notification } = require('../models');
const { paginate, paginateResponse } = require('../utils/pagination');
const { sendBookingConfirmation, sendBookingCancellation, sendWaitlistNotification } = require('../utils/email');

const getAll = async (query) => {
  const { locationId, date, trainerId, classType, status = 'scheduled' } = query;
  const { page, limit, offset } = paginate(query);

  const where = {};
  if (locationId) where.locationId = locationId;
  if (date) where.date = date;
  if (trainerId) where.trainerId = trainerId;
  if (classType) where.classType = classType;
  if (status) where.status = status;

  const { count, rows } = await Class.findAndCountAll({
    where,
    include: [
      {
        model: Trainer,
        include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] }]
      },
      {
        model: Location,
        attributes: ['id', 'name', 'address', 'city']
      }
    ],
    order: [['date', 'ASC'], ['startTime', 'ASC']],
    limit,
    offset
  });

  return paginateResponse(rows, count, page, limit);
};

const getOne = async (classId, user) => {
  const classItem = await Class.findByPk(classId, {
    include: [
      {
        model: Trainer,
        include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] }]
      },
      {
        model: Location
      }
    ]
  });

  if (!classItem) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }

  let userBookingStatus = null;
  if (user) {
    const booking = await Booking.findOne({
      where: { classId: classItem.id, userId: user.id }
    });
    if (booking) {
      userBookingStatus = booking.status;
    } else {
      const waitlistEntry = await Waitlist.findOne({
        where: { classId: classItem.id, userId: user.id }
      });
      if (waitlistEntry) userBookingStatus = 'waitlisted';
    }
  }

  return { class: classItem, userBookingStatus };
};

const bookClass = async (classId, user) => {
  const classItem = await Class.findByPk(classId, {
    include: [
      { model: Trainer, include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }] },
      { model: Location, attributes: ['id', 'name', 'address', 'city'] }
    ]
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
    }
  });
  if (!subscription) {
    const err = new Error('You need an active membership to book classes');
    err.statusCode = 403;
    throw err;
  }

  const booking = await sequelize.transaction(async (t) => {
    const locked = await Class.findByPk(classItem.id, { lock: t.LOCK.UPDATE, transaction: t });
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
      where: { classId: classItem.id, userId: user.id, status: ['booked', 'attended'] },
      transaction: t,
    });
    if (existingBooking) {
      const err = new Error('You have already booked this class');
      err.statusCode = 409;
      throw err;
    }
    const created = await Booking.create(
      { classId: classItem.id, userId: user.id, status: 'booked', bookedAt: new Date() },
      { transaction: t }
    );
    await locked.increment('bookedCount', { transaction: t });
    return created;
  });

  try {
    await sendBookingConfirmation(user, booking, classItem);
  } catch (_) {}

  await Notification.create({
    userId: user.id,
    title: 'Class Booked!',
    message: `You've successfully booked ${classItem.name} on ${classItem.date}`,
    type: 'booking',
    metadata: { bookingId: booking.id, classId: classItem.id }
  });

  return { booking };
};

const cancelBooking = async (classId, user) => {
  const booking = await Booking.findOne({
    where: { classId, userId: user.id, status: 'booked' }
  });

  if (!booking) {
    const err = new Error('Active booking not found');
    err.statusCode = 404;
    throw err;
  }

  const classItem = await Class.findByPk(classId, {
    include: [
      { model: Trainer, include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }] },
      { model: Location, attributes: ['id', 'name'] }
    ]
  });

  await booking.update({ status: 'cancelled', cancelledAt: new Date() });
  await classItem.decrement('bookedCount');

  const firstWaiting = await Waitlist.findOne({
    where: { classId, status: 'waiting' },
    order: [['position', 'ASC']],
    include: [{ model: User }]
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
      metadata: { classId: classItem.id }
    });
  }

  try {
    await sendBookingCancellation(user, booking, classItem);
  } catch (_) {}

  return { message: 'Booking cancelled successfully' };
};

const joinWaitlist = async (classId, user) => {
  const classItem = await Class.findByPk(classId);
  if (!classItem) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }

  if (classItem.status !== 'scheduled') {
    const err = new Error('This class is not available');
    err.statusCode = 400;
    throw err;
  }

  if (classItem.bookedCount < classItem.capacity) {
    const err = new Error('Class still has spots. Book directly instead.');
    err.statusCode = 400;
    throw err;
  }

  const existingWaitlist = await Waitlist.findOne({
    where: { classId, userId: user.id, status: ['waiting', 'notified'] }
  });
  if (existingWaitlist) {
    const err = new Error('You are already on the waitlist');
    err.statusCode = 409;
    throw err;
  }

  const lastPosition = await Waitlist.max('position', {
    where: { classId, status: ['waiting', 'notified'] }
  });
  const position = (lastPosition || 0) + 1;

  const waitlistEntry = await Waitlist.create({
    classId,
    userId: user.id,
    position,
    status: 'waiting'
  });

  await classItem.increment('waitlistCount');

  return { waitlist: waitlistEntry, position };
};

const leaveWaitlist = async (classId, user) => {
  const entry = await Waitlist.findOne({
    where: { classId, userId: user.id, status: ['waiting', 'notified'] }
  });

  if (!entry) {
    const err = new Error('Waitlist entry not found');
    err.statusCode = 404;
    throw err;
  }

  const removedPosition = entry.position;
  await entry.update({ status: 'expired' });

  await Waitlist.decrement('position', {
    by: 1,
    where: {
      classId,
      status: ['waiting', 'notified'],
      position: { [Op.gt]: removedPosition }
    }
  });

  const classItem = await Class.findByPk(classId);
  if (classItem && classItem.waitlistCount > 0) {
    await classItem.decrement('waitlistCount');
  }

  return { message: 'Removed from waitlist' };
};

const getReviews = async (classId, query) => {
  const { page, limit, offset } = paginate(query);

  const { count, rows } = await Review.findAndCountAll({
    where: { classId, isPublic: true },
    include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] }],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return paginateResponse(rows, count, page, limit);
};

const createReview = async (classId, { rating, comment, isPublic = true }, user) => {
  if (!rating || rating < 1 || rating > 5) {
    const err = new Error('Rating must be between 1 and 5');
    err.statusCode = 400;
    throw err;
  }

  const classItem = await Class.findByPk(classId);
  if (!classItem) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }

  const review = await Review.create({
    userId: user.id,
    classId,
    rating,
    comment,
    isPublic
  });

  return { review };
};

module.exports = { getAll, getOne, bookClass, cancelBooking, joinWaitlist, leaveWaitlist, getReviews, createReview };
