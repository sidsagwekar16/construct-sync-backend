// Mobile Safety Service

import { db } from '../../../db/connection';
import { logger } from '../../../utils/logger';
import { NotFoundError } from '../../../types/errors';

interface ListIncidentsQuery {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  jobId?: string;
  siteId?: string;
  startDate?: string;
  endDate?: string;
}

export class MobileSafetyService {
  /**
   * List safety incidents with filters
   */
  async listIncidents(companyId: string, query: ListIncidentsQuery): Promise<any> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const offset = (page - 1) * limit;

      let whereConditions = ['j.company_id = $1', 'si.deleted_at IS NULL'];
      const params: any[] = [companyId];
      let paramIndex = 2;

      if (query.status) {
        whereConditions.push(`si.status = $${paramIndex}`);
        params.push(query.status);
        paramIndex++;
      }

      if (query.severity) {
        whereConditions.push(`si.severity = $${paramIndex}`);
        params.push(query.severity);
        paramIndex++;
      }

      if (query.jobId) {
        whereConditions.push(`si.job_id = $${paramIndex}`);
        params.push(query.jobId);
        paramIndex++;
      }

      if (query.siteId) {
        whereConditions.push(`si.site_id = $${paramIndex}`);
        params.push(query.siteId);
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
      const countResult = await db.query(
        `SELECT COUNT(*) as count 
         FROM safety_incidents si
         JOIN jobs j ON si.job_id = j.id
         WHERE ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get incidents with relationships
      const result = await db.query(
        `SELECT 
          si.id,
          si.job_id,
          si.site_id,
          si.incident_date,
          si.description,
          si.severity,
          si.status,
          si.reported_by,
          si.created_at,
          si.updated_at,
          j.name as job_name,
          s.name as site_name,
          s.address as site_address,
          u.first_name || ' ' || u.last_name as reported_by_name
         FROM safety_incidents si
         JOIN jobs j ON si.job_id = j.id
         LEFT JOIN sites s ON si.site_id = s.id
         LEFT JOIN users u ON si.reported_by = u.id
         WHERE ${whereClause}
         ORDER BY si.incident_date DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      const incidents = result.rows.map(row => ({
        id: row.id,
        jobId: row.job_id,
        siteId: row.site_id,
        title: row.description ? row.description.substring(0, 50) + '...' : 'Safety Incident',
        description: row.description,
        incidentDate: row.incident_date,
        incidentType: 'injury', // Default - not in current schema
        severityLevel: row.severity,
        status: row.status,
        reporterId: row.reported_by,
        reportedBy: row.reported_by_name,
        location: row.site_address,
        jobName: row.job_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return {
        data: incidents,
        page,
        limit,
        total,
        hasMore: offset + incidents.length < total,
      };
    } catch (error) {
      logger.error('Error listing safety incidents:', error);
      throw error;
    }
  }

  /**
   * Get safety incident by ID
   */
  async getIncidentById(incidentId: string, companyId: string): Promise<any> {
    try {
      const result = await db.query(
        `SELECT 
          si.id,
          si.job_id,
          si.site_id,
          si.incident_date,
          si.description,
          si.severity,
          si.status,
          si.reported_by,
          si.created_at,
          si.updated_at,
          j.name as job_name,
          s.name as site_name,
          s.address as site_address,
          u.first_name || ' ' || u.last_name as reported_by_name
         FROM safety_incidents si
         JOIN jobs j ON si.job_id = j.id
         LEFT JOIN sites s ON si.site_id = s.id
         LEFT JOIN users u ON si.reported_by = u.id
         WHERE si.id = $1 AND j.company_id = $2 AND si.deleted_at IS NULL`,
        [incidentId, companyId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Safety incident not found');
      }

      const row = result.rows[0];
      return {
        id: row.id,
        jobId: row.job_id,
        siteId: row.site_id,
        title: row.description ? row.description.substring(0, 50) : 'Safety Incident',
        description: row.description,
        incidentDate: row.incident_date,
        incidentType: 'injury', // Default
        severityLevel: row.severity,
        status: row.status,
        reporterId: row.reported_by,
        reportedBy: row.reported_by_name,
        location: row.site_address,
        jobName: row.job_name,
        siteName: row.site_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      logger.error('Error getting safety incident:', error);
      throw error;
    }
  }

  /**
   * Create safety incident
   */
  async createIncident(companyId: string, userId: string, data: any): Promise<any> {
    try {
      // Verify job belongs to company
      const jobCheck = await db.query(
        'SELECT id FROM jobs WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL',
        [data.jobId, companyId]
      );

      if (jobCheck.rows.length === 0) {
        throw new NotFoundError('Job not found');
      }

      const result = await db.query(
        `INSERT INTO safety_incidents (
          job_id, site_id, incident_date, description, severity, status, reported_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          data.jobId,
          data.siteId || null,
          data.incidentDate,
          data.description,
          data.severity || 'minor',
          data.status || 'open',
          userId,
        ]
      );

      const incident = result.rows[0];
      return {
        id: incident.id,
        jobId: incident.job_id,
        siteId: incident.site_id,
        incidentDate: incident.incident_date,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        reportedBy: userId,
        createdAt: incident.created_at,
        updatedAt: incident.updated_at,
      };
    } catch (error) {
      logger.error('Error creating safety incident:', error);
      throw error;
    }
  }

  /**
   * Get safety statistics
   */
  async getStatistics(companyId: string): Promise<any> {
    try {
      const result = await db.query(
        `SELECT 
          si.status,
          si.severity,
          COUNT(*) as count
         FROM safety_incidents si
         JOIN jobs j ON si.job_id = j.id
         WHERE j.company_id = $1 AND si.deleted_at IS NULL
         GROUP BY si.status, si.severity`,
        [companyId]
      );

      const byStatus: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};
      let total = 0;

      result.rows.forEach(row => {
        const count = parseInt(row.count, 10);
        byStatus[row.status] = (byStatus[row.status] || 0) + count;
        bySeverity[row.severity] = (bySeverity[row.severity] || 0) + count;
        total += count;
      });

      return {
        byStatus,
        bySeverity,
        total,
      };
    } catch (error) {
      logger.error('Error getting safety statistics:', error);
      throw error;
    }
  }
}

