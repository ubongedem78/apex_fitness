const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getAll, getOne, createReview } = require('../controllers/trainerController');

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/:id/reviews', authenticate, createReview);

module.exports = router;
