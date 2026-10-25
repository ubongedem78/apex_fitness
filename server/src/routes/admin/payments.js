const router = require('express').Router();
const { getAll, getOne, refund } = require('../../controllers/admin/paymentController');
const { lookup, report } = require('../../controllers/paymentLookupController');

router.get('/', getAll);
router.get('/lookup', lookup);
router.get('/report', report);
router.get('/:id', getOne);
router.post('/:id/refund', refund);

module.exports = router;
