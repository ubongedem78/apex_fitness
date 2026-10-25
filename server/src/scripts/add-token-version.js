require('dotenv').config();
const { sequelize } = require('../models');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    await sequelize.query(
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;'
    );
    console.log('users.tokenVersion column ready');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

run();
