const { z } = require('zod');

const createBookingSchema = z.object({
  classId: z.string().or(z.number()).transform(String)
});

module.exports = { createBookingSchema };
