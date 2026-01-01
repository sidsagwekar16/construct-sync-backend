// Tasks repository - Database operations

import { db } from '../../db/connection';
import { Task } from './tasks.types';
import { TaskStatus, PriorityLevel } from '../../types/enums';

export class TasksRepository {
  /**
   * Find all tasks for a company (through job relationship) with optional filters and pagination
   * Excludes soft-deleted tasks
   */
  async findTasksByCompany(
    companyId: string,
    search?: string,
    status?: TaskStatus,
    priority?: PriorityLevel,
    assignedTo?: string,
    jobId?: string,
    jobUnitId?: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ tasks: Task[]; total: number }> {
    let query = `
      SELECT t.* FROM job_tasks t
      INNER JOIN jobs j ON t.job_id = j.id
      WHERE j.company_id = $1 AND t.deleted_at IS NULL AND j.deleted_at IS NULL
    `;
    const params: any[] = [companyId];
    let paramIndex = 2;

    // Add search filter if provided
    if (search) {
      query += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add status filter if provided
    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Add priority filter if provided
    if (priority) {
      query += ` AND t.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    // Add assignedTo filter if provided
    if (assignedTo) {
      query += ` AND t.assigned_to = $${paramIndex}`;
      params.push(assignedTo);
      paramIndex++;
    }

    // Add jobId filter if provided
    if (jobId) {
      query += ` AND t.job_id = $${paramIndex}`;
      params.push(jobId);
      paramIndex++;
    }

    // Add jobUnitId filter if provided
    if (jobUnitId) {
      query += ` AND t.job_unit_id = $${paramIndex}`;
      params.push(jobUnitId);
      paramIndex++;
    }

    // Get total count (before adding ORDER BY and pagination)
    const countQuery = query.replace('SELECT t.*', 'SELECT COUNT(*)');
    const countResult = await db.query<{ count: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Add ORDER BY for main query
    query += ` ORDER BY t.created_at DESC`;

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query<Task>(query, params);
    return { tasks: result.rows, total };
  }

  /**
   * Find a task by ID
   * Only returns if not soft-deleted and belongs to the company (through job)
   */
  async findTaskById(taskId: string, companyId: string): Promise<Task | null> {
    const query = `
      SELECT t.* FROM job_tasks t
      INNER JOIN jobs j ON t.job_id = j.id
      WHERE t.id = $1 AND j.company_id = $2 AND t.deleted_at IS NULL AND j.deleted_at IS NULL
    `;
    const result = await db.query<Task>(query, [taskId, companyId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new task
   */
  async createTask(
    jobId: string,
    title: string,
    description?: string,
    jobUnitId?: string,
    assignedTo?: string,
    status?: TaskStatus,
    priority?: PriorityLevel,
    dueDate?: Date
  ): Promise<Task> {
    const query = `
      INSERT INTO job_tasks (job_id, title, description, job_unit_id, assigned_to, status, priority, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await db.query<Task>(query, [
      jobId,
      title,
      description || null,
      jobUnitId || null,
      assignedTo || null,
      status || TaskStatus.PENDING,
      priority || PriorityLevel.MEDIUM,
      dueDate || null,
    ]);
    return result.rows[0];
  }

  /**
   * Update a task
   */
  async updateTask(
    taskId: string,
    companyId: string,
    data: {
      title?: string;
      description?: string | null;
      jobUnitId?: string | null;
      assignedTo?: string | null;
      status?: TaskStatus;
      priority?: PriorityLevel;
      dueDate?: Date | null;
    }
  ): Promise<Task | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      params.push(data.title);
      paramIndex++;
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(data.description);
      paramIndex++;
    }

    if (data.jobUnitId !== undefined) {
      updates.push(`job_unit_id = $${paramIndex}`);
      params.push(data.jobUnitId);
      paramIndex++;
    }

    if (data.assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramIndex}`);
      params.push(data.assignedTo);
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

    if (data.dueDate !== undefined) {
      updates.push(`due_date = $${paramIndex}`);
      params.push(data.dueDate);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.findTaskById(taskId, companyId);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE job_tasks t
      SET ${updates.join(', ')}
      FROM jobs j
      WHERE t.id = $${paramIndex} 
        AND t.job_id = j.id 
        AND j.company_id = $${paramIndex + 1} 
        AND t.deleted_at IS NULL 
        AND j.deleted_at IS NULL
      RETURNING t.*
    `;
    params.push(taskId, companyId);

    const result = await db.query<Task>(query, params);
    return result.rows[0] || null;
  }

  /**
   * Soft delete a task
   */
  async deleteTask(taskId: string, companyId: string): Promise<boolean> {
    const query = `
      UPDATE job_tasks t
      SET deleted_at = CURRENT_TIMESTAMP
      FROM jobs j
      WHERE t.id = $1 
        AND t.job_id = j.id 
        AND j.company_id = $2 
        AND t.deleted_at IS NULL 
        AND j.deleted_at IS NULL
      RETURNING t.id
    `;
    const result = await db.query(query, [taskId, companyId]);
    return result.rows.length > 0;
  }

  /**
   * Restore a soft-deleted task
   */
  async restoreTask(taskId: string, companyId: string): Promise<Task | null> {
    const query = `
      UPDATE job_tasks t
      SET deleted_at = NULL
      FROM jobs j
      WHERE t.id = $1 
        AND t.job_id = j.id 
        AND j.company_id = $2 
        AND t.deleted_at IS NOT NULL 
        AND j.deleted_at IS NULL
      RETURNING t.*
    `;
    const result = await db.query<Task>(query, [taskId, companyId]);
    return result.rows[0] || null;
  }

  /**
   * Verify job belongs to the company
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
   * Verify job unit belongs to the same job and company
   */
  async verifyJobUnitCompany(
    jobUnitId: string,
    jobId: string,
    companyId: string
  ): Promise<boolean> {
    const query = `
      SELECT ju.id FROM job_units ju
      INNER JOIN jobs j ON ju.job_id = j.id
      WHERE ju.id = $1 AND ju.job_id = $2 AND j.company_id = $3 
        AND ju.deleted_at IS NULL AND j.deleted_at IS NULL
    `;
    const result = await db.query(query, [jobUnitId, jobId, companyId]);
    return result.rows.length > 0;
  }

  /**
   * Verify user belongs to the company
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
   * Get tasks by status for a company
   */
  async getTasksByStatus(companyId: string, status: TaskStatus): Promise<Task[]> {
    const query = `
      SELECT t.* FROM job_tasks t
      INNER JOIN jobs j ON t.job_id = j.id
      WHERE j.company_id = $1 AND t.status = $2 
        AND t.deleted_at IS NULL AND j.deleted_at IS NULL
      ORDER BY t.created_at DESC
    `;
    const result = await db.query<Task>(query, [companyId, status]);
    return result.rows;
  }

  /**
   * Count tasks by status for a company
   */
  async countTasksByStatus(companyId: string): Promise<Map<TaskStatus, number>> {
    const query = `
      SELECT t.status, COUNT(*) as count 
      FROM job_tasks t
      INNER JOIN jobs j ON t.job_id = j.id
      WHERE j.company_id = $1 AND t.deleted_at IS NULL AND j.deleted_at IS NULL
      GROUP BY t.status
    `;
    const result = await db.query<{ status: TaskStatus; count: string }>(query, [companyId]);

    const counts = new Map<TaskStatus, number>();
    result.rows.forEach((row) => {
      counts.set(row.status, parseInt(row.count, 10));
    });

    return counts;
  }

  /**
   * Get tasks assigned to a specific user
   */
  async getTasksByUser(companyId: string, userId: string): Promise<Task[]> {
    const query = `
      SELECT t.* FROM job_tasks t
      INNER JOIN jobs j ON t.job_id = j.id
      WHERE j.company_id = $1 AND t.assigned_to = $2 
        AND t.deleted_at IS NULL AND j.deleted_at IS NULL
      ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC
    `;
    const result = await db.query<Task>(query, [companyId, userId]);
    return result.rows;
  }

  /**
   * Add status history entry
   */
  async addStatusHistory(
    taskId: string,
    oldStatus: string | null,
    newStatus: string,
    changedBy: string,
    notes?: string
  ): Promise<void> {
    const query = `
      INSERT INTO task_status_history (task_id, old_status, new_status, changed_by, notes)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await db.query(query, [taskId, oldStatus, newStatus, changedBy, notes]);
  }

  /**
   * Get status history for a task
   */
  async getStatusHistory(taskId: string): Promise<Array<{
    id: string;
    oldStatus: string | null;
    newStatus: string;
    changedBy: string;
    changedByName: string;
    changedAt: Date;
    notes: string | null;
  }>> {
    const query = `
      SELECT 
        tsh.id,
        tsh.old_status as "oldStatus",
        tsh.new_status as "newStatus",
        tsh.changed_by as "changedBy",
        CONCAT(u.first_name, ' ', u.last_name) as "changedByName",
        tsh.changed_at as "changedAt",
        tsh.notes
      FROM task_status_history tsh
      LEFT JOIN users u ON tsh.changed_by = u.id
      WHERE tsh.task_id = $1
      ORDER BY tsh.changed_at DESC
    `;
    const result = await db.query(query, [taskId]);
    return result.rows;
  }
}
