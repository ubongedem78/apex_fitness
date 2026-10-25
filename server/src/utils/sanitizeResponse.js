const SENSITIVE_KEYS = new Set([
  'passwordHash',
  'twoFactorSecret',
  'passwordResetToken',
  'passwordResetExpiry',
  'emailVerificationToken',

  'paystackAuthorizationCode',
  'paystackSubscriptionCode',
  'paystackCustomerCode',
]);

const jsonReplacer = (key, value) => (SENSITIVE_KEYS.has(key) ? undefined : value);

module.exports = { jsonReplacer, SENSITIVE_KEYS };
