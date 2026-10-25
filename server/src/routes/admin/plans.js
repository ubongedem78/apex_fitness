const router = require('express').Router();
const { getAll, create, update, deactivate, activate } = require('../../controllers/admin/planController');

router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);
router.put('/:id/deactivate', deactivate);
router.patch('/:id/activate', activate);
router.patch('/:id/deactivate', deactivate);

module.exports = router;
