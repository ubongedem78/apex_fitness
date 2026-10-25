const router = require('express').Router();
const { createPTRequest, getMyPTRequests, cancelPTRequest } = require('../controllers/ptRequestController');

router.post('/', createPTRequest);
router.get('/my', getMyPTRequests);
router.delete('/:id', cancelPTRequest);

module.exports = router;
