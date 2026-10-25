const trainerService = require('../services/trainerService');

const getAll = async (req, res, next) => {
  try {
    const result = await trainerService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const result = await trainerService.getOne(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const createReview = async (req, res, next) => {
  try {
    const result = await trainerService.createReview(req.params.id, req.body, req.user);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

module.exports = { getAll, getOne, createReview };
