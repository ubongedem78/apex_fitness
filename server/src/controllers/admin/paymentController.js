const adminPaymentService = require('../../services/admin/paymentService');

const getAll = async (req, res, next) => {
  try {
    const result = await adminPaymentService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const result = await adminPaymentService.getOne(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const refund = async (req, res, next) => {
  try {
    const result = await adminPaymentService.refund(req.params.id, req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

module.exports = { getAll, getOne, refund };
