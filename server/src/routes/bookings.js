const router = require('express').Router();
const { getAll, create, cancel } = require('../controllers/bookingController');
const validate = require('../middleware/validate');
const { createBookingSchema } = require('../validators/bookingValidator');

router.get('/', getAll);
router.post('/', validate(createBookingSchema), create);
router.delete('/:id', cancel);

module.exports = router;
