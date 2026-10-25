const router = require('express').Router();
const { getAll } = require('../../controllers/admin/auditController');

router.get('/', getAll);

module.exports = router;
