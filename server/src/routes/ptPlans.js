const router = require('express').Router();
const { getActive } = require('../services/admin/ptPlanService');

router.get('/', async (req, res, next) => {
  try {
    const result = await getActive();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
