const adminMemberService = require('../../services/admin/memberService');

const getAll = async (req, res, next) => {
  try {
    const result = await adminMemberService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const result = await adminMemberService.getOne(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await adminMemberService.update(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const suspend = async (req, res, next) => {
  try {
    const result = await adminMemberService.suspend(req.params.id, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const reactivate = async (req, res, next) => {
  try {
    const result = await adminMemberService.reactivate(req.params.id, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const getBookings = async (req, res, next) => {
  try {
    const result = await adminMemberService.getBookings(req.params.id, req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getPayments = async (req, res, next) => {
  try {
    const result = await adminMemberService.getPayments(req.params.id, req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const activateSubscription = async (req, res, next) => {
  try {
    const result = await adminMemberService.activateSubscription(req.params.id, req.body, req.user);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const getSubscription = async (req, res, next) => {
  try {
    const result = await adminMemberService.getSubscription(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, update, suspend, reactivate, getBookings, getPayments, activateSubscription, getSubscription };
