const adminReportService = require('../../services/admin/reportService');

const getReport = async (req, res, next) => {
  try {
    const result = await adminReportService.getReport(req.query, req.user?.role);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getOverview = async (req, res, next) => {
  try {
    const result = await adminReportService.getOverview(req.user?.role);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getRevenue = async (req, res, next) => {
  try {
    const result = await adminReportService.getRevenue(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getMembers = async (req, res, next) => {
  try {
    const result = await adminReportService.getMembers();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getClasses = async (req, res, next) => {
  try {
    const result = await adminReportService.getClasses();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getBookings = async (req, res, next) => {
  try {
    const result = await adminReportService.getBookings();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getReport, getOverview, getRevenue, getMembers, getClasses, getBookings };
