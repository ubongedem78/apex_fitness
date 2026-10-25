const router = require('express').Router();
const validate = require('../../middleware/validate');
const { updateMemberSchema, activateSubscriptionSchema } = require('../../validators/adminValidator');
const {
  getAll,
  getOne,
  update,
  suspend,
  reactivate,
  getBookings,
  getPayments,
  activateSubscription,
  getSubscription
} = require('../../controllers/admin/memberController');

router.get('/', getAll);
router.get('/:id', getOne);
router.put('/:id', validate(updateMemberSchema), update);
router.put('/:id/suspend', suspend);
router.put('/:id/reactivate', reactivate);
router.get('/:id/bookings', getBookings);
router.get('/:id/payments', getPayments);
router.post('/:id/activate-subscription', validate(activateSubscriptionSchema), activateSubscription);
router.get('/:id/subscription', getSubscription);

module.exports = router;
