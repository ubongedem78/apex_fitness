const { getAllSettings, updateSetting } = require('../services/settingService');

const getAll = async (req, res, next) => {
  try {
    const result = await getAllSettings();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const result = await updateSetting(key, value);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, update };
