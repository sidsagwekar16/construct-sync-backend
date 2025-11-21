// Worker Sites Module Types

import { SiteStatus } from '../../../../types/enums';

/**
 * Worker-specific site response
 */
export interface WorkerSiteResponse {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: SiteStatus | null;
  jobCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Worker site job summary
 */
export interface WorkerSiteJobSummary {
  id: string;
  name: string;
  jobType: string | null;
  status: string | null;
  startDate: Date | null;
  endDate: Date | null;
}

/**
 * Query parameters for listing worker sites
 */
export interface ListWorkerSitesQuery {
  page?: number;
  limit?: number;
  status?: SiteStatus;
  search?: string;
}

