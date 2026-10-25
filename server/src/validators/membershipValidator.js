const { z } = require('zod');

const subscribeSchema = z.object({
  planId: z.string().or(z.number()),
  locationId: z.string().or(z.number()).optional(),
  promoCode: z.string().optional()
});

const verifyPaymentSchema = z.object({
  reference: z.string().min(1, 'reference is required')
});

const applyPromoSchema = z.object({
  code: z.string().min(1, 'code is required'),
  planId: z.string().or(z.number()).optional(),
  amount: z.number().or(z.string().transform(Number))
});

module.exports = { subscribeSchema, verifyPaymentSchema, applyPromoSchema };
