// Worker Jobs Service

import { NotFoundError, ForbiddenError } from '../../../../types/errors';
import { logger } from '../../../../utils/logger';
import { db } from '../../../../db/connection';
import { JobStatus, TaskStatus } from '../../../../types/enums';
import {
  WorkerJobResponse,
  WorkerJobTaskResponse,
  ListWorkerJobsQuery,
  UpdateWorkerTaskRequest,
} from './jobs.types';

export class WorkerJobsService {
  /**
   * List jobs assigned to a worker
   */
  async listWorkerJobs(
    workerId: string,
    companyId: string,
    query: ListWorkerJobsQuery
  ): Promise<{ data: WorkerJobResponse[]; total: number; page: number; pageSize: number; hasMore: boolean }> {
    const page = query.page || 1;
    const pageSize = query.limit || 20;
    const offset = (page - 1) * pageSize;

    let whereConditions = ['jw.user_id = $1', 'j.company_id = $2', 'j.deleted_at IS NULL'];
    const params: any[] = [workerId, companyId];
    let paramIndex = 3;

    if (query.status) {
      whereConditions.push(`j.status = $${paramIndex}`);
      params.push(query.status);
      paramIndex++;
    }

    if (query.siteId) {
      whereConditions.push(`j.site_id = $${paramIndex}`);
      params.push(query.siteId);
      paramIndex++;
    }

    if (query.startDate) {
      whereConditions.push(`j.start_date >= $${paramIndex}`);
      params.push(query.startDate);
      paramIndex++;
    }

    if (query.endDate) {
      whereConditions.push(`j.end_date <= $${paramIndex}`);
      params.push(query.endDate);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT j.id) as count
      FROM jobs j
      INNER JOIN job_workers jw ON jw.job_id = j.id
      WHERE ${whereClause}
    `;
    const countResult = await db.query<{ count: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    // Get jobs with site info
    const jobsQuery = `
      SELECT DISTINCT
        j.id,
        j.name,
        j.description,
        j.job_type,
        j.status,
        j.priority,
        j.start_date,
        j.end_date,
        j.site_id,
        j.created_at,
        j.updated_at,
        s.address as site_address,
        s.name as site_name,
        jw.created_at as assigned_at
      FROM jobs j
      INNER JOIN job_workers jw ON jw.job_id = j.id
      LEFT JOIN sites s ON s.id = j.site_id
      WHERE ${whereClause}
      ORDER BY j.start_date DESC, j.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(pageSize, offset);

    const result = await db.query(jobsQuery, params);

    const jobs: WorkerJobResponse[] = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      jobType: row.job_type,
      status: row.status,
      priority: row.priority,
      startDate: row.start_date,
      endDate: row.end_date,
      siteId: row.site_id,
      siteAddress: row.site_address,
      siteName: row.site_name,
      assignedAt: row.assigned_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return {
      data: jobs,
      total,
      page,
      pageSize,
      hasMore: offset + jobs.length < total,
    };
  }

  /**
   * Get job details for a worker (only if assigned)
   */
  async getWorkerJobById(
    jobId: string,
    workerId: string,
    companyId: string
  ): Promise<WorkerJobResponse> {
    const query = `
      SELECT DISTINCT
        j.id,
        j.name,
        j.description,
        j.job_type,
        j.status,
        j.priority,
        j.start_date,
        j.end_date,
        j.site_id,
        j.created_at,
        j.updated_at,
        s.address as site_address,
        s.name as site_name,
        jw.created_at as assigned_at
      FROM jobs j
      INNER JOIN job_workers jw ON jw.job_id = j.id
      LEFT JOIN sites s ON s.id = j.site_id
      WHERE j.id = $1
        AND jw.user_id = $2
        AND j.company_id = $3
        AND j.deleted_at IS NULL
    `;

    const result = await db.query(query, [jobId, workerId, companyId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Job not found or you are not assigned to this job');
    }

    const row = result.rows[0];

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      jobType: row.job_type,
      status: row.status,
      priority: row.priority,
      startDate: row.start_date,
      endDate: row.end_date,
      siteId: row.site_id,
      siteAddress: row.site_address,
      siteName: row.site_name,
      assignedAt: row.assigned_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Get tasks for a job (only if worker is assigned to job)
   */
  async getJobTasks(
    jobId: string,
    workerId: string,
    companyId: string
  ): Promise<WorkerJobTaskResponse[]> {
    // First verify worker is assigned to this job
    const accessQuery = `
      SELECT 1 FROM jobs j
      INNER JOIN job_workers jw ON jw.job_id = j.id
      WHERE j.id = $1 AND jw.user_id = $2 AND j.company_id = $3 AND j.deleted_at IS NULL
    `;
    const accessResult = await db.query(accessQuery, [jobId, workerId, companyId]);

    if (accessResult.rows.length === 0) {
      throw new ForbiddenError('You are not assigned to this job');
    }

    // Get tasks
    const query = `
      SELECT
        jt.id,
        jt.name,
        jt.title,
        jt.description,
        jt.status,
        jt.priority,
        jt.due_date,
        jt.assigned_to,
        jt.created_at,
        jt.updated_at,
        u.first_name || ' ' || u.last_name as assigned_to_name
      FROM job_tasks jt
      LEFT JOIN users u ON u.id = jt.assigned_to
      WHERE jt.job_id = $1 AND jt.deleted_at IS NULL
      ORDER BY jt.due_date ASC NULLS LAST, jt.created_at DESC
    `;

    const result = await db.query(query, [jobId]);

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      dueDate: row.due_date,
      assignedTo: row.assigned_to,
      assignedToName: row.assigned_to_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Update task status (only for tasks assigned to worker or if worker is on the job)
   */
  async updateTaskStatus(
    jobId: string,
    taskId: string,
    workerId: string,
    companyId: string,
    data: UpdateWorkerTaskRequest
  ): Promise<WorkerJobTaskResponse> {
    // Verify worker is assigned to the job
    const accessQuery = `
      SELECT 1 FROM jobs j
      INNER JOIN job_workers jw ON jw.job_id = j.id
      WHERE j.id = $1 AND jw.user_id = $2 AND j.company_id = $3 AND j.deleted_at IS NULL
    `;
    const accessResult = await db.query(accessQuery, [jobId, workerId, companyId]);

    if (accessResult.rows.length === 0) {
      throw new ForbiddenError('You are not assigned to this job');
    }

    // Update task
    const updateQuery = `
      UPDATE job_tasks
      SET
        status = $1,
        updated_at = NOW()
      WHERE id = $2 AND job_id = $3 AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await db.query(updateQuery, [data.status, taskId, jobId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Task not found');
    }

    const task = result.rows[0];

    // Get assigned user name
    let assignedToName = null;
    if (task.assigned_to) {
      const userQuery = `SELECT first_name || ' ' || last_name as name FROM users WHERE id = $1`;
      const userResult = await db.query(userQuery, [task.assigned_to]);
      assignedToName = userResult.rows[0]?.name || null;
    }

    logger.info(`Task ${taskId} status updated to ${data.status} by worker ${workerId}`);

    return {
      id: task.id,
      name: task.name,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      assignedTo: task.assigned_to,
      assignedToName,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    };
  }
}

