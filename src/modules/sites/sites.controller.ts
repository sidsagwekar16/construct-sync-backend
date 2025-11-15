// Sites controller - Request handlers

import { Request, Response, NextFunction } from 'express';
import { SitesService } from './sites.service';
import { successResponse } from '../../utils/response';
import {
  CreateSiteRequest,
  UpdateSiteRequest,
  ListSitesQuery,
} from './sites.types';
import { SiteStatus } from '../../types/enums';

export class SitesController {
  private service: SitesService;

  constructor() {
    this.service = new SitesService();
  }

  /**
   * GET /api/sites
   * List all sites for the authenticated user's company
   */
  listSites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const query: ListSitesQuery = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        search: req.query.search as string,
        status: req.query.status as SiteStatus,
      };

      const result = await this.service.listSites(companyId, query);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/sites/:id
   * Get a single site by ID
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
   * POST /api/sites
   * Create a new site
   */
  createSite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const data: CreateSiteRequest = req.body;

      const site = await this.service.createSite(companyId, data);
      successResponse(res, site, 'Site created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/sites/:id
   * Update a site
   */
  updateSite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.id;
      const companyId = req.user!.companyId;
      const data: UpdateSiteRequest = req.body;

      const site = await this.service.updateSite(siteId, companyId, data);
      successResponse(res, site, 'Site updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/sites/:id
   * Delete a site (soft delete)
   */
  deleteSite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.id;
      const companyId = req.user!.companyId;

      await this.service.deleteSite(siteId, companyId);
      successResponse(res, null, 'Site deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/sites/statistics
   * Get site statistics by status
   */
  getSiteStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;

      const statistics = await this.service.getSiteStatistics(companyId);
      successResponse(res, statistics);
    } catch (error) {
      next(error);
    }
  };
}
