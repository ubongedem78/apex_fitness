const adminClassService = require('../../services/admin/classService');

const getAll = async (req, res, next) => {
  try {
    const result = await adminClassService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await adminClassService.create(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message, fields: err.fields || undefined });
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await adminClassService.update(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message, fields: err.fields || undefined });
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await adminClassService.remove(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const cancellationReason = req.body.reason || req.body.cancellationReason || null;
    const result = await adminClassService.cancel(req.params.id, cancellationReason);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const reactivate = async (req, res, next) => {
  try {
    const result = await adminClassService.reactivate(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const getBookings = async (req, res, next) => {
  try {
    const result = await adminClassService.getBookings(req.params.id, req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getWaitlist = async (req, res, next) => {
  try {
    const result = await adminClassService.getWaitlist(req.params.id, req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, update, remove, cancel, reactivate, getBookings, getWaitlist };
