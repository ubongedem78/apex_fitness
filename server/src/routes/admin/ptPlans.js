const router = require('express').Router();
const { getAll, create, update, activate, deactivate, remove } = require('../../controllers/admin/ptPlanController');

router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/activate', activate);
router.patch('/:id/deactivate', deactivate);
router.delete('/:id', remove);

module.exports = router;
