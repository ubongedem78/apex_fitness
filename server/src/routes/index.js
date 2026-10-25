const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  requireAdminOrManager, requireStaffOrAbove, requireAdmin,
  requireReceptionistOrStaff,
} = require('../middleware/rbac');

router.use('/auth', require('./auth'));
router.use('/contact', require('./contact'));
router.use('/classes', require('./classes'));
router.use('/trainers', require('./trainers'));
router.use('/locations', require('./locations'));
router.use('/memberships', require('./memberships'));
router.use('/bookings', authenticate, require('./bookings'));
router.use('/payments', authenticate, require('./payments'));
router.use('/users', authenticate, require('./users'));
router.use('/webhooks', require('./webhooks'));

router.use('/cards', authenticate, require('./cards'));

router.use('/settings', authenticate, require('./settings'));

router.use('/lockers', require('./lockerPlans'));
router.use('/lockers', authenticate, require('./lockers'));

router.use('/pt-requests', authenticate, require('./pt-requests'));

router.use('/pt-plans', require('./ptPlans'));

router.use('/receptionist', authenticate, requireReceptionistOrStaff, require('./receptionist'));

router.use('/admin/locations', authenticate, requireAdminOrManager, require('./admin/locations'));
router.use('/admin/members', authenticate, requireAdminOrManager, require('./admin/members'));
router.use('/admin/classes', authenticate, requireStaffOrAbove, require('./admin/classes'));
router.use('/admin/trainers', authenticate, requireAdminOrManager, require('./admin/trainers'));
router.use('/admin/plans', authenticate, requireAdmin, require('./admin/plans'));
router.use('/admin/payments', authenticate, requireAdminOrManager, require('./admin/payments'));
router.use('/admin/promotions', authenticate, requireAdminOrManager, require('./admin/promotions'));
router.use('/admin/reports', authenticate, requireAdminOrManager, require('./admin/reports'));
router.use('/admin/audit', authenticate, requireAdmin, require('./admin/audit'));
router.use('/admin/settings', authenticate, requireAdmin, require('./admin/settings'));
router.use('/admin/pt-plans', authenticate, requireAdmin, require('./admin/ptPlans'));
router.use('/admin/staff',    authenticate, requireAdmin, require('./admin/staff'));

module.exports = router;
