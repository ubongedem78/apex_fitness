require('dotenv').config();
const crypto = require('crypto');
const sequelize = require('../config/database');
const { User, Subscription, Payment, MembershipPlan } = require('../models');
const { handlePaystack } = require('../services/webhookService');

const secret = process.env.PAYSTACK_SECRET_KEY;
const sign = (body) => crypto.createHmac('sha512', secret || '').update(JSON.stringify(body)).digest('hex');

let pass = 0;
let fail = 0;
const check = (name, ok) => { console.log(`  ${ok ? 'PASS' : 'FAIL'}: ${name}`); ok ? pass++ : fail++; };

(async () => {
  const CODE = 'SUB_TEST_RENEWAL_' + Date.now();
  const REF = 'TEST-RENEWAL-' + Date.now();
  let user = null;
  let sub = null;
  let plan = null;
  let createdPlan = false;

  try {
    await sequelize.authenticate();
    console.log('DB connected.');
    if (!secret) {
      console.log('\n!! PAYSTACK_SECRET_KEY is not set in this shell - the signature check will fail.');
      console.log('   Run this where the env var is set (e.g. the Render Shell) and try again.\n');
    }

    plan = await MembershipPlan.findOne();
    if (!plan) {
      plan = await MembershipPlan.create({ name: 'TEST Renewal Plan', price: 1000, billingCycle: 'monthly', isActive: false });
      createdPlan = true;
    }
    const priceKobo = Math.round(Number(plan.price) * 100);

    user = await User.create({
      firstName: 'Renewal',
      lastName: 'Test',
      email: `renewal-test-${Date.now()}@apexfitnessplace.com`,
      passwordHash: 'test-only-not-real',
      role: 'member',
      isActive: true,
    });

    const today = new Date().toISOString().split('T')[0];
    sub = await Subscription.create({
      userId: user.id,
      planId: plan.id,
      status: 'active',
      startDate: today,
      endDate: today,
      nextBillingDate: today,
      paystackSubscriptionCode: CODE,
    });
    console.log(`\nTest subscription created: endDate=${today}, code=${CODE}\n`);

    const nextIso = new Date(Date.now() + 35 * 86400000).toISOString();
    const nextDay = nextIso.split('T')[0];

    const body = {
      event: 'invoice.update',
      data: {
        invoice_code: 'INV_TEST_' + Date.now(),
        amount: priceKobo,
        status: 'success',
        paid: true,
        subscription: { status: 'active', subscription_code: CODE, amount: priceKobo, next_payment_date: nextIso },
        transaction: { reference: REF, status: 'success', amount: priceKobo },
      },
    };

    console.log('[1] Correctly-signed renewal:');
    await handlePaystack(body, sign(body));
    await sub.reload();
    const payment = await Payment.findOne({ where: { paystackReference: REF } });
    check(`endDate advanced ${today} -> ${nextDay}`, sub.endDate === nextDay);
    check('renewal Payment recorded', !!payment);
    check('Payment is success + type=subscription', !!payment && payment.status === 'success' && payment.type === 'subscription');

    console.log('\n[2] Duplicate delivery (must be idempotent):');
    await handlePaystack(body, sign(body));
    const count = await Payment.count({ where: { paystackReference: REF } });
    await sub.reload();
    check('no duplicate Payment created', count === 1);
    check('endDate unchanged on replay', sub.endDate === nextDay);

    console.log('\n[3] Forged signature (must be rejected):');
    let rejected401 = false;
    try {
      await handlePaystack(body, 'not-a-valid-signature');
    } catch (e) {
      rejected401 = e.statusCode === 401;
    }
    check('bad signature rejected with 401', rejected401);

    console.log(`\nRESULT: ${pass} passed, ${fail} failed\n`);
  } catch (e) {
    console.error('\nERROR:', e && e.message ? e.message : e);
    console.error(e);
    fail++;
  } finally {
    try {
      await Payment.destroy({ where: { paystackReference: REF } });
      if (sub) await Subscription.destroy({ where: { id: sub.id } });
      if (user) await User.destroy({ where: { id: user.id } });
      if (createdPlan && plan) await MembershipPlan.destroy({ where: { id: plan.id } });
      console.log('Cleaned up all test data.');
    } catch (e) {
      console.error('Cleanup error (you may need to remove test rows manually):', e.message);
    }
    await sequelize.close();
    process.exit(fail === 0 ? 0 : 1);
  }
})();
