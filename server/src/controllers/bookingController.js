const bookingService = require('../services/bookingService');

const getAll = async (req, res, next) => {
  try {
    const result = await bookingService.getAll(req.query, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await bookingService.create(req.body, req.user);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const result = await bookingService.cancel(req.params.id, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

module.exports = { getAll, create, cancel };
