const router = require('express').Router();
const { getSetting } = require('../services/settingService');

router.get('/plans', async (req, res, next) => {
  try {
    const [monthly, quarterly, setupFee] = await Promise.all([
      getSetting('locker_monthly_price').catch(() => null),
      getSetting('locker_quarterly_price').catch(() => null),
      getSetting('locker_setup_fee').catch(() => null),
    ]);

    res.json({
      success: true,
      data: {
        monthly:   parseFloat(monthly)   || 0,
        quarterly: parseFloat(quarterly) || 0,
        setupFee:  parseFloat(setupFee)  || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
