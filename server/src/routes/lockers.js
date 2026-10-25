const router = require('express').Router();
const { getMyLocker, subscribe, cancelLocker } = require('../controllers/lockerController');

router.get('/my', getMyLocker);
router.post('/subscribe', subscribe);
router.delete('/cancel', cancelLocker);

module.exports = router;
