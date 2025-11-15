// Jobs service - Business logic

import { JobsRepository } from './jobs.repository';
import {
  CreateJobRequest,
  UpdateJobRequest,
  JobResponse,
  ListJobsQuery,
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
      query.siteId,
      limit,
      offset
    );

    const jobResponses = jobs.map(this.mapJobToResponse);

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

    return this.mapJobToResponse(job);
  }

  /**
   * Create a new job
   */
  async createJob(
    companyId: string,
    data: CreateJobRequest
  ): Promise<JobResponse> {
    // Validate site if provided
    if (data.siteId) {
      const siteExists = await this.repository.verifySiteCompany(data.siteId, companyId);
      if (!siteExists) {
        throw new BadRequestError('Site does not exist or does not belong to your company');
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
      data.name,
      data.description,
      data.jobNumber,
      data.siteId,
      data.status,
      data.startDate ? new Date(data.startDate) : undefined,
      data.endDate ? new Date(data.endDate) : undefined
    );

    logger.info(`Job created: ${job.name} (${job.id}) for company ${companyId}`);

    return this.mapJobToResponse(job);
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
      siteId: data.siteId,
      status: data.status,
      startDate: data.startDate !== undefined 
        ? (data.startDate ? new Date(data.startDate) : null) 
        : undefined,
      endDate: data.endDate !== undefined 
        ? (data.endDate ? new Date(data.endDate) : null) 
        : undefined,
    });

    if (!updatedJob) {
      throw new NotFoundError('Job not found');
    }

    logger.info(`Job updated: ${updatedJob.name} (${updatedJob.id})`);

    return this.mapJobToResponse(updatedJob);
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
    return jobs.map(this.mapJobToResponse);
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
    return jobs.map(this.mapJobToResponse);
  }

  /**
   * Helper: Map job entity to response
   */
  private mapJobToResponse(job: any): JobResponse {
    return {
      id: job.id,
      companyId: job.company_id,
      siteId: job.site_id,
      jobNumber: job.job_number,
      name: job.name,
      description: job.description,
      status: job.status,
      startDate: job.start_date,
      endDate: job.end_date,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    };
  }
}
