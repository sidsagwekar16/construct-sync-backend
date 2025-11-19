// Jobs repository - Database operations

import { db } from '../../db/connection';
import { Job, JobWorker, JobManager } from './jobs.types';
import { JobStatus, PriorityLevel } from '../../types/enums';

export class JobsRepository {
  /**
   * Find all jobs for a company with optional filters and pagination
   * Excludes soft-deleted jobs
   */
  async findJobsByCompany(
    companyId: string,
    search?: string,
    status?: JobStatus,
    priority?: PriorityLevel,
    siteId?: string,
    assignedTo?: string,
    jobType?: string,
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
      query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR job_number ILIKE $${paramIndex} OR job_type ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add status filter if provided
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Add priority filter if provided
    if (priority) {
      query += ` AND priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    // Add site filter if provided
    if (siteId) {
      query += ` AND site_id = $${paramIndex}`;
      params.push(siteId);
      paramIndex++;
    }

    // Add assigned to filter if provided
    if (assignedTo) {
      query += ` AND assigned_to = $${paramIndex}`;
      params.push(assignedTo);
      paramIndex++;
    }

    // Add job type filter if provided
    if (jobType) {
      query += ` AND job_type = $${paramIndex}`;
      params.push(jobType);
      paramIndex++;
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await db.query<{ count: string }>(countQuery, params.slice(0, paramIndex - 1));
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
    createdBy: string,
    name: string,
    description?: string,
    jobNumber?: string,
    jobType?: string,
    siteId?: string,
    status?: JobStatus,
    priority?: PriorityLevel,
    startDate?: Date,
    endDate?: Date,
    completedDate?: Date,
    assignedTo?: string
  ): Promise<Job> {
    const query = `
      INSERT INTO jobs (
        company_id, created_by, name, description, job_number, job_type, 
        site_id, status, priority, start_date, end_date, completed_date, assigned_to
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const result = await db.query<Job>(query, [
      companyId,
      createdBy,
      name,
      description || null,
      jobNumber || null,
      jobType || null,
      siteId || null,
      status || JobStatus.DRAFT,
      priority || null,
      startDate || null,
      endDate || null,
      completedDate || null,
      assignedTo || null,
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
      jobType?: string | null;
      siteId?: string | null;
      status?: JobStatus;
      priority?: PriorityLevel | null;
      startDate?: Date | null;
      endDate?: Date | null;
      completedDate?: Date | null;
      assignedTo?: string | null;
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

    if (data.jobType !== undefined) {
      updates.push(`job_type = $${paramIndex}`);
      params.push(data.jobType);
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

    if (data.priority !== undefined) {
      updates.push(`priority = $${paramIndex}`);
      params.push(data.priority);
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

    if (data.completedDate !== undefined) {
      updates.push(`completed_date = $${paramIndex}`);
      params.push(data.completedDate);
      paramIndex++;
    }

    if (data.assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramIndex}`);
      params.push(data.assignedTo);
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
   * Verify user belongs to the same company
   */
  async verifyUserCompany(userId: string, companyId: string): Promise<boolean> {
    const query = `
      SELECT id FROM users 
      WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query(query, [userId, companyId]);
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

  /**
   * Archive a job by changing status to archived
   */
  async archiveJob(jobId: string, companyId: string): Promise<Job | null> {
    const query = `
      UPDATE jobs 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 AND company_id = $3 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await db.query<Job>(query, [JobStatus.ARCHIVED, jobId, companyId]);
    return result.rows[0] || null;
  }

  /**
   * Unarchive a job by changing status to draft
   */
  async unarchiveJob(jobId: string, companyId: string): Promise<Job | null> {
    const query = `
      UPDATE jobs 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 AND company_id = $3 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await db.query<Job>(query, [JobStatus.DRAFT, jobId, companyId]);
    return result.rows[0] || null;
  }

  // ==================== Job Workers ====================

  /**
   * Add workers to a job
   */
  async addWorkers(jobId: string, workerIds: string[]): Promise<void> {
    if (workerIds.length === 0) return;

    const values = workerIds.map((_, i) => `($1, $${i + 2})`).join(', ');
    const query = `
      INSERT INTO job_workers (job_id, user_id)
      VALUES ${values}
      ON CONFLICT (job_id, user_id) DO NOTHING
    `;
    await db.query(query, [jobId, ...workerIds]);
  }

  /**
   * Remove all workers from a job
   */
  async removeAllWorkers(jobId: string): Promise<void> {
    const query = `DELETE FROM job_workers WHERE job_id = $1`;
    await db.query(query, [jobId]);
  }

  /**
   * Get workers for a job
   */
  async getJobWorkers(jobId: string): Promise<string[]> {
    const query = `SELECT user_id FROM job_workers WHERE job_id = $1`;
    const result = await db.query<{ user_id: string }>(query, [jobId]);
    return result.rows.map(row => row.user_id);
  }

  /**
   * Get workers with details for a job
   */
  async getJobWorkersWithDetails(jobId: string): Promise<Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>> {
    const query = `
      SELECT u.id, u.first_name, u.last_name, u.email
      FROM job_workers jw
      JOIN users u ON jw.user_id = u.id
      WHERE jw.job_id = $1 AND u.deleted_at IS NULL
      ORDER BY u.first_name, u.last_name
    `;
    const result = await db.query<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    }>(query, [jobId]);
    
    return result.rows.map(row => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
    }));
  }

  // ==================== Job Managers ====================

  /**
   * Add managers to a job
   */
  async addManagers(jobId: string, managerIds: string[]): Promise<void> {
    if (managerIds.length === 0) return;

    const values = managerIds.map((_, i) => `($1, $${i + 2})`).join(', ');
    const query = `
      INSERT INTO job_managers (job_id, user_id)
      VALUES ${values}
      ON CONFLICT (job_id, user_id) DO NOTHING
    `;
    await db.query(query, [jobId, ...managerIds]);
  }

  /**
   * Remove all managers from a job
   */
  async removeAllManagers(jobId: string): Promise<void> {
    const query = `DELETE FROM job_managers WHERE job_id = $1`;
    await db.query(query, [jobId]);
  }

  /**
   * Get managers for a job
   */
  async getJobManagers(jobId: string): Promise<string[]> {
    const query = `SELECT user_id FROM job_managers WHERE job_id = $1`;
    const result = await db.query<{ user_id: string }>(query, [jobId]);
    return result.rows.map(row => row.user_id);
  }

  /**
   * Get managers with details for a job
   */
  async getJobManagersWithDetails(jobId: string): Promise<Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>> {
    const query = `
      SELECT u.id, u.first_name, u.last_name, u.email
      FROM job_managers jm
      JOIN users u ON jm.user_id = u.id
      WHERE jm.job_id = $1 AND u.deleted_at IS NULL
      ORDER BY u.first_name, u.last_name
    `;
    const result = await db.query<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    }>(query, [jobId]);
    
    return result.rows.map(row => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
    }));
  }

  /**
   * Get user details (assigned to or created by)
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
}
