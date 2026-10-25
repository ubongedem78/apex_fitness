const router = require('express').Router();
const { getAll, create, update, remove, validate } = require('../../controllers/admin/promotionController');

router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.post('/validate', validate);

module.exports = router;
