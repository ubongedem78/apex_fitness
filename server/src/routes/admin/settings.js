const router = require('express').Router();
const { getAll, update } = require('../../controllers/settingController');

router.get('/', getAll);
router.put('/:key', update);

module.exports = router;
