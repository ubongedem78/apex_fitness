const { z } = require('zod');

const paymentQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional()
});

module.exports = { paymentQuerySchema };
