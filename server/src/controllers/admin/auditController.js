const adminAuditService = require('../../services/admin/auditService');

const getAll = async (req, res, next) => {
  try {
    const result = await adminAuditService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll };
