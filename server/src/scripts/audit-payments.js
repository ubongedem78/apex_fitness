require('dotenv').config();
const sequelize = require('../config/database');
const { Payment } = require('../models');

const naira = (n) => '₦' + Number(n || 0).toLocaleString();

(async () => {
  try {
    await sequelize.authenticate();

    const [totals] = await sequelize.query(
      `SELECT COUNT(*) AS n,
              COALESCE(SUM(amount), 0) AS gross,
              COALESCE(SUM("joiningFee"), 0) AS joining
         FROM payments WHERE status = 'success'`
    );
    const t = totals[0];
    const gross = Number(t.gross), joining = Number(t.joining);
    console.log('\n=== REVENUE (successful payments) ===');
    console.log(`  transactions : ${t.n}`);
    console.log(`  gross        : ${naira(gross)}`);
    console.log(`  membership   : ${naira(gross - joining)}`);
    console.log(`  joining fees : ${naira(joining)}`);

    const [manual] = await sequelize.query(
      `SELECT u."firstName", u."lastName", u."memberNumber",
              p."paystackReference", p.amount, p."joiningFee",
              p.description, p."createdAt"
         FROM payments p JOIN users u ON u.id = p."userId"
        WHERE p."paystackReference" LIKE 'APEX-MANUAL-%' AND p.status = 'success'
        ORDER BY u."memberNumber", p."createdAt"`
    );
    console.log(`\n=== MANUAL / OFFLINE ACTIVATIONS (${manual.length}) ===`);
    if (!manual.length) console.log('  none');
    for (const m of manual) {
      const num = m.memberNumber ? 100000 + m.memberNumber : '?';
      console.log(`  #${num} ${m.firstName} ${m.lastName}  ${naira(m.amount)}` +
        (Number(m.joiningFee) > 0 ? ` (incl. ${naira(m.joiningFee)} joining)` : ' (no joining fee)'));
      console.log(`        ${m.paystackReference}  ${new Date(m.createdAt).toISOString().replace('T', ' ').slice(0, 19)}`);
    }

    const [dupes] = await sequelize.query(
      `SELECT u."memberNumber", u."firstName", u."lastName",
              p.amount, p.description, COUNT(*) AS n
         FROM payments p JOIN users u ON u.id = p."userId"
        WHERE p."paystackReference" LIKE 'APEX-MANUAL-%' AND p.status = 'success'
        GROUP BY u."memberNumber", u."firstName", u."lastName", p.amount, p.description,
                 date_trunc('day', p."createdAt")
       HAVING COUNT(*) > 1`
    );
    console.log(`\n=== SUSPECTED DUPLICATES ===`);
    if (!dupes.length) console.log('  none - every offline activation is a single record');
    for (const d of dupes) {
      console.log(`  #${100000 + d.memberNumber} ${d.firstName} ${d.lastName}: ${d.n} x ${naira(d.amount)}`);
    }

    const pending = await Payment.findAll({
      where: { status: 'success', joiningFee: 0 },
      attributes: ['id', 'metadata'],
    });
    const untagged = pending.filter((p) => {
      const fee = parseFloat(p.metadata && p.metadata.joiningFee);
      return Number.isFinite(fee) && fee > 0;
    }).length;

    console.log(`\n=== BACKFILL CHECK ===`);
    console.log(untagged === 0
      ? '  OK - every payment carrying a joining fee in metadata is tagged'
      : `  ${untagged} payment(s) still untagged - run: npm run migrate:joining-fee`);

    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exit(1);
  }
})();
