// Worker Safety Service

import { NotFoundError, BadRequestError } from '../../../../types/errors';
import { logger } from '../../../../utils/logger';
import { db } from '../../../../db/connection';
import { SeverityLevel, SafetyStatus } from '../../../../types/enums';
import {
  WorkerSafetyIncidentResponse,
  CreateWorkerSafetyIncidentRequest,
  WorkerSafetyStatistics,
  ListWorkerSafetyIncidentsQuery,
} from './safety.types';

export class WorkerSafetyService {
  /**
   * List safety incidents reported by worker
   */
  async listWorkerIncidents(
    workerId: string,
    companyId: string,
    query: ListWorkerSafetyIncidentsQuery
  ): Promise<{ data: WorkerSafetyIncidentResponse[]; total: number; page: number; pageSize: number; hasMore: boolean }> {
    const page = query.page || 1;
    const pageSize = query.limit || 20;
    const offset = (page - 1) * pageSize;

    let whereConditions = ['si.reported_by = $1', 'si.deleted_at IS NULL'];
    const params: any[] = [workerId];
    let paramIndex = 2;

    if (query.severity) {
      whereConditions.push(`si.severity = $${paramIndex}`);
      params.push(query.severity);
      paramIndex++;
    }

    if (query.status) {
      whereConditions.push(`si.status = $${paramIndex}`);
      params.push(query.status);
      paramIndex++;
    }

    if (query.jobId) {
      whereConditions.push(`si.job_id = $${paramIndex}`);
      params.push(query.jobId);
      paramIndex++;
    }

    if (query.startDate) {
      whereConditions.push(`si.incident_date >= $${paramIndex}`);
      params.push(query.startDate);
      paramIndex++;
    }

    if (query.endDate) {
      whereConditions.push(`si.incident_date <= $${paramIndex}`);
      params.push(query.endDate);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM safety_incidents si
      WHERE ${whereClause}
    `;
    const countResult = await db.query<{ count: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    // Get incidents
    const incidentsQuery = `
      SELECT
        si.id,
        si.job_id,
        si.site_id,
        si.incident_date,
        si.description,
        si.severity,
        si.status,
        si.created_at,
        si.updated_at,
        j.name as job_name,
        s.name as site_name,
        s.address as site_address
      FROM safety_incidents si
      LEFT JOIN jobs j ON j.id = si.job_id
      LEFT JOIN sites s ON s.id = si.site_id
      WHERE ${whereClause}
      ORDER BY si.incident_date DESC, si.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(pageSize, offset);

    const result = await db.query(incidentsQuery, params);

    const incidents: WorkerSafetyIncidentResponse[] = result.rows.map(row => ({
      id: row.id,
      jobId: row.job_id,
      jobName: row.job_name,
      siteId: row.site_id,
      siteName: row.site_name,
      siteAddress: row.site_address,
      incidentDate: row.incident_date,
      description: row.description,
      severity: row.severity,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return {
      data: incidents,
      total,
      page,
      pageSize,
      hasMore: offset + incidents.length < total,
    };
  }

  /**
   * Get incident details (only if reported by worker)
   */
  async getWorkerIncidentById(
    incidentId: string,
    workerId: string
  ): Promise<WorkerSafetyIncidentResponse> {
    const query = `
      SELECT
        si.id,
        si.job_id,
        si.site_id,
        si.incident_date,
        si.description,
        si.severity,
        si.status,
        si.created_at,
        si.updated_at,
        j.name as job_name,
        s.name as site_name,
        s.address as site_address
      FROM safety_incidents si
      LEFT JOIN jobs j ON j.id = si.job_id
      LEFT JOIN sites s ON s.id = si.site_id
      WHERE si.id = $1
        AND si.reported_by = $2
        AND si.deleted_at IS NULL
    `;

    const result = await db.query(query, [incidentId, workerId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Safety incident not found or you did not report it');
    }

    const row = result.rows[0];

    return {
      id: row.id,
      jobId: row.job_id,
      jobName: row.job_name,
      siteId: row.site_id,
      siteName: row.site_name,
      siteAddress: row.site_address,
      incidentDate: row.incident_date,
      description: row.description,
      severity: row.severity,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Create new safety incident
   */
  async createIncident(
    workerId: string,
    companyId: string,
    data: CreateWorkerSafetyIncidentRequest
  ): Promise<WorkerSafetyIncidentResponse> {
    // Verify worker is assigned to the job
    const jobQuery = `
      SELECT j.id, j.site_id FROM jobs j
      INNER JOIN job_workers jw ON jw.job_id = j.id
      WHERE j.id = $1 AND jw.user_id = $2 AND j.company_id = $3 AND j.deleted_at IS NULL
    `;
    const jobResult = await db.query(jobQuery, [data.jobId, workerId, companyId]);

    if (jobResult.rows.length === 0) {
      throw new BadRequestError('You are not assigned to this job or job not found');
    }

    const job = jobResult.rows[0];

    // Create incident
    const insertQuery = `
      INSERT INTO safety_incidents (
        job_id,
        site_id,
        reported_by,
        incident_date,
        description,
        severity,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const incidentDate = new Date(data.incidentDate);
    const severity = data.severity || SeverityLevel.MINOR;
    const status = SafetyStatus.OPEN;

    const result = await db.query(insertQuery, [
      data.jobId,
      job.site_id,
      workerId,
      incidentDate,
      data.description,
      severity,
      status,
    ]);

    const incident = result.rows[0];

    // Get related job and site info
    const detailsQuery = `
      SELECT
        j.name as job_name,
        s.name as site_name,
        s.address as site_address
      FROM jobs j
      LEFT JOIN sites s ON s.id = j.site_id
      WHERE j.id = $1
    `;
    const detailsResult = await db.query(detailsQuery, [data.jobId]);
    const details = detailsResult.rows[0] || {};

    logger.info(`Safety incident ${incident.id} created by worker ${workerId}`);

    return {
      id: incident.id,
      jobId: incident.job_id,
      jobName: details.job_name,
      siteId: incident.site_id,
      siteName: details.site_name,
      siteAddress: details.site_address,
      incidentDate: incident.incident_date,
      description: incident.description,
      severity: incident.severity,
      status: incident.status,
      createdAt: incident.created_at,
      updatedAt: incident.updated_at,
    };
  }

  /**
   * Get worker's safety statistics
   */
  async getWorkerStatistics(workerId: string): Promise<WorkerSafetyStatistics> {
    const query = `
      SELECT
        COUNT(*) as total,
        severity,
        status
      FROM safety_incidents
      WHERE reported_by = $1 AND deleted_at IS NULL
      GROUP BY severity, status
    `;

    const result = await db.query(query, [workerId]);

    const stats: WorkerSafetyStatistics = {
      totalIncidents: 0,
      bySeverity: {},
      byStatus: {},
    };

    result.rows.forEach(row => {
      const count = parseInt(row.total, 10);
      stats.totalIncidents += count;

      if (row.severity) {
        stats.bySeverity[row.severity as SeverityLevel] =
          (stats.bySeverity[row.severity as SeverityLevel] || 0) + count;
      }

      if (row.status) {
        stats.byStatus[row.status as SafetyStatus] =
          (stats.byStatus[row.status as SafetyStatus] || 0) + count;
      }
    });

    return stats;
  }
}

