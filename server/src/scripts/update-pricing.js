require('dotenv').config();
const { Op } = require('sequelize');
const { sequelize, MembershipPlan, PTPlan, AppSetting } = require('../models');

const MEMBERSHIP_PRICES = {
  'Monthly Plan':   30750,
  'Quarterly Plan': 80450,
  'Annual Plan':    305800,
};

const JOINING_FEE = '15100';

const LOCKER_PRICES = {
  locker_monthly_price:   '15000',
  locker_quarterly_price: '30000',
  locker_setup_fee:       '25000',
};

const PT_PLANS = [
  { name: 'Generic 12',   sessions: 12, price: 18900, sortOrder: 1, description: '12 sessions with an available certified trainer.' },
  { name: 'Generic 16',   sessions: 16, price: 25200, sortOrder: 2, description: '16 sessions with an available certified trainer.' },
  { name: 'Generic 20',   sessions: 20, price: 31500, sortOrder: 3, description: '20 sessions with an available certified trainer.' },
  { name: 'Exclusive 12', sessions: 12, price: 50885, sortOrder: 4, description: '12 sessions with your own dedicated trainer.' },
  { name: 'Exclusive 16', sessions: 16, price: 71180, sortOrder: 5, description: '16 sessions with your own dedicated trainer.' },
  { name: 'Exclusive 20', sessions: 20, price: 91475, sortOrder: 6, description: '20 sessions with your own dedicated trainer.' },
];

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.query('ALTER TABLE pt_plans ADD COLUMN IF NOT EXISTS sessions INTEGER;');
    await sequelize.query('ALTER TABLE pt_plans ALTER COLUMN "durationMonths" DROP NOT NULL;');
    await sequelize.query('ALTER TABLE pt_requests ADD COLUMN IF NOT EXISTS sessions INTEGER;');
    await sequelize.query('ALTER TABLE pt_requests ALTER COLUMN "durationMonths" DROP NOT NULL;');
    await sequelize.query('ALTER TABLE pt_requests ADD COLUMN IF NOT EXISTS reference VARCHAR(255);');

    await sequelize.query("UPDATE pt_requests SET reference = 'APEX-PT-' || upper(substr(replace(id::text,'-',''),1,12)) WHERE reference IS NULL;");
    console.log('Schema ready (sessions + reference columns, durationMonths nullable)');

    console.log('\nMembership plans:');
    for (const [name, price] of Object.entries(MEMBERSHIP_PRICES)) {
      const [count] = await MembershipPlan.update({ price }, { where: { name } });
      console.log(`  ${name}: ₦${price.toLocaleString()} (${count ? 'updated' : 'NOT FOUND - create it in admin'})`);
    }

    {
      const [row, created] = await AppSetting.findOrCreate({
        where: { key: 'joining_fee' },
        defaults: { value: JOINING_FEE, description: 'One-time joining fee charged to new members (NGN)' },
      });
      if (!created) await row.update({ value: JOINING_FEE });
      console.log(`\nJoining fee: ₦${Number(JOINING_FEE).toLocaleString()}`);
    }

    console.log('\nLocker (Apex Vault) prices:');
    for (const [key, value] of Object.entries(LOCKER_PRICES)) {
      const [row, created] = await AppSetting.findOrCreate({
        where: { key },
        defaults: { value, description: 'Locker rental price (NGN)' },
      });
      if (!created) await row.update({ value });
      console.log(`  ${key}: ₦${Number(value).toLocaleString()}`);
    }

    const keepNames = PT_PLANS.map((p) => p.name);
    const [deactivated] = await PTPlan.update(
      { isActive: false },
      { where: { name: { [Op.notIn]: keepNames } } }
    );
    console.log(`\nRetired ${deactivated} old PT plan(s).`);

    console.log('PT plans:');
    for (const def of PT_PLANS) {
      const [plan, created] = await PTPlan.findOrCreate({
        where: { name: def.name },
        defaults: { ...def, durationMonths: null, isActive: true },
      });
      if (!created) {
        await plan.update({
          sessions: def.sessions,
          price: def.price,
          sortOrder: def.sortOrder,
          description: def.description,
          durationMonths: null,
          isActive: true,
        });
      }
      console.log(`  ${def.name}: ₦${def.price.toLocaleString()} - ${def.sessions} sessions (${created ? 'created' : 'updated'})`);
    }

    console.log('\nPricing update complete.');
    process.exit(0);
  } catch (err) {
    console.error('Pricing update failed:', err.message);
    process.exit(1);
  }
}

run();
