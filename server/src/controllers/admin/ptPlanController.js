const ptPlanService = require('../../services/admin/ptPlanService');

const handle = (fn) => async (req, res, next) => {
  try {
    const result = await fn(req, res);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const getAll    = handle((req) => ptPlanService.getAll());
const create    = handle((req) => ptPlanService.create(req.body));
const update    = handle((req) => ptPlanService.update(req.params.id, req.body));
const activate  = handle((req) => ptPlanService.activate(req.params.id));
const deactivate = handle((req) => ptPlanService.deactivate(req.params.id));
const remove     = handle((req) => ptPlanService.remove(req.params.id));

module.exports = { getAll, create, update, activate, deactivate, remove };
