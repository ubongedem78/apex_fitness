const router = require('express').Router();
const validate = require('../middleware/validate');
const { activateSubscriptionSchema } = require('../validators/adminValidator');
const { lookup, checkin, todayVisits, assignPT, removePT, allAssignments } = require('../controllers/visitController');
const { getAllPTRequests, getPTRequestCount, confirmPTRequest } = require('../controllers/ptRequestController');
const { getAllForReceptionist } = require('../controllers/paymentController');
const { lookup: paymentLookup, report: paymentReport } = require('../controllers/paymentLookupController');
const { activateSubscription, getSubscription } = require('../controllers/admin/memberController');

router.get('/lookup/:memberNumber', lookup);
router.post('/checkin', checkin);
router.get('/visits/today', todayVisits);

router.get('/payment-lookup', paymentLookup);
router.get('/payment-report', paymentReport);

router.post('/pt-assign', assignPT);
router.delete('/pt-assign/:userId', removePT);
router.get('/pt-assignments', allAssignments);

router.get('/pt-requests', getAllPTRequests);
router.get('/pt-requests/count', getPTRequestCount);
router.put('/pt-requests/:id/confirm', confirmPTRequest);

router.get('/payments', getAllForReceptionist);

router.get('/members/:id/subscription', getSubscription);
router.post('/members/:id/activate-subscription', validate(activateSubscriptionSchema), activateSubscription);

module.exports = router;
