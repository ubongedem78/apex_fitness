const webhookService = require('../services/webhookService');

const handlePaystack = async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    await webhookService.handlePaystack(req.body, signature);
    return res.sendStatus(200);
  } catch (err) {
    if (err.statusCode === 400) return res.sendStatus(400);
    if (err.statusCode === 401) return res.sendStatus(401);
    console.error('[webhook] processing error:', err && err.message ? err.message : err);
    return res.sendStatus(500);
  }
};

module.exports = { handlePaystack };
