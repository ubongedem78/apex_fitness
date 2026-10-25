require('dotenv').config();
const { sequelize } = require('../models');

async function migrateAlter() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const earlyEnumAlters = [
      `ALTER TYPE "enum_membership_plans_billingCycle" ADD VALUE IF NOT EXISTS 'quarterly'`,
      `ALTER TYPE "enum_payments_type" ADD VALUE IF NOT EXISTS 'locker'`,
      `ALTER TYPE "enum_payments_type" ADD VALUE IF NOT EXISTS 'pt_session'`,
    ];
    for (const sql of earlyEnumAlters) {
      try {
        await sequelize.query(sql);
        console.log(`ENUM updated: ${sql}`);
      } catch (enumErr) {
        if (!enumErr.message.includes('does not exist')) throw enumErr;
      }
    }

    const newEnums = [
      { name: 'enum_locker_subscriptions_billingCycle', values: ['monthly', 'quarterly'] },
      { name: 'enum_locker_subscriptions_status',       values: ['active', 'cancelled', 'expired'] },
      { name: 'enum_pt_requests_status',                values: ['pending', 'paid', 'assigned', 'cancelled'] },
    ];
    for (const { name, values } of newEnums) {
      try {
        await sequelize.query(`CREATE TYPE "${name}" AS ENUM (${values.map((v) => `'${v}'`).join(', ')})`);
        console.log(`ENUM ${name} created`);
      } catch (enumErr) {

        if (enumErr.original?.code !== '42710') {
          if (!enumErr.message.includes('already exists')) throw enumErr;
        }
      }
    }

    const PTPlan = require('../models/PTPlan');
    await PTPlan.sync({ force: false });

    await sequelize.sync({ force: false, alter: true });
    console.log('Tables altered successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrateAlter();
