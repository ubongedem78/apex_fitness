const { Op } = require('sequelize');
const { Payment, Subscription, Notification, User, MembershipPlan, LockerSubscription } = require('../models');
const { validateWebhookSignature } = require('../utils/paystack');
const {
  sendBillingReminder,
  sendPaymentFailed,
  sendCardExpiring,
  sendMembershipActivation,
  sendPaymentReceipt,
} = require('../utils/email');

const calcEndDate = (startDate, billingCycle) => {
  const end = new Date(startDate);
  if (billingCycle === 'daily') {
    end.setDate(end.getDate() + 1);
  } else if (billingCycle === 'monthly') {
    end.setMonth(end.getMonth() + 1);
  } else if (billingCycle === 'quarterly') {
    end.setMonth(end.getMonth() + 3);
  } else {
    end.setFullYear(end.getFullYear() + 1);
  }
  return end.toISOString().split('T')[0];
};

const handlePaystack = async (rawBody, signature) => {
  let body = rawBody;

  if (Buffer.isBuffer(body)) {
    const rawStr = body.toString('utf8');
    try {
      body = JSON.parse(rawStr);
    } catch (_) {
      const err = new Error('Invalid body');
      err.statusCode = 400;
      throw err;
    }
  }

  const isValid = validateWebhookSignature(body, signature);
  if (!isValid) {
    const err = new Error('Invalid Paystack webhook signature');
    err.statusCode = 401;
    throw err;
  }

  const { event, data } = body;

  switch (event) {
    case 'charge.success': {
      const { reference } = data;

      if (reference && reference.startsWith('APEX-CARD-')) break;

      const payment = await Payment.findOne({ where: { paystackReference: reference } });
      if (!payment || payment.status === 'success') break;

      await payment.update({
        status: 'success',
        paystackTransactionId: String(data.id),
      });

      const subscriptionCode = data.subscription_code || (data.subscription && data.subscription.subscription_code);
      if (subscriptionCode && !payment.subscriptionId) {
        const subscription = await Subscription.findOne({
          where: { paystackSubscriptionCode: subscriptionCode },
          include: [{ model: MembershipPlan, as: 'plan' }],
        });
        if (subscription && subscription.plan) {
          const newEndDate = calcEndDate(new Date().toISOString().split('T')[0], subscription.plan.billingCycle);
          await subscription.update({
            status: 'active',
            endDate: newEndDate,
            nextBillingDate: newEndDate,
            attentionAt: null,
            gracePeriodEnds: null,
          });
          await payment.update({ subscriptionId: subscription.id });

          const user = await User.findByPk(subscription.userId);
          if (user) {
            sendPaymentReceipt(user, payment).catch(() => {});
          }
        }
        break;
      }

      if (payment.userId) {
        await Notification.create({
          userId: payment.userId,
          title: 'Payment Successful',
          message: `Your payment of ${payment.currency} ${payment.amount} was successful.`,
          type: 'payment',
          metadata: { paymentId: payment.id, reference },
        });
      }
      break;
    }

    case 'subscription.create': {
      const subscriptionCode = data.subscription_code;
      const authCode = data.authorization && data.authorization.authorization_code;
      if (subscriptionCode) {
        await Subscription.update(
          { paystackSubscriptionCode: subscriptionCode },
          { where: { paystackAuthorizationCode: authCode, status: 'active' } }
        );
      }
      break;
    }

    case 'subscription.not_renew': {
      const { subscription_code } = data;
      if (subscription_code) {
        const subscription = await Subscription.findOne({ where: { paystackSubscriptionCode: subscription_code } });
        if (subscription) {
          await Notification.create({
            userId: subscription.userId,
            title: 'Membership Cancellation Confirmed',
            message: `Your membership is set to cancel. You retain access until ${subscription.endDate}.`,
            type: 'payment',
            metadata: { subscriptionId: subscription.id },
          });
        }
      }
      break;
    }

    case 'subscription.disable': {
      const { subscription_code } = data;
      if (subscription_code) {
        await Subscription.update(
          { status: 'cancelled', cancelledAt: new Date(), cancelReason: 'Cancelled via Paystack' },
          { where: { paystackSubscriptionCode: subscription_code } }
        );
      }
      break;
    }

    case 'invoice.create': {
      const subscriptionCode = data.subscription && data.subscription.subscription_code;
      if (subscriptionCode) {
        const subscription = await Subscription.findOne({
          where: { paystackSubscriptionCode: subscriptionCode },
          include: [{ model: MembershipPlan, as: 'plan' }],
        });
        if (subscription && subscription.plan) {
          const user = await User.findByPk(subscription.userId);
          if (user) {
            sendBillingReminder(user, subscription, subscription.plan).catch(() => {});
            await Notification.create({
              userId: user.id,
              title: 'Upcoming Renewal',
              message: `Your ${subscription.plan.name} renews in 3 days. Your card on file will be charged automatically.`,
              type: 'payment',
              metadata: { subscriptionId: subscription.id },
            });
          }
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const subscriptionCode = data.subscription && data.subscription.subscription_code;
      if (subscriptionCode) {
        const subscription = await Subscription.findOne({
          where: { paystackSubscriptionCode: subscriptionCode }
        });
        if (subscription) {
          const gracePeriodEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await subscription.update({
            status: 'attention',
            attentionAt: new Date(),
            gracePeriodEnds,
          });

          const user = await User.findByPk(subscription.userId);
          if (user) {
            sendPaymentFailed(user, subscription).catch(() => {});
            await Notification.create({
              userId: user.id,
              title: 'Payment Failed',
              message: `Your membership renewal payment failed. Update your card before ${gracePeriodEnds.toLocaleDateString()} to avoid losing access.`,
              type: 'payment',
              metadata: { subscriptionId: subscription.id },
            });
          }
        }
      }
      break;
    }

    case 'invoice.update': {
      const inv = data || {};
      const sub = inv.subscription || {};
      const subscriptionCode = sub.subscription_code;
      if (!subscriptionCode) break;

      const paid = inv.paid === true || inv.status === 'success';
      const txnRef = (inv.transaction && inv.transaction.reference) || null;
      const nextPaymentDate = sub.next_payment_date ? sub.next_payment_date.split('T')[0] : null;
      const amount = (inv.amount || sub.amount || 0) / 100;
      const todayStr = new Date().toISOString().split('T')[0];

      console.log(`[webhook][renewal] invoice.update code=${subscriptionCode} paid=${paid} ref=${txnRef || '-'} next=${nextPaymentDate || '-'} amount=${amount}`);

      if (paid && txnRef) {
        const already = await Payment.findOne({ where: { paystackReference: txnRef } });
        if (already) {
          console.log(`[webhook][renewal] duplicate invoice ref=${txnRef} already processed, skipping`);
          break;
        }
      }

      const subscription = await Subscription.findOne({
        where: { paystackSubscriptionCode: subscriptionCode },
        include: [{ model: MembershipPlan, as: 'plan' }],
      });

      if (subscription) {
        if (paid) {
          const cycle = subscription.plan ? subscription.plan.billingCycle : 'monthly';
          const base = subscription.endDate && subscription.endDate > todayStr ? subscription.endDate : todayStr;
          const newEndDate = nextPaymentDate || calcEndDate(base, cycle);
          const prevEndDate = subscription.endDate;
          await subscription.update({
            status: 'active',
            endDate: newEndDate,
            nextBillingDate: nextPaymentDate || newEndDate,
            attentionAt: null,
            gracePeriodEnds: null,
          });
          console.log(`[webhook][renewal] membership extended user=${subscription.userId} sub=${subscription.id} endDate ${prevEndDate} -> ${newEndDate} ref=${txnRef || '-'} amount=${amount}`);
          if (txnRef) {
            try {
              const payment = await Payment.create({
                userId: subscription.userId,
                subscriptionId: subscription.id,
                amount,
                currency: 'NGN',
                type: 'subscription',
                status: 'success',
                paystackReference: txnRef,
                description: `${subscription.plan ? subscription.plan.name : 'Membership'} renewal`,
                metadata: { renewal: true, invoiceCode: inv.invoice_code },
              });
              const user = await User.findByPk(subscription.userId);
              if (user) sendPaymentReceipt(user, payment).catch(() => {});
            } catch (e) {
              if (e.name !== 'SequelizeUniqueConstraintError') throw e;
            }
          }
        } else if (nextPaymentDate) {
          await subscription.update({ nextBillingDate: nextPaymentDate });
        }
        break;
      }

      const locker = await LockerSubscription.findOne({ where: { paystackSubscriptionCode: subscriptionCode } });
      if (locker && paid) {
        const base = locker.endDate && locker.endDate > todayStr ? locker.endDate : todayStr;
        const newEndDate = nextPaymentDate || calcEndDate(base, locker.billingCycle);
        const prevEndDate = locker.endDate;
        await locker.update({ status: 'active', endDate: newEndDate });
        console.log(`[webhook][renewal] locker extended user=${locker.userId} locker=${locker.id} endDate ${prevEndDate} -> ${newEndDate} ref=${txnRef || '-'} amount=${amount}`);
        if (txnRef) {
          try {
            await Payment.create({
              userId: locker.userId,
              amount,
              currency: 'NGN',
              type: 'locker',
              status: 'success',
              paystackReference: txnRef,
              description: 'Locker rental renewal',
              metadata: { renewal: true, invoiceCode: inv.invoice_code, type: 'locker' },
            });
          } catch (e) {
            if (e.name !== 'SequelizeUniqueConstraintError') throw e;
          }
        }
      }

      if (paid && !locker) {
        console.warn(`[webhook][renewal] paid invoice code=${subscriptionCode} matched no membership or locker - access NOT extended`);
      }
      break;
    }

    case 'subscription.expiring_cards': {
      if (Array.isArray(data) && data.length > 0) {
        const authCodes = data
          .map((item) => item.authorization && item.authorization.authorization_code)
          .filter(Boolean);

        if (authCodes.length > 0) {
          const users = await User.findAll({
            where: { paystackAuthorizationCode: { [Op.in]: authCodes } },
          });

          const notifications = users.map((user) => {
            sendCardExpiring(user).catch(() => {});
            return {
              userId: user.id,
              title: 'Card Expiring Soon',
              message: `Your card on file (**** ${user.cardLast4}) is expiring soon. Update it to avoid payment issues.`,
              type: 'payment',
              metadata: {},
            };
          });

          if (notifications.length > 0) await Notification.bulkCreate(notifications);
        }
      }
      break;
    }

    default:
      break;
  }
};

module.exports = { handlePaystack };
