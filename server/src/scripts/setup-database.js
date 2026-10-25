require('dotenv').config();
const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize, User, MembershipPlan, PTPlan, AppSetting } = require('../models');

const MEMBERSHIP_PRICES = {
  'Monthly Plan':   30750,
  'Quarterly Plan': 80450,
  'Annual Plan':    305800,
};

const JOINING_FEE = '15100';

const LOCKER_SETTINGS = {
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

async function upsertSetting(key, value, description) {
  const [row, created] = await AppSetting.findOrCreate({ where: { key }, defaults: { value, description } });
  if (!created) await row.update({ value });
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync({ force: false, alter: false });
    console.log('✓ Tables ensured (creates audit_logs and any other missing table)');

    await sequelize.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;');
    await sequelize.query('ALTER TABLE pt_plans ADD COLUMN IF NOT EXISTS sessions INTEGER;');
    await sequelize.query('ALTER TABLE pt_plans ALTER COLUMN "durationMonths" DROP NOT NULL;');
    await sequelize.query('ALTER TABLE pt_requests ADD COLUMN IF NOT EXISTS sessions INTEGER;');
    await sequelize.query('ALTER TABLE pt_requests ADD COLUMN IF NOT EXISTS reference VARCHAR(255);');
    await sequelize.query('ALTER TABLE pt_requests ALTER COLUMN "durationMonths" DROP NOT NULL;');
    await sequelize.query("UPDATE pt_requests SET reference = 'APEX-PT-' || upper(substr(replace(id::text,'-',''),1,12)) WHERE reference IS NULL;");
    console.log('✓ Columns added (tokenVersion, PT sessions + reference) and references backfilled');

    for (const [name, price] of Object.entries(MEMBERSHIP_PRICES)) {
      const [count] = await MembershipPlan.update({ price }, { where: { name } });
      console.log(`  membership ${name}: ₦${price.toLocaleString()} (${count ? 'updated' : 'not found'})`);
    }

    await upsertSetting('joining_fee', JOINING_FEE, 'One-time joining fee charged to new members (NGN)');
    console.log(`✓ Joining fee set (₦${Number(JOINING_FEE).toLocaleString()})`);
    for (const [key, value] of Object.entries(LOCKER_SETTINGS)) await upsertSetting(key, value, 'Locker pricing (NGN)');
    await upsertSetting('locker_paystack_monthly_plan_code', '', 'Paystack plan code for monthly locker subscription');
    await upsertSetting('locker_paystack_quarterly_plan_code', '', 'Paystack plan code for quarterly locker subscription');
    console.log('✓ Locker settings set (₦15k monthly, ₦30k quarterly, ₦25k setup fee)');

    const keep = PT_PLANS.map((p) => p.name);
    await PTPlan.update({ isActive: false }, { where: { name: { [Op.notIn]: keep } } });
    for (const def of PT_PLANS) {
      const [plan, created] = await PTPlan.findOrCreate({ where: { name: def.name }, defaults: { ...def, durationMonths: null, isActive: true } });
      if (!created) await plan.update({ ...def, durationMonths: null, isActive: true });
    }
    console.log('✓ PT plans set (6 session-based; older plans retired)');

    const envPw = process.env.SEED_MANAGER_PASSWORD;
    const generated = !envPw || envPw.length < 8;
    const managerPassword = generated
      ? crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)
      : envPw;
    const [, managerCreated] = await User.findOrCreate({
      where: { email: 'manager@apexfitness.ng' },
      defaults: { firstName: 'Apex', lastName: 'Manager', email: 'manager@apexfitness.ng', passwordHash: managerPassword, role: 'manager', isActive: true, phone: null },
    });
    if (managerCreated && generated) {
      console.log(`✓ Manager created - manager@apexfitness.ng / ${managerPassword}  (save this now)`);
    } else {
      console.log(`✓ Manager account ${managerCreated ? 'created' : 'already exists'}`);
    }

    console.log('\nDatabase setup complete. Next: run `npm run create-locker-plans` (needs the LIVE Paystack key) to wire locker auto-renewal.');
    process.exit(0);
  } catch (err) {
    console.error('Setup failed:', err.message);
    process.exit(1);
  }
}

run();
