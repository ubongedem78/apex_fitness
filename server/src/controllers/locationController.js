const locationService = require('../services/locationService');

const getAll = async (req, res, next) => {
  try {
    const result = await locationService.getAll();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const result = await locationService.getOne(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

module.exports = { getAll, getOne };
