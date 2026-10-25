const membershipService = require('../services/membershipService');

const getPlans = async (req, res, next) => {
  try {
    const result = await membershipService.getPlans();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getPlanById = async (req, res, next) => {
  try {
    const result = await membershipService.getPlanById(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const subscribe = async (req, res, next) => {
  try {
    const result = await membershipService.subscribe(req.body, req.user);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const result = await membershipService.verifyPayment(req.body, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const applyPromo = async (req, res, next) => {
  try {
    const result = await membershipService.applyPromo(req.body, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const cancelMembership = async (req, res, next) => {
  try {
    const result = await membershipService.cancelMembership(req.body, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const resumeMembership = async (req, res, next) => {
  try {
    const result = await membershipService.resumeMembership(req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const upgrade = async (req, res, next) => {
  try {
    const result = await membershipService.upgrade(req.body, req.user);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

module.exports = { getPlans, getPlanById, subscribe, verifyPayment, applyPromo, cancelMembership, resumeMembership, upgrade };
