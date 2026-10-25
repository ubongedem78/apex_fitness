const paymentLookupService = require('../services/paymentLookupService');
const paymentReportService = require('../services/paymentReportService');

const lookup = async (req, res, next) => {
  try {
    const result = await paymentLookupService.lookup(req.query.ref);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const report = async (req, res, next) => {
  try {
    const result = await paymentReportService.getPaymentsReport(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

module.exports = { lookup, report };
