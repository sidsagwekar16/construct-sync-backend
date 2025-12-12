// Check-ins service - Business logic

import { CheckInsRepository } from './check-ins.repository';
import { JobsRepository } from '../jobs/jobs.repository';
import {
  CheckInRequest,
  CheckOutRequest,
  CheckInLogResponse,
  CheckInLogsQuery,
} from './check-ins.types';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../../types/errors';
import { logger } from '../../utils/logger';

export class CheckInsService {
  private repository: CheckInsRepository;
  private jobsRepository: JobsRepository;

  constructor() {
    this.repository = new CheckInsRepository();
    this.jobsRepository = new JobsRepository();
  }

  /**
   * Check in to a job
   */
  async checkIn(
    userId: string,
    companyId: string,
    data: CheckInRequest
  ): Promise<CheckInLogResponse> {
    // Check if user already has an active check-in
    const activeCheckIn = await this.repository.findActiveCheckIn(userId);
    if (activeCheckIn) {
      throw new ConflictError('You are already checked in. Please check out first.');
    }

    // Verify job exists and belongs to company
    const job = await this.jobsRepository.findJobById(data.job_id, companyId);
    if (!job) {
      throw new NotFoundError('Job not found or does not belong to your company');
    }

    // Verify user is assigned to the job (worker or manager)
    const isAssigned = await this.jobsRepository.isUserAssignedToJob(data.job_id, userId);
    if (!isAssigned) {
      throw new BadRequestError('You are not assigned to this job');
    }

    // Validate job schedule - check if current time is within job's start and end date
    const now = new Date();
    if (job.start_date && new Date(job.start_date) > now) {
      const startDate = new Date(job.start_date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      throw new BadRequestError(`This job hasn't started yet. It begins on ${startDate}.`);
    }
    if (job.end_date && new Date(job.end_date) < now) {
      const endDate = new Date(job.end_date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      throw new BadRequestError(`This job has expired. It ended on ${endDate}.`);
    }

    // Check job status - only allow check-in for active/in-progress jobs
    if (job.status !== 'in_progress' && job.status !== 'planned') {
      const statusMessages: Record<string, string> = {
        'completed': 'This job is already completed.',
        'cancelled': 'This job has been cancelled.',
        'on_hold': 'This job is currently on hold.',
        'archived': 'This job has been archived.',
        'draft': 'This job is still in draft status.',
      };
      const message = job.status ? (statusMessages[job.status] || `This job is not available (Status: ${job.status}).`) : 'This job is not available.';
      throw new BadRequestError(message);
    }

    // Geofencing validation - check if user is within site radius
    if (job.site_id) {
      const sitesRepository = new (await import('../sites/sites.repository')).SitesRepository();
      const site = await sitesRepository.findSiteById(job.site_id, companyId);
      
      if (site && site.latitude && site.longitude && site.radius) {
        // Log coordinates for debugging
        logger.info(`Geofence check - User coords: [${data.latitude}, ${data.longitude}], Site coords: [${site.latitude}, ${site.longitude}], Site radius: ${site.radius}m${data.accuracy !== undefined ? `, GPS accuracy: ${data.accuracy}m` : ''}`);
        
        const distance = this.calculateDistance(
          data.latitude,
          data.longitude,
          site.latitude,
          site.longitude
        );
        const accuracy = data.accuracy ?? null;
        const BUFFER_METERS = 25; // small grace to offset rounding
        const allowedRadius = site.radius + BUFFER_METERS;
        const effectiveDistance = accuracy ? Math.max(distance - accuracy, 0) : distance;

        logger.info(`Calculated distance: ${distance}m (rounded: ${Math.round(distance)}m)${accuracy !== null ? `, accuracy: ${accuracy}m, effective: ${Math.round(effectiveDistance)}m` : ''}`);
        
        if (effectiveDistance > allowedRadius) {
          logger.error(`Geofence violation - User: [${data.latitude}, ${data.longitude}], Site: [${site.latitude}, ${site.longitude}], Distance: ${Math.round(distance)}m, Accuracy: ${accuracy ?? 'n/a'}m, Allowed: ${site.radius}m`);
          const baseMsg = `You are too far from the job site. You must be within ${site.radius}m of the site location to check in. Current distance: ${Math.round(distance)}m`;
          const accuracyHint = accuracy && accuracy > site.radius
            ? ` GPS accuracy is about ${Math.round(accuracy)}m. Try improving GPS (open Maps, wait 30s, or move outdoors) and retry.`
            : '';
          throw new BadRequestError(baseMsg + accuracyHint);
        }
        
        logger.info(`User ${userId} location verified for job ${data.job_id}. Distance: ${Math.round(distance)}m (radius: ${site.radius}m)${accuracy !== null ? `, accuracy: ${Math.round(accuracy)}m, effective: ${Math.round(effectiveDistance)}m` : ''}`);
      }
    }

    // Get user's hourly rate from their profile
    const usersRepository = new (await import('../users/users.repository')).UsersRepository();
    const user = await usersRepository.findUserById(userId, companyId);
    const hourlyRate = user?.hourly_rate || null; // Use user's rate or null if not set

    // Create check-in log
    const checkInLog = await this.repository.createCheckIn(
      userId,
      data.job_id,
      hourlyRate,
      data.notes
    );

    logger.info(`User ${userId} checked in to job ${data.job_id}`);

    return this.mapCheckInLogToResponse(checkInLog, job.name, job.job_number || undefined);
  }

  /**
   * Check out from current job
   */
  async checkOut(
    userId: string,
    data: CheckOutRequest
  ): Promise<CheckInLogResponse> {
    // Find active check-in
    const activeCheckIn = await this.repository.findActiveCheckIn(userId);
    if (!activeCheckIn) {
      throw new BadRequestError('No active check-in found. Please check in first.');
    }

    // Perform check-out
    const updatedLog = await this.repository.checkOut(
      activeCheckIn.id,
      userId,
      data.notes
    );

    if (!updatedLog) {
      throw new BadRequestError('Failed to check out');
    }

    logger.info(`User ${userId} checked out from job ${updatedLog.job_id}. Duration: ${updatedLog.duration_hours} hours`);

    // Return basic check-in info without job details to avoid query issues
    return this.mapCheckInLogToResponse(
      updatedLog,
      undefined,
      undefined
    );
  }

  /**
   * Get active check-in for the current user
   */
  async getActiveCheckIn(userId: string): Promise<CheckInLogResponse | null> {
    const activeCheckIn = await this.repository.findActiveCheckIn(userId);
    if (!activeCheckIn) {
      return null;
    }

    // Return basic check-in info without job details to avoid query issues
    return this.mapCheckInLogToResponse(
      activeCheckIn,
      undefined,
      undefined
    );
  }

  /**
   * Get check-in history for the current user
   */
  async getUserCheckInHistory(
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ logs: CheckInLogResponse[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    const { logs, total } = await this.repository.getUserCheckInHistory(userId, limit, offset);

    // Map logs to response with job details from joined query
    const logsWithDetails = logs.map((log) => {
      return this.mapCheckInLogToResponse(
        log,
        log.job_name,
        log.job_number
      );
    });

    return {
      logs: logsWithDetails,
      total,
      page,
      limit,
    };
  }

  /**
   * List check-in logs with filters (admin/manager view)
   */
  async listCheckInLogs(
    companyId: string,
    query: CheckInLogsQuery
  ): Promise<{ logs: any[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const offset = (page - 1) * limit;

    const startDate = query.start_date ? new Date(query.start_date) : undefined;
    const endDate = query.end_date ? new Date(query.end_date) : undefined;
    const activeOnly = query.active_only === true;

    const { logs, total } = await this.repository.listCheckInLogs(
      companyId,
      query.user_id,
      query.job_id,
      startDate,
      endDate,
      activeOnly,
      limit,
      offset
    );

    // Map logs to response with user and job details already included from repository
    const logsWithDetails = logs.map((log) => {
      const userName = log.first_name && log.last_name 
        ? `${log.first_name} ${log.last_name}`.trim()
        : log.email;
      
      return {
        ...this.mapCheckInLogToResponse(
          log,
          log.job_name || undefined,
          log.job_number || undefined
        ),
        worker_name: userName,
        site_address: log.site_address || undefined,
      };
    });

    return {
      logs: logsWithDetails,
      total,
      page,
      limit,
    };
  }

  /**
   * Get total billable hours/amount for a user in a date range
   */
  async getUserBillables(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ totalHours: number; totalAmount: number }> {
    return await this.repository.getTotalBillableHours(userId, startDate, endDate);
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Map check-in log to response format
   */
  private mapCheckInLogToResponse(
    log: any,
    jobName?: string,
    jobNumber?: string
  ): CheckInLogResponse {
    return {
      id: log.id,
      user_id: log.user_id,
      job_id: log.job_id,
      job_name: jobName,
      job_number: jobNumber,
      check_in_time: log.check_in_time,
      check_out_time: log.check_out_time,
      duration_hours: log.duration_hours ? parseFloat(log.duration_hours) : null,
      hourly_rate: log.hourly_rate ? parseFloat(log.hourly_rate) : null,
      billable_amount: log.billable_amount ? parseFloat(log.billable_amount) : null,
      notes: log.notes,
      created_at: log.created_at,
      updated_at: log.updated_at,
    };
  }
}
