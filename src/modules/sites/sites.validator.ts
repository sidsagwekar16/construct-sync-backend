// Sites validator

import { z } from 'zod';
import { SiteStatus } from '../../types/enums';

/**
 * Validation schema for creating a site
 */
export const createSiteSchema = z.object({
  name: z
    .string()
    .min(1, 'Site name is required')
    .max(255, 'Site name must be less than 255 characters')
    .trim(),
  address: z
    .string()
    .max(1000, 'Address must be less than 1000 characters')
    .optional(),
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),
  radius: z
    .number()
    .min(50, 'Radius must be at least 50 meters')
    .max(1000, 'Radius must not exceed 1000 meters')
    .optional()
    .nullable(),
  status: z.nativeEnum(SiteStatus).optional().default(SiteStatus.PLANNING),
  total_budget: z
    .number()
    .min(0, 'Budget cannot be negative')
    .optional()
    .default(0),
});

/**
 * Validation schema for updating a site
 */
export const updateSiteSchema = z.object({
  name: z
    .string()
    .min(1, 'Site name cannot be empty')
    .max(255, 'Site name must be less than 255 characters')
    .trim()
    .optional(),
  address: z
    .string()
    .max(1000, 'Address must be less than 1000 characters')
    .optional(),
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional()
    .nullable(),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional()
    .nullable(),
  radius: z
    .number()
    .min(50, 'Radius must be at least 50 meters')
    .max(1000, 'Radius must not exceed 1000 meters')
    .optional()
    .nullable(),
  status: z.nativeEnum(SiteStatus).optional(),
});

/**
 * Validation schema for query parameters
 */
export const listSitesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.nativeEnum(SiteStatus).optional(),
});

/**
 * Validation schema for site ID parameter
 */
export const siteIdSchema = z.object({
  id: z.string().uuid('Invalid site ID'),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
export type ListSitesQueryInput = z.infer<typeof listSitesQuerySchema>;
export type SiteIdInput = z.infer<typeof siteIdSchema>;
