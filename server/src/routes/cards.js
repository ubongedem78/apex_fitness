const router = require('express').Router();
const { initialize, verify, manageLink } = require('../controllers/cardController');

router.post('/initialize', initialize);
router.post('/verify', verify);
router.get('/manage-link', manageLink);

module.exports = router;
