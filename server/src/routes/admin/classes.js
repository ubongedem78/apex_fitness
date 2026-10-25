const router = require('express').Router();
const { getAll, create, update, remove, cancel, reactivate, getBookings, getWaitlist } = require('../../controllers/admin/classController');

router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.post('/:id/cancel', cancel);
router.post('/:id/reactivate', reactivate);
router.get('/:id/bookings', getBookings);
router.get('/:id/waitlist', getWaitlist);

module.exports = router;
