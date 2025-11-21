// Safety module types

import { SafetyStatus, SeverityLevel } from '../../types/enums';

/**
 * Database schema for safety_incidents table
 */
export interface SafetyIncident {
  id: string;
  job_id: string | null;
  site_id: string | null;
  reported_by: string | null;
  incident_date: Date;
  description: string;
  severity: SeverityLevel | null;
  status: SafetyStatus | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Request body for creating a safety incident
 */
export interface CreateSafetyIncidentRequest {
  jobId?: string;
  siteId?: string;
  incidentDate: string;
  description: string;
  severity?: SeverityLevel;
  status?: SafetyStatus;
}

/**
 * Request body for updating a safety incident
 */
export interface UpdateSafetyIncidentRequest {
  jobId?: string | null;
  siteId?: string | null;
  incidentDate?: string;
  description?: string;
  severity?: SeverityLevel | null;
  status?: SafetyStatus | null;
}

/**
 * Response object for safety incident with populated relationships
 */
export interface SafetyIncidentResponse {
  id: string;
  jobId: string | null;
  siteId: string | null;
  reportedBy: string | null;
  reportedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  job?: {
    id: string;
    name: string;
    jobNumber: string | null;
  } | null;
  site?: {
    id: string;
    name: string;
    address: string | null;
  } | null;
  incidentDate: Date;
  description: string;
  severity: SeverityLevel | null;
  status: SafetyStatus | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Query parameters for listing safety incidents
 */
export interface ListSafetyIncidentsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: SafetyStatus;
  severity?: SeverityLevel;
  jobId?: string;
  siteId?: string;
  reportedBy?: string;
  startDate?: string;
  endDate?: string;
}
