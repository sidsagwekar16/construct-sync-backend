// Sites module types

import { SiteStatus } from '../../types/enums';

/**
 * Database schema for sites table
 */
export interface Site {
  id: string;
  company_id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: SiteStatus | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Request body for creating a site
 */
export interface CreateSiteRequest {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status?: SiteStatus;
}

/**
 * Request body for updating a site
 */
export interface UpdateSiteRequest {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status?: SiteStatus;
}

/**
 * Response object for site
 */
export interface SiteResponse {
  id: string;
  companyId: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: SiteStatus | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Query parameters for listing sites
 */
export interface ListSitesQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: SiteStatus;
}
