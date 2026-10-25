require('dotenv').config();
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Payment, User } = require('../models');

const APPLY = process.argv.includes('--apply');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected. Mode:', APPLY ? 'APPLY (will delete)' : 'DRY-RUN (no changes)');

    const [groups] = await sequelize.query(`
      SELECT "userId", amount, description, date_trunc('day', "createdAt") AS day, COUNT(*) AS n
      FROM payments
      WHERE "paystackReference" LIKE 'APEX-MANUAL-%'
      GROUP BY "userId", amount, description, date_trunc('day', "createdAt")
      HAVING COUNT(*) > 1
    `);

    if (!groups.length) {
      console.log('No duplicate manual payments found.');
      process.exit(0);
    }

    let toRemove = 0;
    for (const g of groups) {
      const dayStart = new Date(g.day);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const rows = await Payment.findAll({
        where: {
          userId: g.userId,
          amount: g.amount,
          description: g.description,
          paystackReference: { [Op.like]: 'APEX-MANUAL-%' },
          createdAt: { [Op.gte]: dayStart, [Op.lt]: dayEnd },
        },
        order: [['createdAt', 'ASC']],
      });
      const keep = rows[0];
      const dupes = rows.slice(1);
      const u = await User.findByPk(g.userId, { attributes: ['firstName', 'lastName', 'memberNumber'] });
      const who = u ? `${u.firstName} ${u.lastName} (#${u.memberNumber ? 100000 + u.memberNumber : '?'})` : g.userId;

      console.log(`\n${who} - ${rows.length}x "${g.description}" @ ${g.amount}`);
      console.log(`  KEEP   : ${keep.paystackReference}  (${new Date(keep.createdAt).toISOString()})`);
      for (const d of dupes) {
        console.log(`  REMOVE : ${d.paystackReference}  (${new Date(d.createdAt).toISOString()})`);
        toRemove += 1;
        if (APPLY) await d.destroy();
      }
    }

    console.log(`\n${APPLY ? 'Deleted' : 'Would delete'} ${toRemove} duplicate payment record(s).`);
    if (!APPLY) console.log('Re-run with --apply once the list looks right.');
    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exit(1);
  }
})();
