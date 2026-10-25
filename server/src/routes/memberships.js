const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  getPlans,
  getPlanById,
  subscribe,
  verifyPayment,
  applyPromo,
  cancelMembership,
  resumeMembership,
  upgrade
} = require('../controllers/membershipController');

router.get('/plans', getPlans);
router.get('/plans/:id', getPlanById);
router.post('/subscribe', authenticate, subscribe);
router.post('/verify-payment', authenticate, verifyPayment);
router.post('/apply-promo', authenticate, applyPromo);
router.delete('/cancel', authenticate, cancelMembership);
router.post('/resume', authenticate, resumeMembership);
router.post('/upgrade', authenticate, upgrade);

module.exports = router;
