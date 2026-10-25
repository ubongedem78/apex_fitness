const { Op } = require('sequelize');
const { Payment, Subscription, MembershipPlan, User } = require('../models');
const { paginate, paginateResponse } = require('../utils/pagination');

const getAll = async (query, user) => {
  const { page, limit, offset } = paginate(query);

  const { count, rows } = await Payment.findAndCountAll({
    where: { userId: user.id, status: { [Op.in]: ['success', 'failed', 'refunded'] } },
    include: [
      {
        model: Subscription,
        include: [{ model: MembershipPlan, as: 'plan' }]
      }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return paginateResponse(rows, count, page, limit);
};

const getOne = async (paymentId, user) => {
  const payment = await Payment.findOne({
    where: { id: paymentId, userId: user.id },
    include: [
      {
        model: Subscription,
        include: [{ model: MembershipPlan, as: 'plan' }]
      }
    ]
  });

  if (!payment) {
    const err = new Error('Payment not found');
    err.statusCode = 404;
    throw err;
  }

  return { payment };
};

const getAllForReceptionist = async (query) => {
  const { page, limit, offset } = paginate(query);
  const where = {};

  if (query.status) where.status = query.status;

  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt[Op.gte] = new Date(query.from);
    if (query.to)   where.createdAt[Op.lte] = new Date(query.to);
  }

  if (query.search) {
    where[Op.or] = [
      { paystackReference: { [Op.iLike]: `%${query.search}%` } },
      { description:       { [Op.iLike]: `%${query.search}%` } },
    ];
  }

  const { count, rows } = await Payment.findAndCountAll({
    where,
    include: [
      {
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'email', 'memberNumber'],
      },
      {
        model: Subscription,
        required: false,
        include: [{ model: MembershipPlan, as: 'plan', attributes: ['id', 'name', 'billingCycle'] }],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return paginateResponse(rows, count, page, limit);
};

module.exports = { getAll, getOne, getAllForReceptionist };
