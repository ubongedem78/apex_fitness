const adminTrainerService = require('../../services/admin/trainerService');

const getAll = async (req, res, next) => {
  try {
    const result = await adminTrainerService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await adminTrainerService.create(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message, fields: err.fields || undefined });
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await adminTrainerService.update(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const deactivate = async (req, res, next) => {
  try {
    const result = await adminTrainerService.deactivate(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const activate = async (req, res, next) => {
  try {
    const result = await adminTrainerService.activate(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await adminTrainerService.remove(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

module.exports = { getAll, create, update, deactivate, activate, remove };
