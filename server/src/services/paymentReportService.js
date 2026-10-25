const { Op } = require('sequelize');
const { Payment, PTRequest, User, PTPlan } = require('../models');

const rangeFor = (period, dateStr) => {
  const base = dateStr ? new Date(dateStr) : new Date();
  const y = base.getFullYear(), m = base.getMonth(), d = base.getDate();
  if (period === 'year') {
    return { start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1), label: `${y}` };
  }
  if (period === 'month') {
    return { start: new Date(y, m, 1), end: new Date(y, m + 1, 1),
      label: base.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' }) };
  }
  return { start: new Date(y, m, d), end: new Date(y, m, d + 1),
    label: base.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) };
};

const getPaymentsReport = async ({ type = 'all', period = 'day', date } = {}) => {
  const { start, end, label } = rangeFor(period, date);
  const items = [];

  const wantMembership = type === 'all' || type === 'membership';
  const wantLocker = type === 'all' || type === 'locker';
  const wantPT = type === 'all' || type === 'pt';

  if (wantMembership || wantLocker) {
    const payTypes = [];
    if (wantMembership) payTypes.push('subscription');
    if (wantLocker) payTypes.push('locker');
    const payments = await Payment.findAll({
      where: { type: { [Op.in]: payTypes }, status: 'success', createdAt: { [Op.gte]: start, [Op.lt]: end } },
      include: [{ model: User, attributes: ['firstName', 'lastName', 'memberNumber'] }],
      order: [['createdAt', 'ASC']],
    });
    for (const p of payments) {
      items.push({
        date: p.createdAt,
        reference: p.paystackReference,
        member: p.User ? `${p.User.firstName} ${p.User.lastName}` : '-',
        type: p.type === 'locker' ? 'Locker' : 'Membership',
        description: p.description || '',
        amount: parseFloat(p.amount),
      });
    }
  }

  if (wantPT) {
    const ptReqs = await PTRequest.findAll({
      where: { status: { [Op.in]: ['paid', 'assigned'] }, confirmedAt: { [Op.gte]: start, [Op.lt]: end } },
      include: [
        { model: User, attributes: ['firstName', 'lastName', 'memberNumber'] },
        { model: PTPlan, as: 'plan', required: false, attributes: ['name'] },
      ],
      order: [['confirmedAt', 'ASC']],
    });
    for (const r of ptReqs) {
      items.push({
        date: r.confirmedAt,
        reference: r.reference,
        member: r.User ? `${r.User.firstName} ${r.User.lastName}` : '-',
        type: 'Personal Training',
        description: r.plan ? r.plan.name : 'PT Sessions',
        amount: parseFloat(r.totalAmount),
      });
    }
  }

  items.sort((a, b) => new Date(a.date) - new Date(b.date));
  const total = items.reduce((s, i) => s + i.amount, 0);
  const byType = {};
  for (const i of items) byType[i.type] = (byType[i.type] || 0) + i.amount;

  return { period, periodLabel: label, type, count: items.length, total, byType, items };
};

module.exports = { getPaymentsReport };
