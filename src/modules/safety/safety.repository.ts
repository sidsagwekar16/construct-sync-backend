// Safety repository - Database operations

import { db } from '../../db/connection';
import { SafetyIncident } from './safety.types';
import { SafetyStatus, SeverityLevel } from '../../types/enums';

export class SafetyRepository {
  /**
   * Find all safety incidents for a company with optional filters and pagination
   * Excludes soft-deleted incidents
   */
  async findIncidentsByCompany(
    companyId: string,
    search?: string,
    status?: SafetyStatus,
    severity?: SeverityLevel,
    jobId?: string,
    siteId?: string,
    reportedBy?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ incidents: SafetyIncident[]; total: number }> {
    let query = `
      SELECT si.* FROM safety_incidents si
      LEFT JOIN jobs j ON si.job_id = j.id
      LEFT JOIN sites s ON si.site_id = s.id
      WHERE (j.company_id = $1 OR s.company_id = $1) AND si.deleted_at IS NULL
    `;
    const params: any[] = [companyId];
    let paramIndex = 2;

    // Add search filter if provided
    if (search) {
      query += ` AND (si.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add status filter if provided
    if (status) {
      query += ` AND si.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Add severity filter if provided
    if (severity) {
      query += ` AND si.severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    // Add job filter if provided
    if (jobId) {
      query += ` AND si.job_id = $${paramIndex}`;
      params.push(jobId);
      paramIndex++;
    }

    // Add site filter if provided
    if (siteId) {
      query += ` AND si.site_id = $${paramIndex}`;
      params.push(siteId);
      paramIndex++;
    }

    // Add reported by filter if provided
    if (reportedBy) {
      query += ` AND si.reported_by = $${paramIndex}`;
      params.push(reportedBy);
      paramIndex++;
    }

    // Add date range filters
    if (startDate) {
      query += ` AND si.incident_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND si.incident_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    // Get total count
    const countQuery = query.replace('SELECT si.*', 'SELECT COUNT(DISTINCT si.id)');
    const countResult = await db.query<{ count: string }>(countQuery, params.slice(0, paramIndex - 1));
    const total = parseInt(countResult.rows[0].count, 10);

    // Add GROUP BY to handle potential duplicates from LEFT JOINs
    query += ` GROUP BY si.id`;

    // Add ORDER BY for main query
    query += ` ORDER BY si.incident_date DESC, si.created_at DESC`;

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query<SafetyIncident>(query, params);
    return { incidents: result.rows, total };
  }

  /**
   * Find a safety incident by ID
   * Only returns if not soft-deleted and belongs to the company
   */
  async findIncidentById(incidentId: string, companyId: string): Promise<SafetyIncident | null> {
    const query = `
      SELECT si.* FROM safety_incidents si
      LEFT JOIN jobs j ON si.job_id = j.id
      LEFT JOIN sites s ON si.site_id = s.id
      WHERE si.id = $1 AND (j.company_id = $2 OR s.company_id = $2) AND si.deleted_at IS NULL
    `;
    const result = await db.query<SafetyIncident>(query, [incidentId, companyId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new safety incident
   */
  async createIncident(
    reportedBy: string,
    incidentDate: Date,
    description: string,
    jobId?: string,
    siteId?: string,
    severity?: SeverityLevel,
    status?: SafetyStatus
  ): Promise<SafetyIncident> {
    const query = `
      INSERT INTO safety_incidents (
        job_id, site_id, reported_by, incident_date, description, severity, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await db.query<SafetyIncident>(query, [
      jobId || null,
      siteId || null,
      reportedBy,
      incidentDate,
      description,
      severity || null,
      status || SafetyStatus.OPEN,
    ]);
    return result.rows[0];
  }

  /**
   * Update a safety incident
   */
  async updateIncident(
    incidentId: string,
    companyId: string,
    data: {
      jobId?: string | null;
      siteId?: string | null;
      incidentDate?: Date;
      description?: string;
      severity?: SeverityLevel | null;
      status?: SafetyStatus | null;
    }
  ): Promise<SafetyIncident | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.jobId !== undefined) {
      updates.push(`job_id = $${paramIndex}`);
      params.push(data.jobId);
      paramIndex++;
    }

    if (data.siteId !== undefined) {
      updates.push(`site_id = $${paramIndex}`);
      params.push(data.siteId);
      paramIndex++;
    }

    if (data.incidentDate !== undefined) {
      updates.push(`incident_date = $${paramIndex}`);
      params.push(data.incidentDate);
      paramIndex++;
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(data.description);
      paramIndex++;
    }

    if (data.severity !== undefined) {
      updates.push(`severity = $${paramIndex}`);
      params.push(data.severity);
      paramIndex++;
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(data.status);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.findIncidentById(incidentId, companyId);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE safety_incidents si
      SET ${updates.join(', ')}
      FROM (
        SELECT si2.id FROM safety_incidents si2
        LEFT JOIN jobs j ON si2.job_id = j.id
        LEFT JOIN sites s ON si2.site_id = s.id
        WHERE si2.id = $${paramIndex} AND (j.company_id = $${paramIndex + 1} OR s.company_id = $${paramIndex + 1}) AND si2.deleted_at IS NULL
      ) AS subquery
      WHERE si.id = subquery.id
      RETURNING si.*
    `;
    params.push(incidentId, companyId);

    const result = await db.query<SafetyIncident>(query, params);
    return result.rows[0] || null;
  }

  /**
   * Soft delete a safety incident
   */
  async deleteIncident(incidentId: string, companyId: string): Promise<boolean> {
    const query = `
      UPDATE safety_incidents si
      SET deleted_at = CURRENT_TIMESTAMP
      FROM (
        SELECT si2.id FROM safety_incidents si2
        LEFT JOIN jobs j ON si2.job_id = j.id
        LEFT JOIN sites s ON si2.site_id = s.id
        WHERE si2.id = $1 AND (j.company_id = $2 OR s.company_id = $2) AND si2.deleted_at IS NULL
      ) AS subquery
      WHERE si.id = subquery.id
      RETURNING si.id
    `;
    const result = await db.query(query, [incidentId, companyId]);
    return result.rows.length > 0;
  }

  /**
   * Verify job belongs to the same company
   */
  async verifyJobCompany(jobId: string, companyId: string): Promise<boolean> {
    const query = `
      SELECT id FROM jobs 
      WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query(query, [jobId, companyId]);
    return result.rows.length > 0;
  }

  /**
   * Verify site belongs to the same company
   */
  async verifySiteCompany(siteId: string, companyId: string): Promise<boolean> {
    const query = `
      SELECT id FROM sites 
      WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query(query, [siteId, companyId]);
    return result.rows.length > 0;
  }

  /**
   * Get user details (reported by)
   */
  async getUserDetails(userId: string): Promise<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null> {
    const query = `
      SELECT id, first_name, last_name, email
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await db.query<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    }>(query, [userId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
    };
  }

  /**
   * Get job details
   */
  async getJobDetails(jobId: string): Promise<{
    id: string;
    name: string;
    jobNumber: string | null;
  } | null> {
    const query = `
      SELECT id, name, job_number
      FROM jobs
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await db.query<{
      id: string;
      name: string;
      job_number: string | null;
    }>(query, [jobId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      jobNumber: row.job_number,
    };
  }

  /**
   * Get site details
   */
  async getSiteDetails(siteId: string): Promise<{
    id: string;
    name: string;
    address: string | null;
  } | null> {
    const query = `
      SELECT id, name, address
      FROM sites
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await db.query<{
      id: string;
      name: string;
      address: string | null;
    }>(query, [siteId]);

    if (result.rows.length === 0) return null;

    return result.rows[0];
  }

  /**
   * Get incidents by status for a company
   */
  async getIncidentsByStatus(companyId: string, status: SafetyStatus): Promise<SafetyIncident[]> {
    const query = `
      SELECT si.* FROM safety_incidents si
      LEFT JOIN jobs j ON si.job_id = j.id
      LEFT JOIN sites s ON si.site_id = s.id
      WHERE (j.company_id = $1 OR s.company_id = $1) AND si.status = $2 AND si.deleted_at IS NULL
      GROUP BY si.id
      ORDER BY si.incident_date DESC
    `;
    const result = await db.query<SafetyIncident>(query, [companyId, status]);
    return result.rows;
  }

  /**
   * Count incidents by status for a company
   */
  async countIncidentsByStatus(companyId: string): Promise<Map<SafetyStatus, number>> {
    const query = `
      SELECT si.status, COUNT(DISTINCT si.id) as count 
      FROM safety_incidents si
      LEFT JOIN jobs j ON si.job_id = j.id
      LEFT JOIN sites s ON si.site_id = s.id
      WHERE (j.company_id = $1 OR s.company_id = $1) AND si.deleted_at IS NULL
      GROUP BY si.status
    `;
    const result = await db.query<{ status: SafetyStatus; count: string }>(query, [companyId]);

    const counts = new Map<SafetyStatus, number>();
    result.rows.forEach((row) => {
      counts.set(row.status, parseInt(row.count, 10));
    });

    return counts;
  }

  /**
   * Count incidents by severity for a company
   */
  async countIncidentsBySeverity(companyId: string): Promise<Map<SeverityLevel, number>> {
    const query = `
      SELECT si.severity, COUNT(DISTINCT si.id) as count 
      FROM safety_incidents si
      LEFT JOIN jobs j ON si.job_id = j.id
      LEFT JOIN sites s ON si.site_id = s.id
      WHERE (j.company_id = $1 OR s.company_id = $1) AND si.deleted_at IS NULL
      GROUP BY si.severity
    `;
    const result = await db.query<{ severity: SeverityLevel; count: string }>(query, [companyId]);

    const counts = new Map<SeverityLevel, number>();
    result.rows.forEach((row) => {
      counts.set(row.severity, parseInt(row.count, 10));
    });

    return counts;
  }
}
