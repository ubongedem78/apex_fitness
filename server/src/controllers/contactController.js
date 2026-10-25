const contactService = require('../services/contactService');

const submit = async (req, res, next) => {
  try {
    const result = await contactService.submit(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

module.exports = { submit };
