const paymentService = require('../services/paymentService');

const getAll = async (req, res, next) => {
  try {
    const result = await paymentService.getAll(req.query, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const result = await paymentService.getOne(req.params.id, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const getAllForReceptionist = async (req, res, next) => {
  try {

    const result = await paymentService.getAllForReceptionist(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, getAllForReceptionist };
