// Worker Jobs Controller

import { Request, Response, NextFunction } from 'express';
import { WorkerJobsService } from './jobs.service';
import { successResponse } from '../../../../utils/response';
import { ListWorkerJobsQuery, UpdateWorkerTaskRequest } from './jobs.types';
import { JobStatus, TaskStatus } from '../../../../types/enums';

export class WorkerJobsController {
  private service: WorkerJobsService;

  constructor() {
    this.service = new WorkerJobsService();
  }

  /**
   * GET /mobile/worker/jobs
   * List jobs assigned to the worker
   */
  listJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workerId = req.user!.id;
      const companyId = req.user!.companyId;

      const query: ListWorkerJobsQuery = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        status: req.query.status as JobStatus,
        siteId: req.query.siteId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const result = await this.service.listWorkerJobs(workerId, companyId, query);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/worker/jobs/:id
   * Get job details (only if assigned)
   */
  getJobById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const workerId = req.user!.id;
      const companyId = req.user!.companyId;

      const job = await this.service.getWorkerJobById(jobId, workerId, companyId);
      successResponse(res, job);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/worker/jobs/:id/tasks
   * Get tasks for a job
   */
  getJobTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const workerId = req.user!.id;
      const companyId = req.user!.companyId;

      const tasks = await this.service.getJobTasks(jobId, workerId, companyId);
      successResponse(res, tasks);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /mobile/worker/jobs/:id/tasks/:taskId
   * Update task status
   */
  updateTaskStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: jobId, taskId } = req.params;
      const workerId = req.user!.id;
      const companyId = req.user!.companyId;
      const data: UpdateWorkerTaskRequest = req.body;

      const task = await this.service.updateTaskStatus(jobId, taskId, workerId, companyId, data);
      successResponse(res, task, 'Task updated successfully');
    } catch (error) {
      next(error);
    }
  };
}

