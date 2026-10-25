const { initializeCardCapture, verifyCardCapture, getCardManageLink } = require('../services/cardService');

const initialize = async (req, res, next) => {
  try {
    const result = await initializeCardCapture(req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const verify = async (req, res, next) => {
  try {
    const result = await verifyCardCapture(req.body, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const manageLink = async (req, res, next) => {
  try {
    const result = await getCardManageLink(req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { initialize, verify, manageLink };
