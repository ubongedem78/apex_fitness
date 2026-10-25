const adminPlanService = require('../../services/admin/planService');

const getAll = async (req, res, next) => {
  try {
    const result = await adminPlanService.getAll();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await adminPlanService.create(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await adminPlanService.update(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const deactivate = async (req, res, next) => {
  try {
    const result = await adminPlanService.deactivate(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const activate = async (req, res, next) => {
  try {
    const result = await adminPlanService.activate(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

module.exports = { getAll, create, update, deactivate, activate };
