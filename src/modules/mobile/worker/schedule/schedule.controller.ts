// Worker Schedule Controller

import { Request, Response, NextFunction } from 'express';
import { WorkerScheduleService } from './schedule.service';
import { successResponse } from '../../../../utils/response';
import { GetWorkerScheduleQuery } from './schedule.types';

export class WorkerScheduleController {
  private service: WorkerScheduleService;

  constructor() {
    this.service = new WorkerScheduleService();
  }

  /**
   * GET /mobile/worker/schedule
   * Get worker's schedule
   */
  getSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workerId = req.user!.id;
      const companyId = req.user!.companyId;

      const query: GetWorkerScheduleQuery = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const schedule = await this.service.getWorkerSchedule(workerId, companyId, query);
      successResponse(res, schedule);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/worker/schedule/today
   * Get today's jobs
   */
  getTodaysJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workerId = req.user!.id;
      const companyId = req.user!.companyId;

      const jobs = await this.service.getTodaysJobs(workerId, companyId);
      successResponse(res, jobs);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/worker/schedule/week
   * Get this week's jobs
   */
  getWeeksJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workerId = req.user!.id;
      const companyId = req.user!.companyId;

      const jobs = await this.service.getWeeksJobs(workerId, companyId);
      successResponse(res, jobs);
    } catch (error) {
      next(error);
    }
  };
}

