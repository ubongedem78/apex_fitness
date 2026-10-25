const router = require('express').Router();
const { requireAdmin } = require('../../middleware/rbac');
const { getReport, getOverview, getRevenue, getMembers, getClasses, getBookings } = require('../../controllers/admin/reportController');

router.get('/', getReport);
router.get('/overview', getOverview);
router.get('/revenue', requireAdmin, getRevenue);
router.get('/members', getMembers);
router.get('/classes', getClasses);
router.get('/bookings', getBookings);

module.exports = router;
