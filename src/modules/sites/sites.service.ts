// Sites service - Business logic

import { SitesRepository } from './sites.repository';
import {
  CreateSiteRequest,
  UpdateSiteRequest,
  SiteResponse,
  ListSitesQuery,
} from './sites.types';
import { SiteStatus } from '../../types/enums';
import {
  NotFoundError,
  BadRequestError,
} from '../../types/errors';
import { logger } from '../../utils/logger';
import { BudgetsRepository } from '../budgets/budgets.repository';

export class SitesService {
  private repository: SitesRepository;
  private budgetsRepository: BudgetsRepository;

  constructor() {
    this.repository = new SitesRepository();
    this.budgetsRepository = new BudgetsRepository();
  }

  /**
   * List all sites for a company with pagination and search
   */
  async listSites(
    companyId: string,
    query: ListSitesQuery
  ): Promise<{ sites: SiteResponse[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    const { sites, total } = await this.repository.findSitesByCompany(
      companyId,
      query.search,
      query.status,
      limit,
      offset
    );

    const siteResponses = sites.map(this.mapSiteToResponse);

    return {
      sites: siteResponses,
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single site by ID
   */
  async getSiteById(
    siteId: string,
    companyId: string
  ): Promise<SiteResponse> {
    const site = await this.repository.findSiteById(siteId, companyId);
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    return this.mapSiteToResponse(site);
  }

  /**
   * Create a new site
   */
  async createSite(
    companyId: string,
    data: CreateSiteRequest,
    userId: string
  ): Promise<SiteResponse> {
    // Validate latitude and longitude together
    if ((data.latitude && !data.longitude) || (!data.latitude && data.longitude)) {
      throw new BadRequestError('Both latitude and longitude must be provided together');
    }

    const site = await this.repository.createSite(
      companyId,
      data.name,
      data.address,
      data.latitude,
      data.longitude,
      data.radius || 100,
      data.status
    );

    logger.info(`Site created: ${site.name} (${site.id}) for company ${companyId}`);

    // Automatically create a budget for the site with default categories
    try {
      const budget = await this.budgetsRepository.createBudget(
        site.id,
        companyId,
        0, // Start with 0 budget, user can update later
        userId
      );
      
      // Create default categories
      await this.budgetsRepository.createDefaultCategories(budget.id);
      
      // Update budget totals
      await this.budgetsRepository.updateBudgetTotals(budget.id);
      
      logger.info(`Budget created automatically for site: ${site.name} (${site.id})`);
    } catch (error) {
      logger.warn(`Failed to create budget for site ${site.id}: ${error}`);
      // Don't fail site creation if budget creation fails
    }

    return this.mapSiteToResponse(site);
  }

  /**
   * Update a site
   */
  async updateSite(
    siteId: string,
    companyId: string,
    data: UpdateSiteRequest
  ): Promise<SiteResponse> {
    const site = await this.repository.findSiteById(siteId, companyId);
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    // Validate latitude and longitude together if updating
    if (data.latitude !== undefined || data.longitude !== undefined) {
      const newLat = data.latitude !== undefined ? data.latitude : site.latitude;
      const newLng = data.longitude !== undefined ? data.longitude : site.longitude;

      if ((newLat && !newLng) || (!newLat && newLng)) {
        throw new BadRequestError('Both latitude and longitude must be provided together');
      }
    }

    const updatedSite = await this.repository.updateSite(siteId, companyId, data);
    if (!updatedSite) {
      throw new NotFoundError('Site not found');
    }

    logger.info(`Site updated: ${updatedSite.name} (${updatedSite.id})`);

    return this.mapSiteToResponse(updatedSite);
  }

  /**
   * Delete a site (soft delete)
   */
  async deleteSite(siteId: string, companyId: string): Promise<void> {
    const site = await this.repository.findSiteById(siteId, companyId);
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    // Check if site has associated jobs
    const jobCount = await this.repository.getSiteJobCount(siteId);
    if (jobCount > 0) {
      throw new BadRequestError(
        `Cannot delete site with ${jobCount} associated job(s). Please remove or reassign jobs first.`
      );
    }

    // Soft-delete the associated budget first
    try {
      const budget = await this.budgetsRepository.findBudgetBySiteId(siteId, companyId);
      if (budget) {
        await this.budgetsRepository.deleteBudget(budget.id, companyId);
        logger.info(`Budget soft-deleted for site: ${site.name} (${siteId})`);
      }
    } catch (error) {
      logger.warn(`Failed to soft-delete budget for site ${siteId}: ${error}`);
      // Continue with site deletion even if budget deletion fails
    }

    // Soft-delete the site
    const deleted = await this.repository.deleteSite(siteId, companyId);
    if (!deleted) {
      throw new NotFoundError('Site not found');
    }

    logger.info(`Site deleted: ${site.name} (${siteId})`);
  }

  /**
   * Get sites by status
   */
  async getSitesByStatus(
    companyId: string,
    status: SiteStatus
  ): Promise<SiteResponse[]> {
    const sites = await this.repository.getSitesByStatus(companyId, status);
    return sites.map(this.mapSiteToResponse);
  }

  /**
   * Get site statistics by status
   */
  async getSiteStatistics(companyId: string): Promise<{
    total: number;
    byStatus: { [key in SiteStatus]?: number };
  }> {
    const statusCounts = await this.repository.countSitesByStatus(companyId);

    const byStatus: { [key in SiteStatus]?: number } = {};
    let total = 0;

    statusCounts.forEach((count, status) => {
      byStatus[status] = count;
      total += count;
    });

    return { total, byStatus };
  }

  /**
   * Helper: Map site entity to response
   */
  private mapSiteToResponse(site: any): SiteResponse {
    return {
      id: site.id,
      companyId: site.company_id,
      name: site.name,
      address: site.address,
      latitude: site.latitude,
      longitude: site.longitude,
      radius: site.radius,
      status: site.status,
      createdAt: site.created_at,
      updatedAt: site.updated_at,
    };
  }
}
