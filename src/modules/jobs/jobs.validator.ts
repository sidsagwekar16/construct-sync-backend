// Jobs module request validation

import { z } from 'zod';
import { JobStatus, PriorityLevel } from '../../types/enums';

/**
 * Schema for creating a job
 */
export const createJobSchema = z.object({
  name: z.string().min(1, 'Job name is required').max(255, 'Job name must be less than 255 characters'),
  description: z.string().max(5000, 'Description must be less than 5000 characters').optional().nullable(),
  jobNumber: z.string().max(100, 'Job number must be less than 100 characters').optional().nullable(),
  jobType: z.string().max(100, 'Job type must be less than 100 characters').optional().nullable(),
  siteId: z.string().uuid('Invalid site ID').optional().nullable(),
  status: z.nativeEnum(JobStatus).optional().nullable(),
  priority: z.nativeEnum(PriorityLevel).optional().nullable(),
  startDate: z.string().datetime('Invalid start date').optional().nullable(),
  endDate: z.string().datetime('Invalid end date').optional().nullable(),
  completedDate: z.string().datetime('Invalid completed date').optional().nullable(),
  assignedTo: z.string().uuid('Invalid assigned user ID').optional().nullable(),
  // Workers and managers are assigned separately after job creation
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
).refine(
  (data) => {
    if (data.completedDate && data.startDate) {
      return new Date(data.completedDate) >= new Date(data.startDate);
    }
    return true;
  },
  {
    message: 'Completed date must be on or after start date',
    path: ['completedDate'],
  }
);

/**
 * Schema for updating a job
 */
export const updateJobSchema = z.object({
  name: z.string().min(1, 'Job name is required').max(255, 'Job name must be less than 255 characters').optional(),
  description: z.string().max(5000, 'Description must be less than 5000 characters').optional().nullable(),
  jobNumber: z.string().max(100, 'Job number must be less than 100 characters').optional().nullable(),
  jobType: z.string().max(100, 'Job type must be less than 100 characters').optional().nullable(),
  siteId: z.string().uuid('Invalid site ID').optional().nullable(),
  status: z.nativeEnum(JobStatus).optional().nullable(),
  priority: z.nativeEnum(PriorityLevel).optional().nullable(),
  startDate: z.string().datetime('Invalid start date').optional().nullable(),
  endDate: z.string().datetime('Invalid end date').optional().nullable(),
  completedDate: z.string().datetime('Invalid completed date').optional().nullable(),
  assignedTo: z.string().uuid('Invalid assigned user ID').optional().nullable(),
  workerIds: z.array(z.string().uuid('Invalid worker ID')).optional().nullable(),
  managerIds: z.array(z.string().uuid('Invalid manager ID')).optional().nullable(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

/**
 * Schema for listing jobs query parameters
 */
export const listJobsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.nativeEnum(JobStatus).optional(),
  priority: z.nativeEnum(PriorityLevel).optional(),
  siteId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  jobType: z.string().optional(),
});

/**
 * Schema for assigning workers to a job
 */
export const assignWorkersSchema = z.object({
  workerIds: z.array(z.string().uuid('Invalid worker ID')).min(1, 'At least one worker ID is required'),
});

/**
 * Schema for assigning managers to a job
 */
export const assignManagersSchema = z.object({
  managerIds: z.array(z.string().uuid('Invalid manager ID')).min(1, 'At least one manager ID is required'),
});
