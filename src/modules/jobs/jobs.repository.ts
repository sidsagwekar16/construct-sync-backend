// Jobs repository - Database operations

import { db } from '../../db/connection';
import { Job } from './jobs.types';
import { JobStatus } from '../../types/enums';

export class JobsRepository {
  /**
   * Find all jobs for a company with optional search and pagination
   * Excludes soft-deleted jobs
   */
  async findJobsByCompany(
    companyId: string,
    search?: string,
    status?: JobStatus,
    siteId?: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ jobs: Job[]; total: number }> {
    let query = `
      SELECT * FROM jobs 
      WHERE company_id = $1 AND deleted_at IS NULL
    `;
    const params: any[] = [companyId];
    let paramIndex = 2;

    // Add search filter if provided
    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR job_number ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add status filter if provided
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Add site filter if provided
    if (siteId) {
      query += ` AND site_id = $${paramIndex}`;
      params.push(siteId);
      paramIndex++;
    }

    // Get total count (before adding ORDER BY and pagination)
    const countQuery = `SELECT COUNT(*) FROM jobs WHERE company_id = $1 AND deleted_at IS NULL` +
      (search ? ` AND (name ILIKE $2 OR description ILIKE $2 OR job_number ILIKE $2)` : '') +
      (status ? ` AND status = $${search ? 3 : 2}` : '') +
      (siteId ? ` AND site_id = $${search && status ? 4 : search || status ? 3 : 2}` : '');
    const countResult = await db.query<{ count: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Add ORDER BY for main query
    query += ` ORDER BY created_at DESC`;

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query<Job>(query, params);
    return { jobs: result.rows, total };
  }

  /**
   * Find a job by ID
   * Only returns if not soft-deleted and belongs to the company
   */
  async findJobById(jobId: string, companyId: string): Promise<Job | null> {
    const query = `
      SELECT * FROM jobs 
      WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query<Job>(query, [jobId, companyId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new job
   */
  async createJob(
    companyId: string,
    name: string,
    description?: string,
    jobNumber?: string,
    siteId?: string,
    status?: JobStatus,
    startDate?: Date,
    endDate?: Date
  ): Promise<Job> {
    const query = `
      INSERT INTO jobs (company_id, name, description, job_number, site_id, status, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await db.query<Job>(query, [
      companyId,
      name,
      description || null,
      jobNumber || null,
      siteId || null,
      status || JobStatus.DRAFT,
      startDate || null,
      endDate || null,
    ]);
    return result.rows[0];
  }

  /**
   * Update a job
   */
  async updateJob(
    jobId: string,
    companyId: string,
    data: {
      name?: string;
      description?: string | null;
      jobNumber?: string | null;
      siteId?: string | null;
      status?: JobStatus;
      startDate?: Date | null;
      endDate?: Date | null;
    }
  ): Promise<Job | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(data.name);
      paramIndex++;
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(data.description);
      paramIndex++;
    }

    if (data.jobNumber !== undefined) {
      updates.push(`job_number = $${paramIndex}`);
      params.push(data.jobNumber);
      paramIndex++;
    }

    if (data.siteId !== undefined) {
      updates.push(`site_id = $${paramIndex}`);
      params.push(data.siteId);
      paramIndex++;
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(data.status);
      paramIndex++;
    }

    if (data.startDate !== undefined) {
      updates.push(`start_date = $${paramIndex}`);
      params.push(data.startDate);
      paramIndex++;
    }

    if (data.endDate !== undefined) {
      updates.push(`end_date = $${paramIndex}`);
      params.push(data.endDate);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.findJobById(jobId, companyId);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE jobs 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1} AND deleted_at IS NULL
      RETURNING *
    `;
    params.push(jobId, companyId);

    const result = await db.query<Job>(query, params);
    return result.rows[0] || null;
  }

  /**
   * Soft delete a job
   */
  async deleteJob(jobId: string, companyId: string): Promise<boolean> {
    const query = `
      UPDATE jobs 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
      RETURNING id
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
   * Get jobs by status for a company
   */
  async getJobsByStatus(companyId: string, status: JobStatus): Promise<Job[]> {
    const query = `
      SELECT * FROM jobs 
      WHERE company_id = $1 AND status = $2 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    const result = await db.query<Job>(query, [companyId, status]);
    return result.rows;
  }

  /**
   * Count jobs by status for a company
   */
  async countJobsByStatus(companyId: string): Promise<Map<JobStatus, number>> {
    const query = `
      SELECT status, COUNT(*) as count 
      FROM jobs 
      WHERE company_id = $1 AND deleted_at IS NULL
      GROUP BY status
    `;
    const result = await db.query<{ status: JobStatus; count: string }>(query, [companyId]);

    const counts = new Map<JobStatus, number>();
    result.rows.forEach((row) => {
      counts.set(row.status, parseInt(row.count, 10));
    });

    return counts;
  }

  /**
   * Get jobs by site
   */
  async getJobsBySite(companyId: string, siteId: string): Promise<Job[]> {
    const query = `
      SELECT * FROM jobs 
      WHERE company_id = $1 AND site_id = $2 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    const result = await db.query<Job>(query, [companyId, siteId]);
    return result.rows;
  }
}
