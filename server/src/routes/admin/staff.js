const router = require('express').Router();
const { getAll, create, update, resetPassword, toggleActive } = require('../../controllers/admin/staffController');

router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/reset-password', resetPassword);
router.patch('/:id/toggle-active', toggleActive);

module.exports = router;
