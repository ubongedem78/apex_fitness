const router = require('express').Router();
const { handlePaystack } = require('../controllers/webhookController');

router.post('/paystack', handlePaystack);

module.exports = router;
