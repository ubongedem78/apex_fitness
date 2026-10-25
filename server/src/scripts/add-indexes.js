require('dotenv').config();
const { sequelize } = require('../models');

const indexes = [
  {
    name: 'visits_userId_visitDate',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "visits_userId_visitDate"
          ON "visits" ("userId", "visitDate")`,
  },
  {
    name: 'visits_visitDate_locationId',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "visits_visitDate_locationId"
          ON "visits" ("visitDate", "locationId")`,
  },
  {
    name: 'subscriptions_userId_status',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "subscriptions_userId_status"
          ON "subscriptions" ("userId", "status")`,
  },
  {
    name: 'bookings_classId_status',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "bookings_classId_status"
          ON "bookings" ("classId", "status")`,
  },
  {
    name: 'bookings_userId',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "bookings_userId"
          ON "bookings" ("userId")`,
  },
];

async function addIndexes() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    for (const { name, sql } of indexes) {
      try {
        await sequelize.query(sql);
        console.log(`Index ready: ${name}`);
      } catch (indexErr) {

        if (indexErr.original?.code === '23505' || /already exists/.test(indexErr.message)) {
          console.log(`Index ${name} already exists`);
          continue;
        }
        console.error(`Failed to create index ${name}:`, indexErr.message);
        throw indexErr;
      }
    }

    console.log('All indexes created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Index migration failed:', err.message);
    process.exit(1);
  }
}

addIndexes();
