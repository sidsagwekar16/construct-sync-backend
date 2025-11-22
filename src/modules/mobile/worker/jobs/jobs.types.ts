// Worker Jobs Module Types

import { JobStatus, PriorityLevel, TaskStatus } from '../../../../types/enums';

/**
 * Worker-specific job response with limited fields
 */
export interface WorkerJobResponse {
  id: string;
  name: string;
  description: string | null;
  jobType: string | null;
  status: JobStatus | null;
  priority: PriorityLevel | null;
  startDate: Date | null;
  endDate: Date | null;
  siteId: string | null;
  siteAddress: string | null;
  siteName: string | null;
  assignedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Worker job task response
 */
export interface WorkerJobTaskResponse {
  id: string;
  name: string;
  title: string | null;
  description: string | null;
  status: TaskStatus;
  priority: PriorityLevel | null;
  dueDate: Date | null;
  assignedTo: string | null;
  assignedToName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Query parameters for listing worker jobs
 */
export interface ListWorkerJobsQuery {
  page?: number;
  limit?: number;
  status?: JobStatus;
  siteId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Request body for updating task status
 */
export interface UpdateWorkerTaskRequest {
  status: TaskStatus;
  notes?: string;
}



