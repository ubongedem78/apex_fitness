const router = require('express').Router();
const {
  getMe,
  getBookings,
  getSubscriptions,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getAvatarUploadUrl,
  saveAvatar
} = require('../controllers/userController');

router.get('/me', getMe);
router.get('/bookings', getBookings);
router.get('/subscriptions', getSubscriptions);
router.get('/notifications', getNotifications);
router.put('/notifications/read-all', markAllNotificationsRead);
router.put('/notifications/:id/read', markNotificationRead);
router.post('/me/avatar/upload-url', getAvatarUploadUrl);
router.put('/me/avatar', saveAvatar);

module.exports = router;
