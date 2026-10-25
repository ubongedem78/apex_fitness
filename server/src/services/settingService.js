const { AppSetting } = require('../models');

const err = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const DEFAULT_SETTINGS = {
  joining_fee:                       { value: '15100', description: 'One-time joining fee charged to new members (NGN)' },
  bank_name:                         { value: '',       description: 'Bank name for manual transfers' },
  bank_account_number:               { value: '',       description: 'Bank account number for manual transfers' },
  bank_account_name:                 { value: '',       description: 'Bank account name for manual transfers' },
  locker_monthly_price:              { value: '15000',  description: 'Monthly locker rental price (NGN)' },
  locker_quarterly_price:            { value: '30000',  description: 'Quarterly locker rental price (NGN)' },
  locker_setup_fee:                  { value: '25000',  description: 'One-time locker setup fee, first locker only (NGN)' },
  locker_paystack_monthly_plan_code: { value: '',       description: 'Paystack plan code for monthly locker subscription' },
  locker_paystack_quarterly_plan_code: { value: '',     description: 'Paystack plan code for quarterly locker subscription' },
  pt_monthly_rate:                   { value: '0',      description: 'Personal trainer monthly rate (NGN)' },
  receptionist_notification_email:   { value: '',       description: 'Email address to notify when a new PT request is submitted' },
};

const ensureDefaults = async () => {
  for (const [key, { value, description }] of Object.entries(DEFAULT_SETTINGS)) {
    await AppSetting.findOrCreate({
      where: { key },
      defaults: { value, description },
    });
  }
};

const getSetting = async (key) => {
  const setting = await AppSetting.findOne({ where: { key } });
  if (!setting) {
    if (DEFAULT_SETTINGS[key]) return DEFAULT_SETTINGS[key].value;
    throw err(`Setting '${key}' not found`, 404);
  }
  return setting.value;
};

const getJoiningFee = async () => {
  const value = await getSetting('joining_fee');
  return parseFloat(value);
};

const getAllSettings = async () => {
  await ensureDefaults();
  const settings = await AppSetting.findAll({ order: [['key', 'ASC']] });
  return { settings };
};

const updateSetting = async (key, value) => {
  if (value === undefined || value === null) throw err('value is required', 400);

  const [setting, created] = await AppSetting.findOrCreate({
    where: { key },
    defaults: {
      value: String(value),
      description: DEFAULT_SETTINGS[key]?.description || '',
    },
  });

  if (!created) {
    await setting.update({ value: String(value) });
  }

  return { setting };
};

module.exports = { getSetting, getJoiningFee, getAllSettings, updateSetting, ensureDefaults };
