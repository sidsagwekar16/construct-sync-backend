// Check-ins controller - Request handlers

import { Request, Response, NextFunction } from 'express';
import { CheckInsService } from './check-ins.service';
import { successResponse } from '../../utils/response';
import {
  CheckInRequest,
  CheckOutRequest,
  CheckInLogsQuery,
} from './check-ins.types';

export class CheckInsController {
  private service: CheckInsService;

  constructor() {
    this.service = new CheckInsService();
  }

  /**
   * POST /api/check-ins/check-in
   * Check in to a job
   */
  checkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const companyId = req.user!.companyId;
      const data: CheckInRequest = req.body;

      const result = await this.service.checkIn(userId, companyId, data);
      successResponse(res, result, 'Checked in successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/check-ins/check-out
   * Check out from current job
   */
  checkOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const data: CheckOutRequest = req.body;

      const result = await this.service.checkOut(userId, data);
      successResponse(res, result, 'Checked out successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/check-ins/active
   * Get active check-in for the current user
   */
  getActiveCheckIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;

      const result = await this.service.getActiveCheckIn(userId);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/check-ins/history
   * Get check-in history for the current user
   */
  getUserHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await this.service.getUserCheckInHistory(userId, page, limit);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/check-ins
   * List all check-in logs (admin/manager view)
   */
  listCheckIns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const query: CheckInLogsQuery = {
        user_id: req.query.user_id as string,
        job_id: req.query.job_id as string,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        active_only: req.query.active_only === 'true',
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      };

      const result = await this.service.listCheckInLogs(companyId, query);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/check-ins/billables
   * Get total billable hours/amount for a user in a date range
   */
  getUserBillables = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.query.user_id as string || req.user!.id;
      const startDate = new Date(req.query.start_date as string);
      const endDate = new Date(req.query.end_date as string);

      const result = await this.service.getUserBillables(userId, startDate, endDate);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };
}
