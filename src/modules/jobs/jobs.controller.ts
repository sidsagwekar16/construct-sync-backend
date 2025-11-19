// Jobs controller - Request handlers

import { Request, Response, NextFunction } from 'express';
import { JobsService } from './jobs.service';
import { successResponse } from '../../utils/response';
import {
  CreateJobRequest,
  UpdateJobRequest,
  ListJobsQuery,
} from './jobs.types';
import { JobStatus } from '../../types/enums';

export class JobsController {
  private service: JobsService;

  constructor() {
    this.service = new JobsService();
  }

  /**
   * GET /api/jobs
   * List all jobs for the authenticated user's company
   */
  listJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const query: ListJobsQuery = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        search: req.query.search as string,
        status: req.query.status as JobStatus,
        siteId: req.query.siteId as string,
        assignedTo: req.query.assignedTo as string,
        jobType: req.query.jobType as string,
        priority: req.query.priority as any,
      };

      const result = await this.service.listJobs(companyId, query);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/jobs/:id
   * Get a single job by ID
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
   * POST /api/jobs
   * Create a new job
   */
  createJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const createdBy = req.user!.id;
      const data: CreateJobRequest = req.body;

      const job = await this.service.createJob(companyId, createdBy, data);
      successResponse(res, job, 'Job created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/jobs/:id
   * Update a job
   */
  updateJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const companyId = req.user!.companyId;
      const data: UpdateJobRequest = req.body;

      const job = await this.service.updateJob(jobId, companyId, data);
      successResponse(res, job, 'Job updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/jobs/:id
   * Delete a job (soft delete)
   */
  deleteJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const companyId = req.user!.companyId;

      await this.service.deleteJob(jobId, companyId);
      successResponse(res, null, 'Job deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/jobs/statistics
   * Get job statistics by status
   */
  getJobStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;

      const statistics = await this.service.getJobStatistics(companyId);
      successResponse(res, statistics);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/jobs/by-site/:siteId
   * Get all jobs for a specific site
   */
  getJobsBySite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const siteId = req.params.siteId;

      const jobs = await this.service.getJobsBySite(companyId, siteId);
      successResponse(res, jobs);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/jobs/:id/archive
   * Archive a job
   */
  archiveJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const companyId = req.user!.companyId;

      const job = await this.service.archiveJob(jobId, companyId);
      successResponse(res, job, 'Job archived successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/jobs/:id/unarchive
   * Unarchive a job
   */
  unarchiveJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const companyId = req.user!.companyId;

      const job = await this.service.unarchiveJob(jobId, companyId);
      successResponse(res, job, 'Job unarchived successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/jobs/:id/workers
   * Assign workers to an existing job
   */
  assignWorkers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const companyId = req.user!.companyId;
      const { workerIds } = req.body;

      const job = await this.service.assignWorkersToJob(jobId, companyId, workerIds);
      successResponse(res, job, 'Workers assigned successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/jobs/:id/managers
   * Assign managers to an existing job
   */
  assignManagers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.id;
      const companyId = req.user!.companyId;
      const { managerIds } = req.body;

      const job = await this.service.assignManagersToJob(jobId, companyId, managerIds);
      successResponse(res, job, 'Managers assigned successfully');
    } catch (error) {
      next(error);
    }
  };
}
