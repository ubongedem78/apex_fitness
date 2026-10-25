const router = require('express').Router();
const { getAll, getOne, create, update, activate, deactivate } = require('../../controllers/admin/locationController');

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/activate', activate);
router.patch('/:id/deactivate', deactivate);

module.exports = router;
