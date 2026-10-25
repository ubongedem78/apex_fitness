require('dotenv').config();
const { sequelize, AppSetting } = require('../models');
const { createPlan } = require('../utils/paystack');
const { getSetting } = require('../services/settingService');

async function run() {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY is not set - cannot create plans.');
      process.exit(1);
    }
    await sequelize.authenticate();
    console.log('Database connected');

    const monthly = parseFloat(await getSetting('locker_monthly_price').catch(() => '15000')) || 15000;
    const quarterly = parseFloat(await getSetting('locker_quarterly_price').catch(() => '30000')) || 30000;

    const plans = [
      { key: 'locker_paystack_monthly_plan_code',   name: 'Apex Vault - Monthly Locker',   amount: monthly,   interval: 'monthly' },
      { key: 'locker_paystack_quarterly_plan_code', name: 'Apex Vault - Quarterly Locker', amount: quarterly, interval: 'quarterly' },
    ];

    for (const p of plans) {
      const existing = (await getSetting(p.key).catch(() => '')) || '';
      if (existing) {
        console.log(`• ${p.key} already set (${existing}) - skipping. Clear it in Admin → Settings to recreate.`);
        continue;
      }

      const res = await createPlan({ name: p.name, amount: p.amount, interval: p.interval });
      const code = res && res.data && res.data.plan_code;
      if (!code) {
        console.error(`  Failed to create plan for ${p.key}:`, JSON.stringify(res));
        continue;
      }

      const [row, created] = await AppSetting.findOrCreate({
        where: { key: p.key },
        defaults: { value: code, description: 'Paystack plan code for locker subscription' },
      });
      if (!created) await row.update({ value: code });

      console.log(`✓ ${p.name}: ₦${p.amount.toLocaleString()}/${p.interval} → ${code}`);
    }

    console.log('\nLocker Paystack plans ready. Auto-renewal is now wired up.');
    process.exit(0);
  } catch (err) {
    console.error('Failed:', (err.response && err.response.data && err.response.data.message) || err.message);
    process.exit(1);
  }
}

run();
