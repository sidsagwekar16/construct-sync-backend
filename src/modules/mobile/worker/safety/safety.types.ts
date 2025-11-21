// Worker Safety Module Types

import { SeverityLevel, SafetyStatus } from '../../../../types/enums';

/**
 * Worker safety incident response
 */
export interface WorkerSafetyIncidentResponse {
  id: string;
  jobId: string | null;
  jobName: string | null;
  siteId: string | null;
  siteName: string | null;
  siteAddress: string | null;
  incidentDate: Date;
  description: string;
  severity: SeverityLevel | null;
  status: SafetyStatus | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create safety incident request for worker
 */
export interface CreateWorkerSafetyIncidentRequest {
  jobId: string;
  incidentDate: string;
  description: string;
  severity?: SeverityLevel;
  location?: string;
}

/**
 * Worker safety statistics
 */
export interface WorkerSafetyStatistics {
  totalIncidents: number;
  bySeverity: {
    [key in SeverityLevel]?: number;
  };
  byStatus: {
    [key in SafetyStatus]?: number;
  };
}

/**
 * Query parameters for listing worker safety incidents
 */
export interface ListWorkerSafetyIncidentsQuery {
  page?: number;
  limit?: number;
  severity?: SeverityLevel;
  status?: SafetyStatus;
  jobId?: string;
  startDate?: string;
  endDate?: string;
}

