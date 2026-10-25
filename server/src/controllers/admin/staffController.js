const staffService = require('../../services/admin/staffService');

const handle = (fn) => async (req, res, next) => {
  try {
    const result = await fn(req);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const getAll        = handle((req) => staffService.getAll(req.query));
const create        = handle((req) => staffService.create(req.body));
const update        = handle((req) => staffService.update(req.params.id, req.body, req.user.id));
const resetPassword = handle((req) => staffService.resetPassword(req.params.id, req.body));
const toggleActive  = handle((req) => staffService.toggleActive(req.params.id, req.user.id));

module.exports = { getAll, create, update, resetPassword, toggleActive };
