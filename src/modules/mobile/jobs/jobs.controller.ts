// Mobile Jobs Controller

import { Request, Response, NextFunction } from 'express';
import { MobileJobsService } from './jobs.service';
import { successResponse } from '../../../utils/response';

export class MobileJobsController {
  private service: MobileJobsService;

  constructor() {
    this.service = new MobileJobsService();
  }

  /**
   * GET /mobile/jobs
   * List jobs with filters and pagination
   */
  listJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const query = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        status: req.query.status as string,
        priority: req.query.priority as string,
        siteId: req.query.siteId as string,
        assignedTo: req.query.assignedTo as string,
        jobType: req.query.jobType as string,
        search: req.query.search as string,
      };

      const result = await this.service.listJobs(companyId, query);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/jobs/:id
   * Get single job details
   */
  getJobById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const companyId = req.user!.companyId;

      const job = await this.service.getJobById(jobId, companyId);
      successResponse(res, job);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/jobs/:id/tasks
   * Get tasks for a job
   */
  getJobTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const companyId = req.user!.companyId;

      const tasks = await this.service.getJobTasks(jobId, companyId);
      successResponse(res, tasks);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /mobile/jobs/:id/tasks
   * Create a new task for a job
   */
  createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const companyId = req.user!.companyId;
      const userId = req.user!.id;

      const task = await this.service.createTask(jobId, companyId, userId, req.body);
      successResponse(res, task, 'Task created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /mobile/jobs/:id/tasks/:taskId
   * Update a task for a job
   */
  updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const taskId = req.params.taskId;
      const companyId = req.user!.companyId;

      const task = await this.service.updateTask(jobId, taskId, companyId, req.body);
      successResponse(res, task, 'Task updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /mobile/jobs/:id/tasks/:taskId
   * Delete a task from a job
   */
  deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const taskId = req.params.taskId;
      const companyId = req.user!.companyId;

      await this.service.deleteTask(jobId, taskId, companyId);
      successResponse(res, null, 'Task deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/jobs/:id/workers
   * Get workers assigned to a job
   */
  getJobWorkers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const companyId = req.user!.companyId;

      const workers = await this.service.getJobWorkers(jobId, companyId);
      successResponse(res, workers);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /mobile/jobs/:id/media/photos
   * Upload a photo for a job
   */
  uploadPhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const companyId = req.user!.companyId;
      const userId = req.user!.id;

      const photo = await this.service.uploadPhoto(jobId, companyId, userId, req.body);
      successResponse(res, photo, 'Photo uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/jobs/:id/media/photos
   * Get all photos for a job
   */
  getJobPhotos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const companyId = req.user!.companyId;

      const photos = await this.service.getJobPhotos(jobId, companyId);
      successResponse(res, photos);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /mobile/jobs/:id/media/photos/:photoId
   * Delete a photo from a job
   */
  deletePhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const photoId = req.params.photoId;
      const companyId = req.user!.companyId;

      await this.service.deletePhoto(jobId, photoId, companyId);
      successResponse(res, null, 'Photo deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /mobile/jobs/:id/media/documents
   * Upload a document for a job
   */
  uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const companyId = req.user!.companyId;
      const userId = req.user!.id;

      const document = await this.service.uploadDocument(jobId, companyId, userId, req.body);
      successResponse(res, document, 'Document uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/jobs/:id/media/documents
   * Get all documents for a job
   */
  getJobDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const companyId = req.user!.companyId;

      const documents = await this.service.getJobDocuments(jobId, companyId);
      successResponse(res, documents);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /mobile/jobs/:id/media/documents/:documentId
   * Delete a document from a job
   */
  deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const documentId = req.params.documentId;
      const companyId = req.user!.companyId;

      await this.service.deleteDocument(jobId, documentId, companyId);
      successResponse(res, null, 'Document deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}


