// Jobs module types

import { JobStatus } from '../../types/enums';

/**
 * Database schema for jobs table
 */
export interface Job {
  id: string;
  company_id: string;
  site_id: string | null;
  job_number: string | null;
  name: string;
  description: string | null;
  status: JobStatus | null;
  start_date: Date | null;
  end_date: Date | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Request body for creating a job
 */
export interface CreateJobRequest {
  name: string;
  description?: string;
  jobNumber?: string;
  siteId?: string;
  status?: JobStatus;
  startDate?: string;
  endDate?: string;
}

/**
 * Request body for updating a job
 */
export interface UpdateJobRequest {
  name?: string;
  description?: string;
  jobNumber?: string;
  siteId?: string;
  status?: JobStatus;
  startDate?: string;
  endDate?: string;
}

/**
 * Response object for job
 */
export interface JobResponse {
  id: string;
  companyId: string;
  siteId: string | null;
  jobNumber: string | null;
  name: string;
  description: string | null;
  status: JobStatus | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Query parameters for listing jobs
 */
export interface ListJobsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: JobStatus;
  siteId?: string;
}
