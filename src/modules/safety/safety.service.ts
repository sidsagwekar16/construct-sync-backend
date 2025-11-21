// Safety service - Business logic

import { SafetyRepository } from './safety.repository';
import {
  CreateSafetyIncidentRequest,
  UpdateSafetyIncidentRequest,
  SafetyIncidentResponse,
  ListSafetyIncidentsQuery,
  SafetyIncident,
} from './safety.types';
import { SafetyStatus } from '../../types/enums';
import {
  NotFoundError,
  BadRequestError,
} from '../../types/errors';
import { logger } from '../../utils/logger';

export class SafetyService {
  private repository: SafetyRepository;

  constructor() {
    this.repository = new SafetyRepository();
  }

  /**
   * List all safety incidents for a company with pagination and search
   */
  async listIncidents(
    companyId: string,
    query: ListSafetyIncidentsQuery
  ): Promise<{ incidents: SafetyIncidentResponse[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    const { incidents, total } = await this.repository.findIncidentsByCompany(
      companyId,
      query.search,
      query.status,
      query.severity,
      query.jobId,
      query.siteId,
      query.reportedBy,
      startDate,
      endDate,
      limit,
      offset
    );

    // Populate relationships for all incidents
    const incidentResponses = await Promise.all(
      incidents.map(incident => this.mapIncidentToResponseWithRelations(incident))
    );

    return {
      incidents: incidentResponses,
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single safety incident by ID
   */
  async getIncidentById(
    incidentId: string,
    companyId: string
  ): Promise<SafetyIncidentResponse> {
    const incident = await this.repository.findIncidentById(incidentId, companyId);
    if (!incident) {
      throw new NotFoundError('Safety incident not found');
    }

    return await this.mapIncidentToResponseWithRelations(incident);
  }

  /**
   * Create a new safety incident
   */
  async createIncident(
    companyId: string,
    reportedBy: string,
    data: CreateSafetyIncidentRequest
  ): Promise<SafetyIncidentResponse> {
    // Validate job if provided
    if (data.jobId) {
      const jobExists = await this.repository.verifyJobCompany(data.jobId, companyId);
      if (!jobExists) {
        throw new BadRequestError('Job does not exist or does not belong to your company');
      }
    }

    // Validate site if provided
    if (data.siteId) {
      const siteExists = await this.repository.verifySiteCompany(data.siteId, companyId);
      if (!siteExists) {
        throw new BadRequestError('Site does not exist or does not belong to your company');
      }
    }

    // Ensure at least one of job or site is provided
    if (!data.jobId && !data.siteId) {
      throw new BadRequestError('Either jobId or siteId must be provided');
    }

    const incidentDate = new Date(data.incidentDate);

    const incident = await this.repository.createIncident(
      reportedBy,
      incidentDate,
      data.description,
      data.jobId,
      data.siteId,
      data.severity,
      data.status
    );

    logger.info(`Safety incident created: ${incident.id} by user ${reportedBy}`);

    return await this.mapIncidentToResponseWithRelations(incident);
  }

  /**
   * Update a safety incident
   */
  async updateIncident(
    incidentId: string,
    companyId: string,
    data: UpdateSafetyIncidentRequest
  ): Promise<SafetyIncidentResponse> {
    // Check if incident exists
    const existingIncident = await this.repository.findIncidentById(incidentId, companyId);
    if (!existingIncident) {
      throw new NotFoundError('Safety incident not found');
    }

    // Validate job if provided
    if (data.jobId) {
      const jobExists = await this.repository.verifyJobCompany(data.jobId, companyId);
      if (!jobExists) {
        throw new BadRequestError('Job does not exist or does not belong to your company');
      }
    }

    // Validate site if provided
    if (data.siteId) {
      const siteExists = await this.repository.verifySiteCompany(data.siteId, companyId);
      if (!siteExists) {
        throw new BadRequestError('Site does not exist or does not belong to your company');
      }
    }

    const updateData: any = {};

    if (data.jobId !== undefined) {
      updateData.jobId = data.jobId;
    }

    if (data.siteId !== undefined) {
      updateData.siteId = data.siteId;
    }

    if (data.incidentDate) {
      updateData.incidentDate = new Date(data.incidentDate);
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.severity !== undefined) {
      updateData.severity = data.severity;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    const updatedIncident = await this.repository.updateIncident(
      incidentId,
      companyId,
      updateData
    );

    if (!updatedIncident) {
      throw new NotFoundError('Safety incident not found');
    }

    logger.info(`Safety incident updated: ${incidentId}`);

    return await this.mapIncidentToResponseWithRelations(updatedIncident);
  }

  /**
   * Delete a safety incident (soft delete)
   */
  async deleteIncident(incidentId: string, companyId: string): Promise<void> {
    const deleted = await this.repository.deleteIncident(incidentId, companyId);
    if (!deleted) {
      throw new NotFoundError('Safety incident not found');
    }

    logger.info(`Safety incident deleted: ${incidentId}`);
  }

  /**
   * Get statistics about safety incidents for a company
   */
  async getIncidentStatistics(companyId: string): Promise<{
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
    total: number;
  }> {
    const [statusCounts, severityCounts] = await Promise.all([
      this.repository.countIncidentsByStatus(companyId),
      this.repository.countIncidentsBySeverity(companyId),
    ]);

    const byStatus: Record<string, number> = {};
    statusCounts.forEach((count, status) => {
      byStatus[status] = count;
    });

    const bySeverity: Record<string, number> = {};
    severityCounts.forEach((count, severity) => {
      bySeverity[severity] = count;
    });

    const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);

    return {
      byStatus,
      bySeverity,
      total,
    };
  }

  /**
   * Map a safety incident to a response with populated relationships
   */
  private async mapIncidentToResponseWithRelations(
    incident: SafetyIncident
  ): Promise<SafetyIncidentResponse> {
    const response: SafetyIncidentResponse = {
      id: incident.id,
      jobId: incident.job_id,
      siteId: incident.site_id,
      reportedBy: incident.reported_by,
      incidentDate: incident.incident_date,
      description: incident.description,
      severity: incident.severity,
      status: incident.status,
      createdAt: incident.created_at,
      updatedAt: incident.updated_at,
    };

    // Populate reported by user
    if (incident.reported_by) {
      const user = await this.repository.getUserDetails(incident.reported_by);
      response.reportedByUser = user || undefined;
    }

    // Populate job details
    if (incident.job_id) {
      const job = await this.repository.getJobDetails(incident.job_id);
      response.job = job || undefined;
    }

    // Populate site details
    if (incident.site_id) {
      const site = await this.repository.getSiteDetails(incident.site_id);
      response.site = site || undefined;
    }

    return response;
  }
}
