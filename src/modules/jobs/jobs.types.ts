// Jobs module types

import { JobStatus, PriorityLevel } from '../../types/enums';

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
  job_type: string | null;
  status: JobStatus | null;
  priority: PriorityLevel | null;
  start_date: Date | null;
  end_date: Date | null;
  completed_date: Date | null;
  assigned_to: string | null;
  created_by: string;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Worker assignment for a job
 */
export interface JobWorker {
  id: string;
  job_id: string;
  user_id: string;
  created_at: Date;
}

/**
 * Manager assignment for a job
 */
export interface JobManager {
  id: string;
  job_id: string;
  user_id: string;
  created_at: Date;
}

/**
 * Request body for creating a job
 */
export interface CreateJobRequest {
  name: string;
  description?: string;
  jobNumber?: string;
  jobType?: string;
  siteId?: string;
  status?: JobStatus;
  priority?: PriorityLevel;
  startDate?: string;
  endDate?: string;
  completedDate?: string;
  assignedTo?: string;
  // Workers and managers are assigned separately after job creation
}

/**
 * Request body for updating a job
 */
export interface UpdateJobRequest {
  name?: string;
  description?: string;
  jobNumber?: string;
  jobType?: string;
  siteId?: string;
  status?: JobStatus;
  priority?: PriorityLevel;
  startDate?: string;
  endDate?: string;
  completedDate?: string;
  assignedTo?: string;
  workerIds?: string[];
  managerIds?: string[];
}

/**
 * Response object for job with populated relationships
 */
export interface JobResponse {
  id: string;
  companyId: string;
  siteId: string | null;
  jobNumber: string | null;
  name: string;
  description: string | null;
  jobType: string | null;
  status: JobStatus | null;
  priority: PriorityLevel | null;
  startDate: Date | null;
  endDate: Date | null;
  completedDate: Date | null;
  assignedTo: string | null;
  assignedToUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdBy: string;
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  workers?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  managers?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  photos?: any[];
  documents?: any[];
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
  priority?: PriorityLevel;
  siteId?: string;
  assignedTo?: string;
  jobType?: string;
}
