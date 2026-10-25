const { MembershipPlan } = require('../../models');
const { createPlan } = require('../../utils/paystack');

const getAll = async () => {
  const plans = await MembershipPlan.findAll({
    where: { isDailyPass: false },
    order: [['sortOrder', 'ASC'], ['price', 'ASC']],
  });
  return { plans };
};

const create = async ({ name, description, price, billingCycle, features, classLimit, locationAccess, sortOrder, joiningFee, isDailyPass }) => {
  if (!name || !price || !billingCycle) {
    const err = new Error('name, price, billingCycle are required');
    err.statusCode = 400;
    throw err;
  }

  if (!['daily', 'monthly', 'quarterly', 'annual'].includes(billingCycle)) {
    const err = new Error('billingCycle must be daily, monthly, quarterly, or annual');
    err.statusCode = 400;
    throw err;
  }

  let paystackPlanCode = null;

  if (billingCycle !== 'daily') {
    try {
      const paystackInterval = billingCycle === 'monthly' ? 'monthly' : billingCycle === 'quarterly' ? 'quarterly' : 'annually';
      const paystackResponse = await createPlan({
        name,
        amount: parseFloat(price),
        interval: paystackInterval
      });
      if (paystackResponse.data && paystackResponse.data.plan_code) {
        paystackPlanCode = paystackResponse.data.plan_code;
      }
    } catch (_) {}
  }

  const plan = await MembershipPlan.create({
    name,
    description: description || null,
    price: parseFloat(price),
    billingCycle,
    features: features || null,
    classLimit: classLimit !== undefined ? classLimit : null,
    locationAccess: locationAccess || 'single',
    sortOrder: sortOrder || 0,
    joiningFee: joiningFee ? parseFloat(joiningFee) : null,
    isDailyPass: isDailyPass || false,
    paystackPlanCode
  });

  return { plan };
};

const update = async (planId, body) => {
  const plan = await MembershipPlan.findByPk(planId);
  if (!plan) {
    const err = new Error('Plan not found');
    err.statusCode = 404;
    throw err;
  }

  const allowedFields = ['name', 'description', 'price', 'billingCycle', 'features', 'classLimit', 'locationAccess', 'sortOrder', 'isActive', 'joiningFee', 'isDailyPass', 'paystackPlanCode'];
  const updates = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  await plan.update(updates);
  return { plan };
};

const deactivate = async (planId) => {
  const plan = await MembershipPlan.findByPk(planId);
  if (!plan) {
    const err = new Error('Plan not found');
    err.statusCode = 404;
    throw err;
  }

  await plan.update({ isActive: false });
  return { message: 'Plan deactivated', plan };
};

const activate = async (planId) => {
  const plan = await MembershipPlan.findByPk(planId);
  if (!plan) {
    const err = new Error('Plan not found');
    err.statusCode = 404;
    throw err;
  }

  await plan.update({ isActive: true });
  return { message: 'Plan activated', plan };
};

module.exports = { getAll, create, update, deactivate, activate };
