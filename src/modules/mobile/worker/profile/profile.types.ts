// Worker Profile Module Types

import { UserRole } from '../../../../types/enums';

/**
 * Worker profile response
 */
export interface WorkerProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone: string | null;
  hourlyRate: number | null;
  companyId: string;
  companyName: string | null;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Update worker profile request
 */
export interface UpdateWorkerProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

/**
 * Worker statistics
 */
export interface WorkerProfileStatistics {
  totalJobsAssigned: number;
  completedJobs: number;
  activeJobs: number;
  safetyIncidentsReported: number;
  tasksCompleted: number;
}

