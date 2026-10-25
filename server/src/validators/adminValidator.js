const { z } = require('zod');

const createClassSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().optional(),
  locationId: z.string().or(z.number()),
  trainerId: z.string().or(z.number()),
  classType: z.string().min(1, 'classType is required'),
  date: z.string().min(1, 'date is required'),
  startTime: z.string().min(1, 'startTime is required'),
  endTime: z.string().min(1, 'endTime is required'),
  capacity: z.number().or(z.string().transform(Number)),
  isRecurring: z.boolean().optional().default(false),
  recurringPattern: z.any().optional()
});

const createPlanSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().optional(),
  price: z.number().or(z.string().transform(Number)),
  billingCycle: z.enum(['monthly', 'annual'], { errorMap: () => ({ message: 'billingCycle must be monthly or annual' }) }),
  features: z.any().optional(),
  classLimit: z.number().optional().nullable(),
  locationAccess: z.string().optional(),
  sortOrder: z.number().optional()
});

const createPromotionSchema = z.object({
  code: z.string().min(1, 'code is required'),
  name: z.string().min(1, 'name is required'),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed'], { errorMap: () => ({ message: 'discountType must be percentage or fixed' }) }),
  discountAmount: z.number().or(z.string().transform(Number)),
  minimumAmount: z.number().or(z.string().transform(Number)).optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  usageLimit: z.number().optional(),
  applicablePlans: z.array(z.any()).optional()
});

const createLocationSchema = z.object({
  name: z.string().min(1, 'name is required'),
  address: z.string().min(1, 'address is required'),
  city: z.string().min(1, 'city is required'),
  state: z.string().min(1, 'state is required'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  openingHours: z.any().optional(),
  amenities: z.any().optional(),
  capacity: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

const activateSubscriptionSchema = z.object({
  planId: z.string().or(z.number()),
  billingCycle: z.string().optional(),
  locationId: z.string().or(z.number()).optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  startDate: z.string().optional(),
  includeJoiningFee: z.boolean().optional()
});

const updateMemberSchema = z.object({
  firstName:             z.string().min(1).max(50).trim().optional(),
  lastName:              z.string().min(1).max(50).trim().optional(),
  phone:                 z.string().regex(/^\+\d{7,15}$/, 'Phone must be in international format').nullish(),
  isEmailVerified:       z.boolean().optional(),
  dateOfBirth:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').nullish(),
  gender:                z.enum(['male', 'female', 'other', 'prefer_not_to_say']).nullish(),
  emergencyContactName:  z.string().max(100).nullish(),
  emergencyContactPhone: z.string().regex(/^\+\d{7,15}$/, 'Phone must be in international format').nullish(),
  avatarUrl:             z.string().url('Invalid URL').max(500).nullish(),
}).strict();

module.exports = {
  createClassSchema,
  createPlanSchema,
  createPromotionSchema,
  createLocationSchema,
  activateSubscriptionSchema,
  updateMemberSchema
};
