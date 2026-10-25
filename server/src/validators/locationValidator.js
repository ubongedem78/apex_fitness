const { z } = require('zod');

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

module.exports = { createLocationSchema };
