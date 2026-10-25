const { Op } = require('sequelize');
const { Class, Booking, Waitlist, Trainer, Location, User, Notification, Review } = require('../../models');
const { paginate, paginateResponse } = require('../../utils/pagination');
const { sendBookingCancellation } = require('../../utils/email');

const getAll = async (query) => {
  const { locationId, dateFrom, dateTo, trainerId, status, classType } = query;
  const { page, limit, offset } = paginate(query);

  const where = {};
  if (locationId) where.locationId = locationId;
  if (trainerId) where.trainerId = trainerId;
  if (status) where.status = status;
  if (classType) where.classType = classType;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date[Op.gte] = dateFrom;
    if (dateTo) where.date[Op.lte] = dateTo;
  }

  const { count, rows } = await Class.findAndCountAll({
    where,
    include: [
      {
        model: Trainer,
        include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }]
      },
      { model: Location, attributes: ['id', 'name', 'city'] }
    ],
    order: [['date', 'ASC'], ['startTime', 'ASC']],
    limit,
    offset
  });

  return paginateResponse(rows, count, page, limit);
};

const create = async ({ name, description, locationId, trainerId, classType, date, startTime, endTime, capacity, isRecurring, recurringPattern }) => {
  const fields = {};
  if (!name?.trim())    fields.name      = 'Class name is required';
  if (!locationId)      fields.locationId = 'Location is required';
  if (!trainerId)       fields.trainerId  = 'Trainer is required';
  if (!date)            fields.date       = 'Date is required';
  if (!startTime)       fields.startTime  = 'Start time is required';
  if (!endTime)         fields.endTime    = 'End time is required';
  if (!capacity)        fields.capacity   = 'Capacity is required';

  if (Object.keys(fields).length > 0) {
    const err = new Error('Please fill in all required fields');
    err.statusCode = 422;
    err.fields = fields;
    throw err;
  }

  const location = await Location.findByPk(locationId);
  if (!location) {
    const err = new Error('Location not found');
    err.statusCode = 404;
    throw err;
  }

  const trainer = await Trainer.findByPk(trainerId);
  if (!trainer) {
    const err = new Error('Trainer not found');
    err.statusCode = 404;
    throw err;
  }

  const classItem = await Class.create({
    name,
    description: description || null,
    locationId,
    trainerId,
    classType,
    date,
    startTime,
    endTime,
    capacity: parseInt(capacity),
    isRecurring: isRecurring || false,
    recurringPattern: recurringPattern || null,
    status: 'scheduled'
  });

  return { class: classItem };
};

const update = async (classId, body) => {
  const classItem = await Class.findByPk(classId);
  if (!classItem) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }

  const allowedFields = ['name', 'description', 'locationId', 'trainerId', 'classType', 'date', 'startTime', 'endTime', 'capacity', 'isRecurring', 'recurringPattern'];
  const updates = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  await classItem.update(updates);
  return { class: classItem };
};

const performCancellation = async (classItem, cancellationReason) => {
  await classItem.update({ status: 'cancelled', cancellationReason: cancellationReason || null, bookedCount: 0 });

  const bookings = await Booking.findAll({
    where: { classId: classItem.id, status: 'booked' },
    include: [{ model: User }]
  });

  for (const booking of bookings) {
    await booking.update({ status: 'cancelled', cancelledAt: new Date(), cancellationReason: 'Class cancelled by admin' });

    await Notification.create({
      userId: booking.userId,
      title: 'Class Cancelled',
      message: `${classItem.name} on ${classItem.date} has been cancelled. ${cancellationReason ? 'Reason: ' + cancellationReason : ''}`,
      type: 'class_cancellation',
      metadata: { classId: classItem.id, bookingId: booking.id }
    });

    try {
      await sendBookingCancellation(booking.User, booking, classItem);
    } catch (_) {}
  }

  return { message: `Class cancelled. ${bookings.length} members notified.`, class: classItem };
};

const remove = async (classId) => {
  const classItem = await Class.findByPk(classId);
  if (!classItem) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }
  await Booking.destroy({ where: { classId } });
  await Waitlist.destroy({ where: { classId } });
  await Review.destroy({ where: { classId } });
  await classItem.destroy();
  return { message: 'Class deleted' };
};

const cancel = async (classId, cancellationReason) => {
  const classItem = await Class.findByPk(classId, {
    include: [
      { model: Trainer, include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }] },
      { model: Location, attributes: ['id', 'name'] }
    ]
  });

  if (!classItem) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }

  if (classItem.status === 'cancelled') {
    const err = new Error('Class is already cancelled');
    err.statusCode = 400;
    throw err;
  }

  return performCancellation(classItem, cancellationReason);
};

const reactivate = async (classId) => {
  const classItem = await Class.findByPk(classId);
  if (!classItem) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }
  if (classItem.status !== 'cancelled') {
    const err = new Error('Only a cancelled class can be reactivated');
    err.statusCode = 400;
    throw err;
  }
  const activeBookings = await Booking.count({ where: { classId, status: 'booked' } });
  await classItem.update({ status: 'scheduled', cancellationReason: null, bookedCount: activeBookings });
  return { message: 'Class reactivated', class: classItem };
};

const getBookings = async (classId, query) => {
  const { page, limit, offset } = paginate(query);

  const { count, rows } = await Booking.findAndCountAll({
    where: { classId },
    include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'avatarUrl'] }],
    order: [['bookedAt', 'ASC']],
    limit,
    offset
  });

  return paginateResponse(rows, count, page, limit);
};

const getWaitlist = async (classId, query) => {
  const { page, limit, offset } = paginate(query);

  const { count, rows } = await Waitlist.findAndCountAll({
    where: { classId },
    include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }],
    order: [['position', 'ASC']],
    limit,
    offset
  });

  return paginateResponse(rows, count, page, limit);
};

module.exports = { getAll, create, update, remove, cancel, reactivate, getBookings, getWaitlist };
