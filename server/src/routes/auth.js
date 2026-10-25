const router = require('express').Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateMeSchema,
} = require('../validators/authValidator');
const {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateMe,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword
} = require('../controllers/authController');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', optionalAuth, logout);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, validate(updateMeSchema), updateMe);
router.patch('/me', authenticate, validate(updateMeSchema), updateMe);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

module.exports = router;
