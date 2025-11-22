// Worker Sites Controller

import { Request, Response, NextFunction } from 'express';
import { WorkerSitesService } from './sites.service';
import { successResponse } from '../../../../utils/response';
import { ListWorkerSitesQuery } from './sites.types';
import { SiteStatus } from '../../../../types/enums';

export class WorkerSitesController {
  private service: WorkerSitesService;

  constructor() {
    this.service = new WorkerSitesService();
  }

  /**
   * GET /mobile/worker/sites
   * List sites where worker has assigned jobs
   */
  listSites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workerId = req.user!.id;
      const companyId = req.user!.companyId;

      const query: ListWorkerSitesQuery = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        status: req.query.status as SiteStatus,
        search: req.query.search as string,
      };

      const result = await this.service.listWorkerSites(workerId, companyId, query);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/worker/sites/:id
   * Get site details
   */
  getSiteById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.id;
      const workerId = req.user!.id;
      const companyId = req.user!.companyId;

      const site = await this.service.getWorkerSiteById(siteId, workerId, companyId);
      successResponse(res, site);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/worker/sites/:id/jobs
   * Get worker's jobs at a site
   */
  getSiteJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.id;
      const workerId = req.user!.id;
      const companyId = req.user!.companyId;

      const jobs = await this.service.getWorkerSiteJobs(siteId, workerId, companyId);
      successResponse(res, jobs);
    } catch (error) {
      next(error);
    }
  };
}



