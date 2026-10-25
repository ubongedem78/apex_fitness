require('dotenv').config();
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Payment, User } = require('../models');
const { getJoiningFee } = require('../services/settingService');

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : null;
};
const APPLY = process.argv.includes('--apply');

(async () => {
  try {
    const memberArg = arg('member');
    if (!memberArg) {
      console.error('Missing --member=<memberNumber>, e.g. --member=100003');
      process.exit(1);
    }

    await sequelize.authenticate();
    console.log('Mode:', APPLY ? 'APPLY (will write)' : 'DRY-RUN (no changes)');

    const raw = parseInt(memberArg, 10);
    const memberNumber = raw >= 100000 ? raw - 100000 : raw;
    const user = await User.findOne({ where: { memberNumber } });
    if (!user) {
      console.error(`No member found with number ${memberArg}`);
      process.exit(1);
    }

    const fee = parseFloat(arg('fee') || await getJoiningFee().catch(() => 0));
    if (!fee || fee <= 0) {
      console.error('Could not determine a joining fee. Pass one with --fee=15100');
      process.exit(1);
    }

    const where = {
      userId: user.id,
      status: 'success',
      paystackReference: { [Op.like]: 'APEX-MANUAL-%' },
    };
    const refArg = arg('ref');
    if (refArg) where.paystackReference = refArg;

    const payment = await Payment.findOne({ where, order: [['createdAt', 'ASC']] });
    if (!payment) {
      console.error('No manual payment found for that member.');
      process.exit(1);
    }

    if (parseFloat(payment.joiningFee) > 0) {
      console.log(`${payment.paystackReference} already has a joining fee of ₦${Number(payment.joiningFee).toLocaleString()}. Nothing to do.`);
      process.exit(0);
    }

    const oldAmount = parseFloat(payment.amount);
    const newAmount = oldAmount + fee;
    const newDescription = /Joining Fee/i.test(payment.description || '')
      ? payment.description
      : (payment.description || '').replace(
          ' (manual activation by admin)',
          ' + Joining Fee (manual activation by admin)'
        );

    console.log(`\nMember      : ${user.firstName} ${user.lastName} (#${100000 + user.memberNumber})`);
    console.log(`Payment     : ${payment.paystackReference}  ${new Date(payment.createdAt).toISOString()}`);
    console.log(`Amount      : ₦${oldAmount.toLocaleString()}  ->  ₦${newAmount.toLocaleString()}`);
    console.log(`Joining fee : ₦0  ->  ₦${fee.toLocaleString()}`);
    console.log(`Description : ${newDescription}`);

    if (APPLY) {
      await payment.update({
        amount: newAmount,
        joiningFee: fee,
        description: newDescription,
        metadata: {
          ...(payment.metadata || {}),
          planPrice: oldAmount,
          joiningFee: fee,
          correctedAt: new Date().toISOString(),
          correctionNote: 'Joining fee was collected offline but not recorded at activation time.',
        },
      });
      console.log('\nApplied.');
    } else {
      console.log('\nDry-run only. Re-run with --apply to write this change.');
    }
    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exit(1);
  }
})();
