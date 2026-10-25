const classService = require('../services/classService');

const getAll = async (req, res, next) => {
  try {
    const result = await classService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const result = await classService.getOne(req.params.id, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const bookClass = async (req, res, next) => {
  try {
    const result = await classService.bookClass(req.params.id, req.user);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const result = await classService.cancelBooking(req.params.id, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const joinWaitlist = async (req, res, next) => {
  try {
    const result = await classService.joinWaitlist(req.params.id, req.user);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const leaveWaitlist = async (req, res, next) => {
  try {
    const result = await classService.leaveWaitlist(req.params.id, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const getReviews = async (req, res, next) => {
  try {
    const result = await classService.getReviews(req.params.id, req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const createReview = async (req, res, next) => {
  try {
    const result = await classService.createReview(req.params.id, req.body, req.user);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

module.exports = { getAll, getOne, bookClass, cancelBooking, joinWaitlist, leaveWaitlist, getReviews, createReview };
