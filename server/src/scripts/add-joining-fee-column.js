require('dotenv').config();
const sequelize = require('../config/database');
const { Payment } = require('../models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.query(
      `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "joiningFee" DECIMAL(10,2) NOT NULL DEFAULT 0`
    );
    console.log('column ready: payments."joiningFee"');

    const candidates = await Payment.findAll({
      where: { joiningFee: 0 },
      attributes: ['id', 'metadata'],
    });

    let backfilled = 0;
    for (const row of candidates) {
      const raw = row.metadata && row.metadata.joiningFee;
      const fee = parseFloat(raw);
      if (!Number.isFinite(fee) || fee <= 0) continue;
      await row.update({ joiningFee: fee });
      backfilled += 1;
    }
    console.log(`backfilled from metadata: ${backfilled} payment(s)`);

    const [rows] = await sequelize.query(
      `SELECT COUNT(*) AS n, COALESCE(SUM("joiningFee"), 0) AS total
         FROM payments WHERE status = 'success' AND "joiningFee" > 0`
    );
    console.log(`payments now tagged with a joining fee: ${rows[0].n} (₦${Number(rows[0].total).toLocaleString()})`);

    const [manual] = await sequelize.query(
      `SELECT COUNT(*) AS n FROM payments
        WHERE status = 'success' AND "joiningFee" = 0
          AND "paystackReference" LIKE 'APEX-MANUAL-%'`
    );
    if (Number(manual[0].n) > 0) {
      console.log(`\nNOTE: ${manual[0].n} manual/offline payment(s) have no joining fee recorded.`);
      console.log('If a joining fee was collected in cash for any of them, run:');
      console.log('  node src/scripts/fix-manual-joining-fee.js');
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exit(1);
  }
})();
