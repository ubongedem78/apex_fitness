const axios = require('axios');
const crypto = require('crypto');

const PAYSTACK_BASE = 'https://api.paystack.co';

const request = async (method, path, data = null) => {
  const res = await axios({
    method,
    url: `${PAYSTACK_BASE}${path}`,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(data && { data }),
  });
  return res.data;
};

const initializeTransaction = ({ email, amount, reference, metadata, callbackUrl }) =>
  request('POST', '/transaction/initialize', {
    email,
    amount: Math.round(amount * 100),
    reference,
    metadata,
    callback_url: callbackUrl,
  });

const verifyTransaction = (reference) =>
  request('GET', `/transaction/verify/${reference}`);

const chargeAuthorization = ({ email, amount, authorizationCode, reference, metadata }) =>
  request('POST', '/transaction/charge_authorization', {
    email,
    amount: Math.round(amount * 100),
    authorization_code: authorizationCode,
    reference,
    metadata,
  });

const createPlan = ({ name, amount, interval }) =>
  request('POST', '/plan', { name, amount: Math.round(amount * 100), interval });

const initializeSubscription = ({ planCode, email, authorizationCode, startDate }) => {
  const payload = { plan: planCode, customer: email };
  if (authorizationCode) payload.authorization = authorizationCode;
  if (startDate) payload.start_date = startDate;
  return request('POST', '/subscription', payload);
};

const cancelSubscription = (subscriptionCode, emailToken) =>
  request('POST', '/subscription/disable', { code: subscriptionCode, token: emailToken });

const enableSubscription = (subscriptionCode, emailToken) =>
  request('POST', '/subscription/enable', { code: subscriptionCode, token: emailToken });

const fetchSubscription = (subscriptionCode) =>
  request('GET', `/subscription/${subscriptionCode}`);

const disableSubscriptionByCode = async (subscriptionCode) => {
  const res = await fetchSubscription(subscriptionCode);
  const token = res?.data?.email_token;
  if (!token) return { skipped: true, reason: 'no email_token' };
  return cancelSubscription(subscriptionCode, token);
};

const enableSubscriptionByCode = async (subscriptionCode) => {
  const res = await fetchSubscription(subscriptionCode);
  const token = res?.data?.email_token;
  if (!token) return { skipped: true, reason: 'no email_token' };
  return enableSubscription(subscriptionCode, token);
};

const getSubscriptionManageLink = (subscriptionCode) =>
  request('GET', `/subscription/${subscriptionCode}/manage/link`);

const refundTransaction = ({ transactionId, amount }) => {
  const payload = { transaction: transactionId };
  if (amount) payload.amount = Math.round(amount * 100);
  return request('POST', '/refund', payload);
};

const listTransactions = ({ page = 1, perPage = 50, status, from, to } = {}) => {
  const params = new URLSearchParams({ page, perPage });
  if (status) params.append('status', status);
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  return request('GET', `/transaction?${params}`);
};

const validateWebhookSignature = (body, signature) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  const a = Buffer.from(hash, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = {
  initializeTransaction,
  verifyTransaction,
  chargeAuthorization,
  createPlan,
  initializeSubscription,
  cancelSubscription,
  enableSubscription,
  disableSubscriptionByCode,
  enableSubscriptionByCode,
  fetchSubscription,
  getSubscriptionManageLink,
  refundTransaction,
  listTransactions,
  validateWebhookSignature,
};
