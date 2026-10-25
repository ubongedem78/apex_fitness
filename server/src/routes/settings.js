const router = require('express').Router();
const { AppSetting } = require('../models');

const PUBLIC_KEYS = [
  'joining_fee',
  'bank_name',
  'bank_account_number',
  'bank_account_name',
  'locker_monthly_price',
  'locker_quarterly_price',
  'locker_setup_fee',
];

router.get('/', async (req, res, next) => {
  try {
    const settings = await AppSetting.findAll({
      where: { key: PUBLIC_KEYS },
      attributes: ['key', 'value'],
    });
    res.json({ success: true, data: { settings } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
