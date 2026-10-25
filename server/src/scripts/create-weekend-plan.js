require('dotenv').config();
const sequelize = require('../config/database');
const { MembershipPlan } = require('../models');

const PLAN = {
  name: 'Weekend Plan',
  description: 'Train Friday through Sunday with full gym access on weekends.',
  price: 25250,
  billingCycle: 'monthly',
  classLimit: null,
  locationAccess: 'all',
  features: [
    'Friday to Sunday access',
    'Unlimited weekend classes',
    'All locations access',
    'Locker room access',
  ],
  isActive: true,
  isDailyPass: false,
  joiningFee: 15100,
  sortOrder: 2,
};

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const existing = await MembershipPlan.findOne({ where: { name: PLAN.name } });

    if (existing) {
      await existing.update(PLAN);
      console.log(`updated: ${PLAN.name} -> ₦${PLAN.price.toLocaleString()} / ${PLAN.billingCycle}`);
    } else {
      await MembershipPlan.create(PLAN);
      console.log(`created: ${PLAN.name} -> ₦${PLAN.price.toLocaleString()} / ${PLAN.billingCycle}`);
    }

    const order = { 'Monthly Plan': 1, 'Weekend Plan': 2, 'Quarterly Plan': 3, 'Annual Plan': 4 };
    for (const [name, sortOrder] of Object.entries(order)) {
      await MembershipPlan.update({ sortOrder }, { where: { name } });
    }

    const plans = await MembershipPlan.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['price', 'ASC']],
      attributes: ['name', 'price', 'billingCycle', 'sortOrder'],
    });
    console.log('\nActive plans, in display order:');
    for (const p of plans) {
      console.log(`  ${String(p.sortOrder).padEnd(2)} ${p.name.padEnd(16)} ₦${Number(p.price).toLocaleString()} / ${p.billingCycle}`);
    }
    console.log('\nDone.');
    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exit(1);
  }
})();
