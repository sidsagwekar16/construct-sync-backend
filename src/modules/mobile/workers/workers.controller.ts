// Mobile Workers Controller

import { Request, Response, NextFunction } from 'express';
import { MobileWorkersService } from './workers.service';
import { successResponse } from '../../../utils/response';

export class MobileWorkersController {
  private service: MobileWorkersService;

  constructor() {
    this.service = new MobileWorkersService();
  }

  /**
   * GET /mobile/workers
   * List workers for assignment dropdowns
   */
  listWorkers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const role = req.query.role as string;
      const status = req.query.status as string;

      const workers = await this.service.listWorkers(companyId, role, status);
      successResponse(res, workers);
    } catch (error) {
      next(error);
    }
  };
}


