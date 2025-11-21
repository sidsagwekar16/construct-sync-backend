// Safety module request validation

import { z } from 'zod';
import { SafetyStatus, SeverityLevel } from '../../types/enums';

/**
 * Schema for creating a safety incident
 */
export const createSafetyIncidentSchema = z.object({
  jobId: z.string().uuid('Invalid job ID').optional().nullable(),
  siteId: z.string().uuid('Invalid site ID').optional().nullable(),
  incidentDate: z.string().datetime('Invalid incident date'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description must be less than 5000 characters'),
  severity: z.nativeEnum(SeverityLevel).optional().nullable(),
  status: z.nativeEnum(SafetyStatus).optional().nullable(),
}).refine(
  (data) => data.jobId || data.siteId,
  {
    message: 'Either jobId or siteId must be provided',
    path: ['jobId'],
  }
);

/**
 * Schema for updating a safety incident
 */
export const updateSafetyIncidentSchema = z.object({
  jobId: z.string().uuid('Invalid job ID').optional().nullable(),
  siteId: z.string().uuid('Invalid site ID').optional().nullable(),
  incidentDate: z.string().datetime('Invalid incident date').optional(),
  description: z.string().min(1, 'Description is required').max(5000, 'Description must be less than 5000 characters').optional(),
  severity: z.nativeEnum(SeverityLevel).optional().nullable(),
  status: z.nativeEnum(SafetyStatus).optional().nullable(),
});

/**
 * Schema for listing safety incidents query parameters
 */
export const listSafetyIncidentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.nativeEnum(SafetyStatus).optional(),
  severity: z.nativeEnum(SeverityLevel).optional(),
  jobId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
  reportedBy: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
