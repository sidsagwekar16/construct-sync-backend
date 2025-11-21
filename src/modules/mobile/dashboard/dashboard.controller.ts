// Mobile Dashboard Controller

import { Request, Response, NextFunction } from 'express';
import { MobileDashboardService } from './dashboard.service';
import { successResponse } from '../../../utils/response';

export class MobileDashboardController {
  private service: MobileDashboardService;

  constructor() {
    this.service = new MobileDashboardService();
  }

  /**
   * GET /mobile/dashboard/metrics
   * Get dashboard metrics for mobile admin
   */
  getMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const metrics = await this.service.getMetrics(companyId);
      successResponse(res, metrics);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/dashboard/activity
   * Get recent activity feed for mobile admin
   */
  getActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const activity = await this.service.getActivity(companyId, limit);
      successResponse(res, activity);
    } catch (error) {
      next(error);
    }
  };
}


