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
      
      // Get photos for this job
      const photosResult = await db.query(
        `SELECT 
          id,
          job_id,
          photo_url,
          caption,
          uploaded_by,
          created_at
         FROM job_photos
         WHERE job_id = $1 AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [jobId]
      );
      
      // Get documents for this job
      const documentsResult = await db.query(
        `SELECT 
          id,
          job_id,
          document_name,
          document_url,
          document_type,
          uploaded_by,
          created_at
         FROM job_documents
         WHERE job_id = $1 AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [jobId]
      );
      
      // Get workers assigned to this job
      const workersResult = await db.query(
        `SELECT 
          u.id,
          u.first_name as "firstName",
          u.last_name as "lastName",
          u.email,
          u.role
         FROM job_workers jw
         INNER JOIN users u ON jw.user_id = u.id
         WHERE jw.job_id = $1 AND u.deleted_at IS NULL`,
        [jobId]
      );
      
      // Get managers assigned to this job
      const managersResult = await db.query(
        `SELECT 
          u.id,
          u.first_name as "firstName",
          u.last_name as "lastName",
          u.email,
          u.role
         FROM job_managers jm
         INNER JOIN users u ON jm.user_id = u.id
         WHERE jm.job_id = $1 AND u.deleted_at IS NULL`,
        [jobId]
      );
      
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
        photos: photosResult.rows.map((p: any) => ({
          id: p.id,
          jobId: p.job_id,
          photoUrl: p.photo_url,
          caption: p.caption,
          uploadedBy: p.uploaded_by,
          createdAt: p.created_at,
        })),
        documents: documentsResult.rows.map((d: any) => ({
          id: d.id,
          jobId: d.job_id,
          documentName: d.document_name,
          documentUrl: d.document_url,
          documentType: d.document_type,
          uploadedBy: d.uploaded_by,
          createdAt: d.created_at,
        })),
        workers: workersResult.rows,
        managers: managersResult.rows,
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
   * Update a task for a job
   */
  async updateTask(jobId: string, taskId: string, companyId: string, taskData: any): Promise<any> {
    try {
      // Verify job exists and belongs to company
      const jobCheck = await db.query(
        'SELECT id FROM jobs WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL',
        [jobId, companyId]
      );

      if (jobCheck.rows.length === 0) {
        throw new NotFoundError('Job not found');
      }

      // Verify task exists and belongs to this job
      const taskCheck = await db.query(
        'SELECT id FROM job_tasks WHERE id = $1 AND job_id = $2 AND deleted_at IS NULL',
        [taskId, jobId]
      );

      if (taskCheck.rows.length === 0) {
        throw new NotFoundError('Task not found');
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (taskData.name !== undefined) {
        updates.push(`title = $${paramIndex}`);
        values.push(taskData.name);
        paramIndex++;
      }
      if (taskData.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        values.push(taskData.description);
        paramIndex++;
      }
      if (taskData.status !== undefined) {
        updates.push(`status = $${paramIndex}`);
        values.push(taskData.status);
        paramIndex++;
      }
      if (taskData.priority !== undefined) {
        updates.push(`priority = $${paramIndex}`);
        values.push(taskData.priority);
        paramIndex++;
      }
      if (taskData.assignedTo !== undefined) {
        updates.push(`assigned_to = $${paramIndex}`);
        values.push(taskData.assignedTo);
        paramIndex++;
      }
      if (taskData.dueDate !== undefined) {
        updates.push(`due_date = $${paramIndex}`);
        values.push(taskData.dueDate);
        paramIndex++;
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(taskId);

      const result = await db.query(
        `UPDATE job_tasks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      const task = result.rows[0];
      return {
        id: task.id,
        name: task.title,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assigned_to,
        dueDate: task.due_date,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      };
    } catch (error) {
      logger.error('Error updating task:', error);
      throw error;
    }
  }

  /**
   * Delete a task (soft delete)
   */
  async deleteTask(jobId: string, taskId: string, companyId: string): Promise<void> {
    try {
      // Verify job exists and belongs to company
      const jobCheck = await db.query(
        'SELECT id FROM jobs WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL',
        [jobId, companyId]
      );

      if (jobCheck.rows.length === 0) {
        throw new NotFoundError('Job not found');
      }

      // Verify task exists and belongs to this job
      const taskCheck = await db.query(
        'SELECT id FROM job_tasks WHERE id = $1 AND job_id = $2 AND deleted_at IS NULL',
        [taskId, jobId]
      );

      if (taskCheck.rows.length === 0) {
        throw new NotFoundError('Task not found');
      }

      // Soft delete the task
      await db.query(
        'UPDATE job_tasks SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
        [taskId]
      );

      logger.info(`Task deleted: ${taskId} from job ${jobId}`);
    } catch (error) {
      logger.error('Error deleting task:', error);
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

  /**
   * Upload a photo for a job
   */
  async uploadPhoto(jobId: string, companyId: string, userId: string, data: any): Promise<any> {
    try {
      await this.verifyJobAccess(jobId, companyId);

      const result = await db.query(
        `INSERT INTO job_photos (job_id, uploaded_by, photo_url, thumbnail_url, caption)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [jobId, userId, data.photoUrl, data.thumbnailUrl || null, data.caption || null]
      );

      const photo = result.rows[0];
      return {
        id: photo.id,
        jobId: photo.job_id,
        uploadedBy: photo.uploaded_by,
        photoUrl: photo.photo_url,
        thumbnailUrl: photo.thumbnail_url,
        caption: photo.caption,
        createdAt: photo.created_at,
      };
    } catch (error) {
      logger.error('Error uploading photo:', error);
      throw error;
    }
  }

  /**
   * Get all photos for a job
   */
  async getJobPhotos(jobId: string, companyId: string): Promise<any[]> {
    try {
      await this.verifyJobAccess(jobId, companyId);

      const result = await db.query(
        `SELECT 
          p.*,
          u.first_name || ' ' || u.last_name as uploaded_by_name
         FROM job_photos p
         LEFT JOIN users u ON p.uploaded_by = u.id
         WHERE p.job_id = $1 AND p.deleted_at IS NULL
         ORDER BY p.created_at DESC`,
        [jobId]
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        jobId: row.job_id,
        uploadedBy: row.uploaded_by,
        uploadedByName: row.uploaded_by_name,
        photoUrl: row.photo_url,
        thumbnailUrl: row.thumbnail_url,
        caption: row.caption,
        createdAt: row.created_at,
      }));
    } catch (error) {
      logger.error('Error getting job photos:', error);
      throw error;
    }
  }

  /**
   * Delete a photo from a job
   */
  async deletePhoto(jobId: string, photoId: string, companyId: string): Promise<void> {
    try {
      await this.verifyJobAccess(jobId, companyId);

      const checkResult = await db.query(
        'SELECT id FROM job_photos WHERE id = $1 AND job_id = $2 AND deleted_at IS NULL',
        [photoId, jobId]
      );

      if (checkResult.rows.length === 0) {
        throw new NotFoundError('Photo not found');
      }

      await db.query('UPDATE job_photos SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [photoId]);
      logger.info(`Photo deleted: ${photoId} from job ${jobId}`);
    } catch (error) {
      logger.error('Error deleting photo:', error);
      throw error;
    }
  }

  /**
   * Upload a document for a job
   */
  async uploadDocument(jobId: string, companyId: string, userId: string, data: any): Promise<any> {
    try {
      await this.verifyJobAccess(jobId, companyId);

      const result = await db.query(
        `INSERT INTO job_documents (job_id, uploaded_by, document_name, document_url, document_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [jobId, userId, data.documentName, data.documentUrl, data.documentType || null]
      );

      const document = result.rows[0];
      return {
        id: document.id,
        jobId: document.job_id,
        uploadedBy: document.uploaded_by,
        documentName: document.document_name,
        documentUrl: document.document_url,
        documentType: document.document_type,
        createdAt: document.created_at,
      };
    } catch (error) {
      logger.error('Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Get all documents for a job
   */
  async getJobDocuments(jobId: string, companyId: string): Promise<any[]> {
    try {
      await this.verifyJobAccess(jobId, companyId);

      const result = await db.query(
        `SELECT 
          d.*,
          u.first_name || ' ' || u.last_name as uploaded_by_name
         FROM job_documents d
         LEFT JOIN users u ON d.uploaded_by = u.id
         WHERE d.job_id = $1 AND d.deleted_at IS NULL
         ORDER BY d.created_at DESC`,
        [jobId]
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        jobId: row.job_id,
        uploadedBy: row.uploaded_by,
        uploadedByName: row.uploaded_by_name,
        documentName: row.document_name,
        documentUrl: row.document_url,
        documentType: row.document_type,
        createdAt: row.created_at,
      }));
    } catch (error) {
      logger.error('Error getting job documents:', error);
      throw error;
    }
  }

  /**
   * Delete a document from a job
   */
  async deleteDocument(jobId: string, documentId: string, companyId: string): Promise<void> {
    try {
      await this.verifyJobAccess(jobId, companyId);

      const checkResult = await db.query(
        'SELECT id FROM job_documents WHERE id = $1 AND job_id = $2 AND deleted_at IS NULL',
        [documentId, jobId]
      );

      if (checkResult.rows.length === 0) {
        throw new NotFoundError('Document not found');
      }

      await db.query('UPDATE job_documents SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [documentId]);
      logger.info(`Document deleted: ${documentId} from job ${jobId}`);
    } catch (error) {
      logger.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Helper method to verify job access
   */
  private async verifyJobAccess(jobId: string, companyId: string): Promise<void> {
    const result = await db.query(
      'SELECT id FROM jobs WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL',
      [jobId, companyId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Job not found');
    }
  }
}

