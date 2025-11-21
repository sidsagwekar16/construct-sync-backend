// Worker Profile Controller

import { Request, Response, NextFunction } from 'express';
import { WorkerProfileService } from './profile.service';
import { successResponse } from '../../../../utils/response';
import { UpdateWorkerProfileRequest } from './profile.types';

export class WorkerProfileController {
  private service: WorkerProfileService;

  constructor() {
    this.service = new WorkerProfileService();
  }

  /**
   * GET /mobile/worker/profile
   * Get worker profile
   */
  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workerId = req.user!.id;
      const companyId = req.user!.companyId;

      const profile = await this.service.getWorkerProfile(workerId, companyId);
      successResponse(res, profile);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /mobile/worker/profile
   * Update worker profile
   */
  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workerId = req.user!.id;
      const companyId = req.user!.companyId;
      const data: UpdateWorkerProfileRequest = req.body;

      const profile = await this.service.updateWorkerProfile(workerId, companyId, data);
      successResponse(res, profile, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/worker/profile/stats
   * Get worker statistics
   */
  getStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workerId = req.user!.id;
      const companyId = req.user!.companyId;

      const stats = await this.service.getWorkerStatistics(workerId, companyId);
      successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  };
}

