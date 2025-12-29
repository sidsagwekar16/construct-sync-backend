// Jobs service - Business logic

import { JobsRepository } from './jobs.repository';
import {
  CreateJobRequest,
  UpdateJobRequest,
  JobResponse,
  ListJobsQuery,
  Job,
} from './jobs.types';
import { JobStatus } from '../../types/enums';
import {
  NotFoundError,
  BadRequestError,
} from '../../types/errors';
import { logger } from '../../utils/logger';

export class JobsService {
  private repository: JobsRepository;

  constructor() {
    this.repository = new JobsRepository();
  }

  /**
   * List all jobs for a company with pagination and search
   */
  async listJobs(
    companyId: string,
    query: ListJobsQuery
  ): Promise<{ jobs: JobResponse[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    const { jobs, total } = await this.repository.findJobsByCompany(
      companyId,
      query.search,
      query.status,
      query.priority,
      query.siteId,
      query.assignedTo,
      query.jobType,
      limit,
      offset
    );

    // Populate relationships for all jobs
    const jobResponses = await Promise.all(
      jobs.map(job => this.mapJobToResponseWithRelations(job))
    );

    return {
      jobs: jobResponses,
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single job by ID
   */
  async getJobById(
    jobId: string,
    companyId: string
  ): Promise<JobResponse> {
    const job = await this.repository.findJobById(jobId, companyId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    return await this.mapJobToResponseWithRelations(job);
  }

  /**
   * Create a new job
   */
  async createJob(
    companyId: string,
    createdBy: string,
    data: CreateJobRequest
  ): Promise<JobResponse> {
    // Validate site if provided
    if (data.siteId) {
      const siteExists = await this.repository.verifySiteCompany(data.siteId, companyId);
      if (!siteExists) {
        throw new BadRequestError('Site does not exist or does not belong to your company');
      }
    }

    // Validate assigned user if provided
    if (data.assignedTo) {
      const userExists = await this.repository.verifyUserCompany(data.assignedTo, companyId);
      if (!userExists) {
        throw new BadRequestError('Assigned user does not exist or does not belong to your company');
      }
    }

    // Validate dates if both provided
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (end < start) {
        throw new BadRequestError('End date must be after start date');
      }
    }

    const job = await this.repository.createJob(
      companyId,
      createdBy,
      data.name,
      data.description,
      data.jobNumber,
      data.jobType,
      data.siteId,
      data.status,
      data.priority,
      data.startDate ? new Date(data.startDate) : undefined,
      data.endDate ? new Date(data.endDate) : undefined,
      data.completedDate ? new Date(data.completedDate) : undefined,
      data.assignedTo
    );

    logger.info(`Job created: ${job.name} (${job.id}) for company ${companyId}`);

    return await this.mapJobToResponseWithRelations(job);
  }

  /**
   * Update a job
   */
  async updateJob(
    jobId: string,
    companyId: string,
    data: UpdateJobRequest
  ): Promise<JobResponse> {
    const job = await this.repository.findJobById(jobId, companyId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Validate site if being updated
    if (data.siteId !== undefined && data.siteId !== null) {
      const siteExists = await this.repository.verifySiteCompany(data.siteId, companyId);
      if (!siteExists) {
        throw new BadRequestError('Site does not exist or does not belong to your company');
      }
    }

    // Validate assigned user if being updated
    if (data.assignedTo !== undefined && data.assignedTo !== null) {
      const userExists = await this.repository.verifyUserCompany(data.assignedTo, companyId);
      if (!userExists) {
        throw new BadRequestError('Assigned user does not exist or does not belong to your company');
      }
    }

    // Validate worker IDs if provided
    if (data.workerIds !== undefined) {
      if (data.workerIds && data.workerIds.length > 0) {
        for (const workerId of data.workerIds) {
          const exists = await this.repository.verifyUserCompany(workerId, companyId);
          if (!exists) {
            throw new BadRequestError(`Worker ${workerId} does not exist or does not belong to your company`);
          }
        }
      }
    }

    // Validate manager IDs if provided
    if (data.managerIds !== undefined) {
      if (data.managerIds && data.managerIds.length > 0) {
        for (const managerId of data.managerIds) {
          const exists = await this.repository.verifyUserCompany(managerId, companyId);
          if (!exists) {
            throw new BadRequestError(`Manager ${managerId} does not exist or does not belong to your company`);
          }
        }
      }
    }

    // Validate dates if updating
    if (data.startDate !== undefined || data.endDate !== undefined) {
      const newStartDate = data.startDate !== undefined 
        ? (data.startDate ? new Date(data.startDate) : null)
        : job.start_date;
      const newEndDate = data.endDate !== undefined 
        ? (data.endDate ? new Date(data.endDate) : null)
        : job.end_date;

      if (newStartDate && newEndDate && newEndDate < newStartDate) {
        throw new BadRequestError('End date must be after start date');
      }
    }

    const updatedJob = await this.repository.updateJob(jobId, companyId, {
      name: data.name,
      description: data.description,
      jobNumber: data.jobNumber,
      jobType: data.jobType,
      siteId: data.siteId,
      status: data.status,
      priority: data.priority,
      startDate: data.startDate !== undefined 
        ? (data.startDate ? new Date(data.startDate) : null) 
        : undefined,
      endDate: data.endDate !== undefined 
        ? (data.endDate ? new Date(data.endDate) : null) 
        : undefined,
      completedDate: data.completedDate !== undefined 
        ? (data.completedDate ? new Date(data.completedDate) : null) 
        : undefined,
      assignedTo: data.assignedTo,
    });

    if (!updatedJob) {
      throw new NotFoundError('Job not found');
    }

    // Update workers if provided
    if (data.workerIds !== undefined) {
      await this.repository.removeAllWorkers(jobId);
      if (data.workerIds && data.workerIds.length > 0) {
        await this.repository.addWorkers(jobId, data.workerIds);
      }
    }

    // Update managers if provided
    if (data.managerIds !== undefined) {
      await this.repository.removeAllManagers(jobId);
      if (data.managerIds && data.managerIds.length > 0) {
        await this.repository.addManagers(jobId, data.managerIds);
      }
    }

    logger.info(`Job updated: ${updatedJob.name} (${updatedJob.id})`);

    return await this.mapJobToResponseWithRelations(updatedJob);
  }

  /**
   * Delete a job (soft delete)
   */
  async deleteJob(jobId: string, companyId: string): Promise<void> {
    const job = await this.repository.findJobById(jobId, companyId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    const deleted = await this.repository.deleteJob(jobId, companyId);
    if (!deleted) {
      throw new NotFoundError('Job not found');
    }

    logger.info(`Job deleted: ${job.name} (${jobId})`);
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(
    companyId: string,
    status: JobStatus
  ): Promise<JobResponse[]> {
    const jobs = await this.repository.getJobsByStatus(companyId, status);
    return await Promise.all(jobs.map(job => this.mapJobToResponseWithRelations(job)));
  }

  /**
   * Get job statistics by status
   */
  async getJobStatistics(companyId: string): Promise<{
    total: number;
    byStatus: { [key in JobStatus]?: number };
  }> {
    const statusCounts = await this.repository.countJobsByStatus(companyId);

    const byStatus: { [key in JobStatus]?: number } = {};
    let total = 0;

    statusCounts.forEach((count, status) => {
      byStatus[status] = count;
      total += count;
    });

    return { total, byStatus };
  }

  /**
   * Get jobs by site
   */
  async getJobsBySite(
    companyId: string,
    siteId: string
  ): Promise<JobResponse[]> {
    // Verify site exists and belongs to company
    const siteExists = await this.repository.verifySiteCompany(siteId, companyId);
    if (!siteExists) {
      throw new NotFoundError('Site not found');
    }

    const jobs = await this.repository.getJobsBySite(companyId, siteId);
    return await Promise.all(jobs.map(job => this.mapJobToResponseWithRelations(job)));
  }

  /**
   * Archive a job
   */
  async archiveJob(jobId: string, companyId: string): Promise<JobResponse> {
    const job = await this.repository.findJobById(jobId, companyId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.status === JobStatus.ARCHIVED) {
      throw new BadRequestError('Job is already archived');
    }

    const archivedJob = await this.repository.archiveJob(jobId, companyId);
    if (!archivedJob) {
      throw new NotFoundError('Job not found');
    }

    logger.info(`Job archived: ${archivedJob.name} (${jobId})`);

    return await this.mapJobToResponseWithRelations(archivedJob);
  }

  /**
   * Unarchive a job
   */
  async unarchiveJob(jobId: string, companyId: string): Promise<JobResponse> {
    const job = await this.repository.findJobById(jobId, companyId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.status !== JobStatus.ARCHIVED) {
      throw new BadRequestError('Job is not archived');
    }

    const unarchivedJob = await this.repository.unarchiveJob(jobId, companyId);
    if (!unarchivedJob) {
      throw new NotFoundError('Job not found');
    }

    logger.info(`Job unarchived: ${unarchivedJob.name} (${jobId})`);

    return await this.mapJobToResponseWithRelations(unarchivedJob);
  }

  /**
   * Helper: Map job entity to response with populated relationships
   */
  private async mapJobToResponseWithRelations(job: Job): Promise<JobResponse> {
    const response: JobResponse = {
      id: job.id,
      companyId: job.company_id,
      siteId: job.site_id,
      jobNumber: job.job_number,
      name: job.name,
      description: job.description,
      jobType: job.job_type,
      status: job.status,
      priority: job.priority,
      startDate: job.start_date,
      endDate: job.end_date,
      completedDate: job.completed_date,
      assignedTo: job.assigned_to,
      createdBy: job.created_by,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    };

    // Populate assigned user
    if (job.assigned_to) {
      const assignedUser = await this.repository.getUserDetails(job.assigned_to);
      response.assignedToUser = assignedUser || undefined;
    }

    // Populate created by user
    const createdByUser = await this.repository.getUserDetails(job.created_by);
    response.createdByUser = createdByUser || undefined;

    // Populate workers
    response.workers = await this.repository.getJobWorkersWithDetails(job.id);

    // Populate managers
    response.managers = await this.repository.getJobManagersWithDetails(job.id);

    // Populate photos
    try {
      const photosResult = await this.repository.getJobPhotos(job.id);
      response.photos = photosResult || [];
    } catch (error) {
      response.photos = [];
    }

    // Populate documents
    try {
      const documentsResult = await this.repository.getJobDocuments(job.id);
      response.documents = documentsResult || [];
    } catch (error) {
      response.documents = [];
    }

    return response;
  }

  /**
   * Assign workers to an existing job
   */
  async assignWorkersToJob(
    jobId: string,
    companyId: string,
    workerIds: string[]
  ): Promise<JobResponse> {
    const job = await this.repository.findJobById(jobId, companyId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Validate worker IDs
    for (const workerId of workerIds) {
      const exists = await this.repository.verifyUserCompany(workerId, companyId);
      if (!exists) {
        throw new BadRequestError(`Worker ${workerId} does not exist or does not belong to your company`);
      }
    }

    // Replace existing workers
    await this.repository.removeAllWorkers(jobId);
    await this.repository.addWorkers(jobId, workerIds);

    logger.info(`Workers assigned to job: ${job.name} (${jobId})`);
    return await this.mapJobToResponseWithRelations(job);
  }

  /**
   * Assign managers to an existing job
   */
  async assignManagersToJob(
    jobId: string,
    companyId: string,
    managerIds: string[]
  ): Promise<JobResponse> {
    const job = await this.repository.findJobById(jobId, companyId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Validate manager IDs
    for (const managerId of managerIds) {
      const exists = await this.repository.verifyUserCompany(managerId, companyId);
      if (!exists) {
        throw new BadRequestError(`Manager ${managerId} does not exist or does not belong to your company`);
      }
    }

    // Replace existing managers
    await this.repository.removeAllManagers(jobId);
    await this.repository.addManagers(jobId, managerIds);

    logger.info(`Managers assigned to job: ${job.name} (${jobId})`);
    return await this.mapJobToResponseWithRelations(job);
  }
}
