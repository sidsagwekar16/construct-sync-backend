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
}


