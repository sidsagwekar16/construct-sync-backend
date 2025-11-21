// Mobile Sites Controller

import { Request, Response, NextFunction } from 'express';
import { MobileSitesService } from './sites.service';
import { successResponse } from '../../../utils/response';

export class MobileSitesController {
  private service: MobileSitesService;

  constructor() {
    this.service = new MobileSitesService();
  }

  /**
   * GET /mobile/sites
   * List sites with job/worker counts
   */
  listSites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const query = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        status: req.query.status as string,
        search: req.query.search as string,
      };

      const result = await this.service.listSites(companyId, query);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/sites/:id
   * Get site details
   */
  getSiteById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.id;
      const companyId = req.user!.companyId;

      const site = await this.service.getSiteById(siteId, companyId);
      successResponse(res, site);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/sites/:id/jobs
   * Get jobs at a site
   */
  getSiteJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.id;
      const companyId = req.user!.companyId;

      const jobs = await this.service.getSiteJobs(siteId, companyId);
      successResponse(res, jobs);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/sites/:id/workers
   * Get workers at a site
   */
  getSiteWorkers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.id;
      const companyId = req.user!.companyId;

      const workers = await this.service.getSiteWorkers(siteId, companyId);
      successResponse(res, workers);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /mobile/sites/:id/media
   * Upload media for a site
   */
  uploadMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.id;
      const companyId = req.user!.companyId;
      const userId = req.user!.id;

      const media = await this.service.uploadMedia(siteId, companyId, userId, req.body);
      successResponse(res, media, 'Media uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /mobile/sites/:id/media/:mediaId
   * Delete media from a site
   */
  deleteMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.id;
      const mediaId = req.params.mediaId;
      const companyId = req.user!.companyId;

      await this.service.deleteMedia(siteId, mediaId, companyId);
      successResponse(res, null, 'Media deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /mobile/sites/:id/memos/:memoId
   * Update a memo
   */
  updateMemo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.id;
      const memoId = req.params.memoId;
      const companyId = req.user!.companyId;

      const memo = await this.service.updateMemo(siteId, memoId, companyId, req.body);
      successResponse(res, memo, 'Memo updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /mobile/sites/:id/memos/:memoId
   * Delete a memo
   */
  deleteMemo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.id;
      const memoId = req.params.memoId;
      const companyId = req.user!.companyId;

      await this.service.deleteMemo(siteId, memoId, companyId);
      successResponse(res, null, 'Memo deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}


