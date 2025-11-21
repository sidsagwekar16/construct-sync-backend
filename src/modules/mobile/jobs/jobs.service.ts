// Mobile Jobs Service

import { db } from '../../../db/connection';
import { logger } from '../../../utils/logger';
import { NotFoundError } from '../../../types/errors';
import { JobResponse } from '../../jobs/jobs.types';

interface ListJobsQuery {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  siteId?: string;
  assignedTo?: string;
  jobType?: string;
  search?: string;
}

interface PaginatedJobsResponse {
  data: any[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export class MobileJobsService {
  /**
   * List jobs with filters and pagination
   */
  async listJobs(companyId: string, query: ListJobsQuery): Promise<PaginatedJobsResponse> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const offset = (page - 1) * limit;

      let whereConditions = ['j.company_id = $1', 'j.deleted_at IS NULL'];
      const params: any[] = [companyId];
      let paramIndex = 2;

      if (query.status) {
        whereConditions.push(`j.status = $${paramIndex}`);
        params.push(query.status);
        paramIndex++;
      }

      if (query.priority) {
        whereConditions.push(`j.priority = $${paramIndex}`);
        params.push(query.priority);
        paramIndex++;
      }

      if (query.siteId) {
        whereConditions.push(`j.site_id = $${paramIndex}`);
        params.push(query.siteId);
        paramIndex++;
      }

      if (query.assignedTo) {
        whereConditions.push(`j.assigned_to = $${paramIndex}`);
        params.push(query.assignedTo);
        paramIndex++;
      }

      if (query.jobType) {
        whereConditions.push(`j.job_type ILIKE $${paramIndex}`);
        params.push(`%${query.jobType}%`);
        paramIndex++;
      }

      if (query.search) {
        whereConditions.push(`(j.name ILIKE $${paramIndex} OR j.description ILIKE $${paramIndex})`);
        params.push(`%${query.search}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as count FROM jobs j WHERE ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get paginated jobs with relationships
      const jobsResult = await db.query(
        `SELECT 
          j.id,
          j.name,
          j.description,
          j.job_number,
          j.job_type,
          j.status,
          j.priority,
          j.start_date,
          j.end_date,
          j.completed_date,
          j.assigned_to,
          j.site_id,
          j.created_at,
          j.updated_at,
          s.name as site_name,
          s.address as site_address,
          au.first_name || ' ' || au.last_name as assigned_to_name,
          cu.first_name || ' ' || cu.last_name as created_by_name
         FROM jobs j
         LEFT JOIN sites s ON j.site_id = s.id
         LEFT JOIN users au ON j.assigned_to = au.id
         LEFT JOIN users cu ON j.created_by = cu.id
         WHERE ${whereClause}
         ORDER BY j.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      const jobs = jobsResult.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        jobNumber: row.job_number,
        jobType: row.job_type,
        status: row.status,
        priority: row.priority,
        startDate: row.start_date,
        endDate: row.end_date,
        completedDate: row.completed_date,
        assignedTo: row.assigned_to,
        assignedToName: row.assigned_to_name,
        siteId: row.site_id,
        siteName: row.site_name,
        siteAddress: row.site_address,
        createdByName: row.created_by_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return {
        data: jobs,
        page,
        limit,
        total,
        hasMore: offset + jobs.length < total,
      };
    } catch (error) {
      logger.error('Error listing jobs:', error);
      throw error;
    }
  }

  /**
   * Get single job by ID with full details
   */
  async getJobById(jobId: string, companyId: string): Promise<any> {
    try {
      const result = await db.query(
        `SELECT 
          j.id,
          j.name,
          j.description,
          j.job_number,
          j.job_type,
          j.status,
          j.priority,
          j.start_date,
          j.end_date,
          j.completed_date,
          j.assigned_to,
          j.site_id,
          j.created_at,
          j.updated_at,
          s.name as site_name,
          s.address as site_address,
          au.first_name || ' ' || au.last_name as assigned_to_name,
          cu.first_name || ' ' || cu.last_name as created_by_name
         FROM jobs j
         LEFT JOIN sites s ON j.site_id = s.id
         LEFT JOIN users au ON j.assigned_to = au.id
         LEFT JOIN users cu ON j.created_by = cu.id
         WHERE j.id = $1 AND j.company_id = $2 AND j.deleted_at IS NULL`,
        [jobId, companyId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Job not found');
      }

      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        jobNumber: row.job_number,
        jobType: row.job_type,
        status: row.status,
        priority: row.priority,
        startDate: row.start_date,
        endDate: row.end_date,
        completedDate: row.completed_date,
        assignedTo: row.assigned_to,
        assignedToName: row.assigned_to_name,
        siteId: row.site_id,
        siteName: row.site_name,
        siteAddress: row.site_address,
        createdByName: row.created_by_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      logger.error('Error getting job by ID:', error);
      throw error;
    }
  }

  /**
   * Get tasks for a specific job
   */
  async getJobTasks(jobId: string, companyId: string): Promise<any[]> {
    try {
      // First verify job exists and belongs to company
      const jobCheck = await db.query(
        'SELECT id FROM jobs WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL',
        [jobId, companyId]
      );

      if (jobCheck.rows.length === 0) {
        throw new NotFoundError('Job not found');
      }

      const result = await db.query(
        `SELECT 
          t.id,
          t.title as name,
          t.description,
          t.status,
          t.priority,
          t.assigned_to,
          t.due_date,
          t.created_at,
          t.updated_at,
          u.first_name || ' ' || u.last_name as assigned_to_name
         FROM job_tasks t
         LEFT JOIN users u ON t.assigned_to = u.id
         WHERE t.job_id = $1 AND t.deleted_at IS NULL
         ORDER BY t.created_at DESC`,
        [jobId]
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        title: row.name, // Mobile app uses 'title'
        description: row.description,
        status: row.status,
        priority: row.priority,
        assignedTo: row.assigned_to,
        assigneeName: row.assigned_to_name,
        dueDate: row.due_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      logger.error('Error getting job tasks:', error);
      throw error;
    }
  }

  /**
   * Create a new task for a job
   */
  async createTask(jobId: string, companyId: string, userId: string, taskData: any): Promise<any> {
    try {
      // Verify job exists and belongs to company
      const jobCheck = await db.query(
        'SELECT id FROM jobs WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL',
        [jobId, companyId]
      );

      if (jobCheck.rows.length === 0) {
        throw new NotFoundError('Job not found');
      }

      const result = await db.query(
        `INSERT INTO job_tasks (
          job_id, title, description, status, priority, assigned_to, due_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          jobId,
          taskData.name,
          taskData.description || null,
          taskData.status || 'pending',
          taskData.priority || 'medium',
          taskData.assignedTo || null,
          taskData.dueDate || null,
        ]
      );

      const task = result.rows[0];
      return {
        id: task.id,
        name: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assigned_to,
        dueDate: task.due_date,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      };
    } catch (error) {
      logger.error('Error creating task:', error);
      throw error;
    }
  }

  /**
   * Get workers assigned to a job
   */
  async getJobWorkers(jobId: string, companyId: string): Promise<any[]> {
    try {
      // First verify job exists and belongs to company
      const jobCheck = await db.query(
        'SELECT id FROM jobs WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL',
        [jobId, companyId]
      );

      if (jobCheck.rows.length === 0) {
        throw new NotFoundError('Job not found');
      }

      const result = await db.query(
        `SELECT 
          u.id,
          u.first_name || ' ' || u.last_name as name,
          u.role,
          u.email,
          u.phone as phone
         FROM job_workers jw
         JOIN users u ON jw.user_id = u.id
         WHERE jw.job_id = $1 AND u.deleted_at IS NULL
         ORDER BY u.first_name, u.last_name`,
        [jobId]
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        email: row.email,
        phone: row.phone,
        status: 'available', // Default status
        hourlyRate: 0, // Not stored in current schema
      }));
    } catch (error) {
      logger.error('Error getting job workers:', error);
      throw error;
    }
  }
}

