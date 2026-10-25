const { Op } = require('sequelize');
const { Payment, PTRequest, User, Subscription, MembershipPlan, PTPlan } = require('../models');

const err = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const memberOf = (u) => u ? {
  name: `${u.firstName} ${u.lastName}`,
  email: u.email,
  memberNumber: u.memberNumber != null ? String(100000 + u.memberNumber) : null,
} : null;

const lookup = async (ref) => {
  const q = (ref || '').trim();
  if (!q) throw err('Enter a reference to search', 400);

  const results = [];

  const payments = await Payment.findAll({
    where: { paystackReference: { [Op.iLike]: `%${q}%` } },
    include: [
      { model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'memberNumber'] },
      { model: Subscription, required: false, include: [{ model: MembershipPlan, as: 'plan', attributes: ['id', 'name', 'billingCycle'] }] },
    ],
    order: [['createdAt', 'DESC']],
    limit: 15,
  });

  for (const p of payments) {
    results.push({
      kind: p.type === 'locker' ? 'locker' : 'membership',
      reference: p.paystackReference,
      transactionId: p.paystackTransactionId,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      description: p.description,
      createdAt: p.createdAt,
      member: memberOf(p.User),
      plan: p.Subscription && p.Subscription.plan
        ? { name: p.Subscription.plan.name, billingCycle: p.Subscription.plan.billingCycle }
        : null,
    });
  }

  const ptReqs = await PTRequest.findAll({
    where: { reference: { [Op.iLike]: `%${q}%` } },
    include: [
      { model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'memberNumber'] },
      { model: User, as: 'ConfirmedBy', attributes: ['firstName', 'lastName'], required: false },
      { model: PTPlan, as: 'plan', required: false, attributes: ['id', 'name', 'sessions'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: 15,
  });

  for (const r of ptReqs) {
    results.push({
      kind: 'pt',
      reference: r.reference,
      amount: r.totalAmount,
      currency: 'NGN',
      status: r.status,
      sessions: r.sessions,
      planName: r.plan ? r.plan.name : null,
      createdAt: r.createdAt,
      confirmedAt: r.confirmedAt,
      confirmedBy: r.ConfirmedBy ? `${r.ConfirmedBy.firstName} ${r.ConfirmedBy.lastName}` : null,
      member: memberOf(r.User),
    });
  }

  return { results };
};

module.exports = { lookup };
