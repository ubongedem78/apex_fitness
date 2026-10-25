const userService = require('../services/userService');

const getMe = async (req, res, next) => {
  try {
    const result = await userService.getMe(req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getBookings = async (req, res, next) => {
  try {
    const result = await userService.getBookings(req.query, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getSubscriptions = async (req, res, next) => {
  try {
    const result = await userService.getSubscriptions(req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const result = await userService.getNotifications(req.query, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const result = await userService.markNotificationRead(req.params.id, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await userService.markAllNotificationsRead(req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getAvatarUploadUrl = async (req, res, next) => {
  try {
    const result = await userService.getAvatarUploadUrl(req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const saveAvatar = async (req, res, next) => {
  try {
    const result = await userService.saveAvatar(req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

module.exports = {
  getMe,
  getBookings,
  getSubscriptions,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getAvatarUploadUrl,
  saveAvatar,
};
