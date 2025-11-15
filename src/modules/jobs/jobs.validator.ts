// Jobs validator

import { z } from 'zod';
import { JobStatus } from '../../types/enums';

/**
 * Validation schema for creating a job
 */
export const createJobSchema = z.object({
  name: z
    .string()
    .min(1, 'Job name is required')
    .max(255, 'Job name must be less than 255 characters')
    .trim(),
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),
  jobNumber: z
    .string()
    .max(100, 'Job number must be less than 100 characters')
    .optional(),
  siteId: z.string().uuid('Invalid site ID').optional(),
  status: z.nativeEnum(JobStatus).optional().default(JobStatus.DRAFT),
  startDate: z.string().datetime().or(z.string().date()).optional(),
  endDate: z.string().datetime().or(z.string().date()).optional(),
});

/**
 * Validation schema for updating a job
 */
export const updateJobSchema = z.object({
  name: z
    .string()
    .min(1, 'Job name cannot be empty')
    .max(255, 'Job name must be less than 255 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional()
    .nullable(),
  jobNumber: z
    .string()
    .max(100, 'Job number must be less than 100 characters')
    .optional()
    .nullable(),
  siteId: z.string().uuid('Invalid site ID').optional().nullable(),
  status: z.nativeEnum(JobStatus).optional(),
  startDate: z.string().datetime().or(z.string().date()).optional().nullable(),
  endDate: z.string().datetime().or(z.string().date()).optional().nullable(),
});

/**
 * Validation schema for query parameters
 */
export const listJobsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.nativeEnum(JobStatus).optional(),
  siteId: z.string().uuid('Invalid site ID').optional(),
});

/**
 * Validation schema for job ID parameter
 */
export const jobIdSchema = z.object({
  id: z.string().uuid('Invalid job ID'),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type ListJobsQueryInput = z.infer<typeof listJobsQuerySchema>;
export type JobIdInput = z.infer<typeof jobIdSchema>;
