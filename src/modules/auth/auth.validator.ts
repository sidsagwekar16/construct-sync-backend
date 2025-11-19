// Auth validator

import { z } from 'zod';
import { UserRole } from '../../types/enums';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  companyName: z.string().min(1, 'Company name is required').max(255),
  companyEmail: z.string().email('Invalid company email').optional(),
  companyPhone: z.string().max(50).optional(),
  companyAddress: z.string().optional(),
});

export const errorReportSchema = z.object({
  errorMessage: z.string().min(1, 'Error message is required'),
  errorStack: z.string().optional(),
  userAgent: z.string().optional(),
  url: z.string().optional(),
  additionalInfo: z.record(z.any()).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ErrorReportInput = z.infer<typeof errorReportSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
