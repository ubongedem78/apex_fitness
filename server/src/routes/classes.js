const router = require("express").Router();
const { authenticate, optionalAuth } = require("../middleware/auth");
const {
  getAll,
  getOne,
  bookClass,
  cancelBooking,
  joinWaitlist,
  leaveWaitlist,
  getReviews,
  createReview,
} = require("../controllers/classController");

router.get("/", optionalAuth, getAll);
router.get("/:id", optionalAuth, getOne);
router.post("/:id/book", authenticate, bookClass);
router.delete("/:id/book", authenticate, cancelBooking);
router.post("/:id/waitlist", authenticate, joinWaitlist);
router.delete("/:id/waitlist", authenticate, leaveWaitlist);
router.get("/:id/reviews", getReviews);
router.post("/:id/reviews", authenticate, createReview);

module.exports = router;
