require('dotenv').config();
const sequelize = require('../config/database');

const VALUES = ['subscription', 'locker'];

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    for (const value of VALUES) {
      try {
        await sequelize.query(`ALTER TYPE "enum_notifications_type" ADD VALUE IF NOT EXISTS '${value}'`);
        console.log(`enum value ready: ${value}`);
      } catch (err) {
        if (/already exists/i.test(err.message || '')) {
          console.log(`already present: ${value}`);
          continue;
        }
        throw err;
      }
    }

    const [rows] = await sequelize.query(
      `SELECT e.enumlabel FROM pg_enum e
       JOIN pg_type t ON t.oid = e.enumtypid
       WHERE t.typname = 'enum_notifications_type'
       ORDER BY e.enumsortorder`
    );
    console.log('current notification types:', rows.map((r) => r.enumlabel).join(', '));
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exit(1);
  }
})();
