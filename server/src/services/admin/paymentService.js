const { Op } = require('sequelize');
const { Payment, User, Subscription, MembershipPlan } = require('../../models');
const { paginate, paginateResponse } = require('../../utils/pagination');

const getAll = async (query) => {
  const { page, limit, offset } = paginate(query);
  const where = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.userId) {
    where.userId = query.userId;
  }

  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt[Op.gte] = new Date(query.from);
    if (query.to)   where.createdAt[Op.lte] = new Date(query.to);
  }

  if (query.search) {
    where[Op.or] = [
      { paystackReference: { [Op.iLike]: `%${query.search}%` } },
      { description: { [Op.iLike]: `%${query.search}%` } }
    ];
  }

  const order = query.sort
    ? [[query.sort.split(':')[0], (query.sort.split(':')[1] || 'DESC').toUpperCase()]]
    : [['createdAt', 'DESC']];

  const { count, rows } = await Payment.findAndCountAll({
    where,
    include: [
      {
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: Subscription,
        required: false,
        include: [{ model: MembershipPlan, as: 'plan', attributes: ['id', 'name', 'billingCycle'] }]
      }
    ],
    order,
    limit,
    offset
  });

  return paginateResponse(rows, count, page, limit);
};

const getOne = async (paymentId) => {
  const payment = await Payment.findByPk(paymentId, {
    include: [
      { model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
      {
        model: Subscription,
        required: false,
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

const refund = async (paymentId, { reason }) => {
  const payment = await Payment.findByPk(paymentId);

  if (!payment) {
    const err = new Error('Payment not found');
    err.statusCode = 404;
    throw err;
  }

  if (payment.status !== 'success') {
    const err = new Error('Only successful payments can be refunded');
    err.statusCode = 400;
    throw err;
  }

  await payment.update({ status: 'refunded', metadata: { ...payment.metadata, refundReason: reason || null } });
  return { message: 'Payment marked as refunded', payment };
};

module.exports = { getAll, getOne, refund };
