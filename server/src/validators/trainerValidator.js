const { z } = require('zod');

const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  isPublic: z.boolean().optional().default(true)
});

module.exports = { createReviewSchema };
