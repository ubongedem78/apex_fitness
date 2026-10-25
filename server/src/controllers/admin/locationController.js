const adminLocationService = require('../../services/admin/locationService');

const getAll = async (req, res, next) => {
  try {
    const result = await adminLocationService.getAll();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const result = await adminLocationService.getOne(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await adminLocationService.create(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await adminLocationService.update(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const activate = async (req, res, next) => {
  try {
    const result = await adminLocationService.activate(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const deactivate = async (req, res, next) => {
  try {
    const result = await adminLocationService.deactivate(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, activate, deactivate };
