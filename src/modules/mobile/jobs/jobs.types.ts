// Mobile Jobs Types

import { JobStatus, PriorityLevel } from '../../../types/enums';

export interface MobileJobResponse {
  id: string;
  name: string;
  description: string | null;
  jobType: string | null;
  status: JobStatus;
  priority: PriorityLevel;
  startDate: string | null;
  endDate: string | null;
  completedDate?: string | null;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  assignedToName: string | null;
  createdByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListMobileJobsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: JobStatus;
  priority?: PriorityLevel;
  siteId?: string;
  assignedTo?: string;
  jobType?: string;
}

export interface CreateMobileJobRequest {
  name: string;
  description?: string;
  jobNumber?: string;
  jobType?: string;
  siteId?: string;
  status?: JobStatus;
  priority?: PriorityLevel;
  startDate?: string;
  endDate?: string;
  assignedTo?: string;
  workerIds?: string[];
  managerIds?: string[];
}

export interface UpdateMobileJobRequest {
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

export interface MobileJobTaskResponse {
  id: string;
  title: string;
  description: string | null;
  status: string;
  type: string | null;
  dueDate: string | null;
  assigneeName: string | null;
}

export interface MobileJobWorkerResponse {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  hourlyRate: number;
}

