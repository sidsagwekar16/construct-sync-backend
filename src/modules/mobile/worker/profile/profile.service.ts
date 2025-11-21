// Worker Profile Service

import { NotFoundError } from '../../../../types/errors';
import { logger } from '../../../../utils/logger';
import { db } from '../../../../db/connection';
import { JobStatus, TaskStatus } from '../../../../types/enums';
import {
  WorkerProfileResponse,
  UpdateWorkerProfileRequest,
  WorkerProfileStatistics,
} from './profile.types';

export class WorkerProfileService {
  /**
   * Get worker profile
   */
  async getWorkerProfile(workerId: string, companyId: string): Promise<WorkerProfileResponse> {
    const query = `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.phone,
        u.hourly_rate,
        u.company_id,
        u.is_active,
        u.created_at,
        c.name as company_name
      FROM users u
      LEFT JOIN companies c ON c.id = u.company_id
      WHERE u.id = $1 AND u.company_id = $2 AND u.deleted_at IS NULL
    `;

    const result = await db.query(query, [workerId, companyId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Worker profile not found');
    }

    const row = result.rows[0];

    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      phone: row.phone,
      hourlyRate: row.hourly_rate,
      companyId: row.company_id,
      companyName: row.company_name,
      isActive: row.is_active,
      createdAt: row.created_at,
    };
  }

  /**
   * Update worker profile (limited fields)
   */
  async updateWorkerProfile(
    workerId: string,
    companyId: string,
    data: UpdateWorkerProfileRequest
  ): Promise<WorkerProfileResponse> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.firstName !== undefined) {
      updates.push(`first_name = $${paramIndex}`);
      params.push(data.firstName);
      paramIndex++;
    }

    if (data.lastName !== undefined) {
      updates.push(`last_name = $${paramIndex}`);
      params.push(data.lastName);
      paramIndex++;
    }

    if (data.phone !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      params.push(data.phone);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.getWorkerProfile(workerId, companyId);
    }

    updates.push(`updated_at = NOW()`);

    const updateQuery = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1} AND deleted_at IS NULL
      RETURNING id
    `;
    params.push(workerId, companyId);

    const result = await db.query(updateQuery, params);

    if (result.rows.length === 0) {
      throw new NotFoundError('Worker profile not found');
    }

    logger.info(`Worker profile updated: ${workerId}`);

    return this.getWorkerProfile(workerId, companyId);
  }

  /**
   * Get worker statistics
   */
  async getWorkerStatistics(workerId: string, companyId: string): Promise<WorkerProfileStatistics> {
    // Count total jobs assigned
    const totalJobsQuery = `
      SELECT COUNT(DISTINCT jw.job_id) as count
      FROM job_workers jw
      INNER JOIN jobs j ON j.id = jw.job_id
      WHERE jw.user_id = $1 AND j.company_id = $2 AND j.deleted_at IS NULL
    `;
    const totalJobsResult = await db.query(totalJobsQuery, [workerId, companyId]);
    const totalJobsAssigned = parseInt(totalJobsResult.rows[0]?.count || '0', 10);

    // Count completed jobs
    const completedJobsQuery = `
      SELECT COUNT(DISTINCT jw.job_id) as count
      FROM job_workers jw
      INNER JOIN jobs j ON j.id = jw.job_id
      WHERE jw.user_id = $1 
        AND j.company_id = $2 
        AND j.status = $3
        AND j.deleted_at IS NULL
    `;
    const completedJobsResult = await db.query(completedJobsQuery, [
      workerId,
      companyId,
      JobStatus.COMPLETED,
    ]);
    const completedJobs = parseInt(completedJobsResult.rows[0]?.count || '0', 10);

    // Count active jobs
    const activeJobsQuery = `
      SELECT COUNT(DISTINCT jw.job_id) as count
      FROM job_workers jw
      INNER JOIN jobs j ON j.id = jw.job_id
      WHERE jw.user_id = $1 
        AND j.company_id = $2 
        AND j.status = $3
        AND j.deleted_at IS NULL
    `;
    const activeJobsResult = await db.query(activeJobsQuery, [
      workerId,
      companyId,
      JobStatus.IN_PROGRESS,
    ]);
    const activeJobs = parseInt(activeJobsResult.rows[0]?.count || '0', 10);

    // Count safety incidents reported
    const safetyQuery = `
      SELECT COUNT(*) as count
      FROM safety_incidents
      WHERE reported_by = $1 AND deleted_at IS NULL
    `;
    const safetyResult = await db.query(safetyQuery, [workerId]);
    const safetyIncidentsReported = parseInt(safetyResult.rows[0]?.count || '0', 10);

    // Count tasks completed
    const tasksQuery = `
      SELECT COUNT(*) as count
      FROM job_tasks jt
      INNER JOIN jobs j ON j.id = jt.job_id
      WHERE jt.assigned_to = $1
        AND j.company_id = $2
        AND jt.status = $3
        AND jt.deleted_at IS NULL
    `;
    const tasksResult = await db.query(tasksQuery, [workerId, companyId, TaskStatus.COMPLETED]);
    const tasksCompleted = parseInt(tasksResult.rows[0]?.count || '0', 10);

    return {
      totalJobsAssigned,
      completedJobs,
      activeJobs,
      safetyIncidentsReported,
      tasksCompleted,
    };
  }
}

