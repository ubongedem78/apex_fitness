const crypto = require('crypto');
const { Op } = require('sequelize');
const { User } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendWelcomeEmail, sendPasswordOtp } = require('../utils/email');

const err = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const otpAttempts = new Map();
const OTP_MAX_ATTEMPTS = 5;
const OTP_ATTEMPT_TTL_MS = 15 * 60 * 1000;

const getOtpAttempts = (email) => {
  const entry = otpAttempts.get(email);
  if (!entry) return 0;
  if (Date.now() > entry.expiresAt) {
    otpAttempts.delete(email);
    return 0;
  }
  return entry.count;
};

const setOtpAttempts = (email, count) => {
  otpAttempts.set(email, { count, expiresAt: Date.now() + OTP_ATTEMPT_TTL_MS });
};

if (process.env.NODE_ENV !== 'test') {
  const otpSweeper = setInterval(() => {
    const now = Date.now();
    for (const [email, entry] of otpAttempts) {
      if (now > entry.expiresAt) otpAttempts.delete(email);
    }
  }, 10 * 60 * 1000);
  otpSweeper.unref();
}

const generateMemberNumber = async () => {
  const max = await User.max('memberNumber');

  return (max || 0) + 1;
};

const register = async ({ firstName, lastName, email, password, phone, dateOfBirth, ptRequested, termsAcceptedAt }) => {
  if (await User.findOne({ where: { email } })) {
    throw err('Email already in use', 409);
  }

  if (phone && await User.findOne({ where: { phone } })) {
    throw err('Phone number already in use', 409);
  }

  const memberNumber = await generateMemberNumber();

  const user = await User.create({
    firstName,
    lastName,
    email,
    phone: phone || null,
    passwordHash: password,
    dateOfBirth: dateOfBirth || null,
    ptRequested: ptRequested === true,
    termsAcceptedAt: termsAcceptedAt ? new Date(termsAcceptedAt) : null,
    memberNumber,
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  sendWelcomeEmail(user).catch((e) => {
    console.error('[email] sendWelcomeEmail failed:', e?.message || e);
  });

  return { user, accessToken, refreshToken };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });

  const invalid = err('Invalid email or password', 401);
  if (!user) throw invalid;

  if (!user.isActive) {
    throw err('Your account has been suspended. Contact support to restore access.', 403);
  }

  if (!await user.validatePassword(password)) throw invalid;

  await user.update({ lastLoginAt: new Date() });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user, accessToken, refreshToken };
};

const refresh = async ({ refreshToken }) => {
  if (!refreshToken) throw err('Refresh token is required', 400);

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (_) {
    throw err('Session expired, please sign in again', 401);
  }

  const user = await User.findByPk(decoded.id);
  if (!user || !user.isActive) throw err('Session expired, please sign in again', 401);

  if ((decoded.tv || 0) !== (user.tokenVersion || 0)) {
    throw err('Session expired, please sign in again', 401);
  }

  return { accessToken: generateAccessToken(user) };
};

const logout = async (user) => {
  if (user) await user.update({ tokenVersion: (user.tokenVersion || 0) + 1 });
  return { message: 'Logged out successfully' };
};

const getMe = async (user) => ({ user });

const updateMe = async (user, body) => {
  const allowed = [
    'firstName', 'lastName', 'phone', 'dateOfBirth',
    'gender', 'emergencyContactName', 'emergencyContactPhone', 'ptRequested', 'termsAcceptedAt',
  ];
  const updates = {};
  for (const field of allowed) {
    if (body[field] !== undefined) updates[field] = body[field];
  }
  await user.update(updates);
  return { user };
};

const forgotPassword = async ({ email }) => {

  const generic = { message: 'If that email is registered, a reset code is on its way.' };

  const user = await User.findOne({ where: { email } });
  if (!user) return generic;

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

  await user.update({
    passwordResetToken: otpHash,
    passwordResetExpiry: new Date(Date.now() + 15 * 60 * 1000),
  });

  sendPasswordOtp(user, otp).catch((e) => {
    console.error('[email] sendPasswordOtp failed:', e?.message || e);
  });

  return generic;
};

const verifyOtp = async ({ email, otp }) => {
  const user = await User.findOne({ where: { email } });
  if (!user || !user.passwordResetToken || !user.passwordResetExpiry) {
    throw err('Invalid or expired code', 400);
  }

  if (new Date() > user.passwordResetExpiry) {
    await user.update({ passwordResetToken: null, passwordResetExpiry: null });
    otpAttempts.delete(email);
    throw err('That code has expired. Request a new one.', 400);
  }

  const attempts = getOtpAttempts(email);
  if (attempts >= OTP_MAX_ATTEMPTS) {
    await user.update({ passwordResetToken: null, passwordResetExpiry: null });
    otpAttempts.delete(email);
    throw err('Too many incorrect attempts. Please request a new code.', 429);
  }

  const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
  if (otpHash !== user.passwordResetToken) {
    const newCount = attempts + 1;
    if (newCount >= OTP_MAX_ATTEMPTS) {
      await user.update({ passwordResetToken: null, passwordResetExpiry: null });
      otpAttempts.delete(email);
      throw err('Too many incorrect attempts. Please request a new code.', 429);
    }
    setOtpAttempts(email, newCount);
    const remaining = OTP_MAX_ATTEMPTS - newCount;
    throw err(`Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`, 400);
  }

  otpAttempts.delete(email);

  const resetToken = crypto.randomBytes(32).toString('hex');
  await user.update({
    passwordResetToken: resetToken,
    passwordResetExpiry: new Date(Date.now() + 10 * 60 * 1000),
  });

  return { resetToken };
};

const resetPassword = async ({ token, password }) => {
  const user = await User.findOne({ where: { passwordResetToken: token } });
  if (!user || !user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
    throw err('This reset link is invalid or has expired. Request a new code.', 400);
  }

  await user.update({
    passwordHash: password,
    passwordResetToken: null,
    passwordResetExpiry: null,

    tokenVersion: (user.tokenVersion || 0) + 1,
  });

  return { message: 'Password updated. You can now sign in.' };
};

const changePassword = async (user, { oldPassword, newPassword }) => {
  if (!await user.validatePassword(oldPassword)) {
    throw err('Current password is incorrect', 400);
  }

  if (await user.validatePassword(newPassword)) {
    throw err('New password must be different from your current password', 400);
  }

  await user.update({ passwordHash: newPassword, tokenVersion: (user.tokenVersion || 0) + 1 });
  return {
    message: 'Password updated',
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
};

module.exports = { register, login, refresh, logout, getMe, updateMe, forgotPassword, verifyOtp, resetPassword, changePassword };
