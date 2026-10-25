const { z } = require('zod');

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().regex(/^\+\d{7,15}$/, 'Phone must be in international format (e.g. +2348012345678)').optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD').optional(),
  ptRequested: z.boolean().optional(),
  termsAcceptedAt: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must contain only digits'),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

const blankToUndef = (schema) => z.preprocess((v) => (v === '' ? undefined : v), schema);

const updateMeSchema = z.object({
  firstName:             z.string().min(1, 'First name cannot be empty').max(50).trim().optional(),
  lastName:              z.string().min(1, 'Last name cannot be empty').max(50).trim().optional(),
  phone:                 blankToUndef(z.string().regex(/^\+\d{7,15}$/, 'Phone must be in international format (e.g. +2348012345678)').nullish()),
  avatarUrl:             blankToUndef(z.string().url('Invalid URL').max(500).nullish()),
  dateOfBirth:           blankToUndef(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').nullish()),
  gender:                blankToUndef(z.enum(['male', 'female', 'other', 'prefer_not_to_say']).nullish()),
  emergencyContactName:  blankToUndef(z.string().max(100).nullish()),
  emergencyContactPhone: blankToUndef(z.string().regex(/^\+\d{7,15}$/, 'Phone must be in international format').nullish()),
  ptRequested:           z.boolean().optional(),
  termsAcceptedAt:       z.string().optional(),
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema, verifyOtpSchema, resetPasswordSchema, changePasswordSchema, updateMeSchema };
