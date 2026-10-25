const lockerService = require('../services/lockerService');

const getMyLocker = async (req, res, next) => {
  try {
    const result = await lockerService.getMyLocker(req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const subscribe = async (req, res, next) => {
  try {
    const result = await lockerService.subscribe(req.body, req.user);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const cancelLocker = async (req, res, next) => {
  try {
    const result = await lockerService.cancelLocker(req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

module.exports = { getMyLocker, subscribe, cancelLocker };
