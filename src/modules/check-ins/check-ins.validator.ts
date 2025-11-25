// Check-ins module request validation

import { z } from 'zod';

/**
 * Schema for checking in
 */
export const checkInSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
});

/**
 * Schema for checking out
 */
export const checkOutSchema = z.object({
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

/**
 * Schema for listing check-in logs
 */
export const listCheckInLogsSchema = z.object({
  user_id: z.string().uuid('Invalid user ID').optional(),
  job_id: z.string().uuid('Invalid job ID').optional(),
  start_date: z.string().datetime('Invalid start date').optional(),
  end_date: z.string().datetime('Invalid end date').optional(),
  active_only: z.enum(['true', 'false']).optional(),
  page: z.string().regex(/^\d+$/, 'Page must be a positive integer').optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a positive integer').optional(),
});
