// Mobile Safety Types

import { SafetyStatus, SeverityLevel } from '../../../types/enums';

export interface MobileSafetyIncidentResponse {
  id: string;
  title: string;
  description: string;
  incidentDate: string;
  incidentType: string;
  severity: SeverityLevel;
  status: SafetyStatus;
  jobName: string | null;
  siteName: string | null;
  reportedBy: string | null;
}

export interface ListMobileSafetyIncidentsQuery {
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

export interface CreateMobileSafetyIncidentRequest {
  jobId?: string;
  siteId?: string;
  title?: string;
  description: string;
  incidentDate: string;
  incidentType?: string;
  severity: SeverityLevel;
  status?: SafetyStatus;
  location?: string;
  witnessNames?: string[];
  injuriesDescription?: string;
  propertyDamageDescription?: string;
  estimatedCost?: number;
  immediateActions?: string;
}

export interface UpdateMobileSafetyIncidentRequest {
  title?: string;
  description?: string;
  incidentDate?: string;
  incidentType?: string;
  severity?: SeverityLevel;
  status?: SafetyStatus;
  location?: string;
  witnessNames?: string[];
  injuriesDescription?: string;
  propertyDamageDescription?: string;
  estimatedCost?: number;
  immediateActions?: string;
  rootCause?: string;
  correctiveActions?: string[];
  investigationNotes?: string;
}

