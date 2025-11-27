// Users validator

import { z } from 'zod';
import { UserRole } from '../../types/enums';

export const createWorkerSchema = z.object({
  email: z.string().email('Invalid email address'),
  // Password is optional – if omitted, a strong random password will be generated server-side
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .optional(),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  role: z.nativeEnum(UserRole).optional(),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive').optional(),
});

export const updateWorkerSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1).max(100).optional().nullable(),
  lastName: z.string().min(1).max(100).optional().nullable(),
  role: z.nativeEnum(UserRole).optional(),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive').optional().nullable(),
  isActive: z.boolean().optional(),
});

export const listWorkersQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.string().transform((val) => val === 'true').optional(),
});

export type CreateWorkerInput = z.infer<typeof createWorkerSchema>;
export type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>;
export type ListWorkersQueryInput = z.infer<typeof listWorkersQuerySchema>;
