// Sites repository - Database operations

import { db } from '../../db/connection';
import { Site } from './sites.types';
import { SiteStatus } from '../../types/enums';

export class SitesRepository {
  /**
   * Find all sites for a company with optional search and pagination
   * Excludes soft-deleted sites
   */
  async findSitesByCompany(
    companyId: string,
    search?: string,
    status?: SiteStatus,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ sites: Site[]; total: number }> {
    let query = `
      SELECT * FROM sites 
      WHERE company_id = $1 AND deleted_at IS NULL
    `;
    const params: any[] = [companyId];
    let paramIndex = 2;

    // Add search filter if provided
    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR address ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add status filter if provided
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Get total count (before adding ORDER BY and pagination)
    const countQuery = `SELECT COUNT(*) FROM sites WHERE company_id = $1 AND deleted_at IS NULL` +
      (search ? ` AND (name ILIKE $2 OR address ILIKE $2)` : '') +
      (status ? ` AND status = $${search ? 3 : 2}` : '');
    const countResult = await db.query<{ count: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Add ORDER BY for main query
    query += ` ORDER BY created_at DESC`;

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query<Site>(query, params);
    return { sites: result.rows, total };
  }

  /**
   * Find a site by ID
   * Only returns if not soft-deleted and belongs to the company
   */
  async findSiteById(siteId: string, companyId: string): Promise<Site | null> {
    const query = `
      SELECT * FROM sites 
      WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query<Site>(query, [siteId, companyId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new site
   */
  async createSite(
    companyId: string,
    name: string,
    address?: string,
    latitude?: number,
    longitude?: number,
    radius?: number,
    status?: SiteStatus
  ): Promise<Site> {
    const query = `
      INSERT INTO sites (company_id, name, address, latitude, longitude, radius, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await db.query<Site>(query, [
      companyId,
      name,
      address || null,
      latitude || null,
      longitude || null,
      radius || 100.00,
      status || SiteStatus.PLANNING,
    ]);
    return result.rows[0];
  }

  /**
   * Update a site
   */
  async updateSite(
    siteId: string,
    companyId: string,
    data: {
      name?: string;
      address?: string;
      latitude?: number | null;
      longitude?: number | null;
      radius?: number | null;
      status?: SiteStatus;
    }
  ): Promise<Site | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(data.name);
      paramIndex++;
    }

    if (data.address !== undefined) {
      updates.push(`address = $${paramIndex}`);
      params.push(data.address);
      paramIndex++;
    }

    if (data.latitude !== undefined) {
      updates.push(`latitude = $${paramIndex}`);
      params.push(data.latitude);
      paramIndex++;
    }

    if (data.longitude !== undefined) {
      updates.push(`longitude = $${paramIndex}`);
      params.push(data.longitude);
      paramIndex++;
    }

    if (data.radius !== undefined) {
      updates.push(`radius = $${paramIndex}`);
      params.push(data.radius);
      paramIndex++;
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(data.status);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.findSiteById(siteId, companyId);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE sites 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1} AND deleted_at IS NULL
      RETURNING *
    `;
    params.push(siteId, companyId);

    const result = await db.query<Site>(query, params);
    return result.rows[0] || null;
  }

  /**
   * Soft delete a site
   */
  async deleteSite(siteId: string, companyId: string): Promise<boolean> {
    const query = `
      UPDATE sites 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
      RETURNING id
    `;
    const result = await db.query(query, [siteId, companyId]);
    return result.rows.length > 0;
  }

  /**
   * Check if site has associated jobs (for deletion validation)
   */
  async getSiteJobCount(siteId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count 
      FROM jobs 
      WHERE site_id = $1 AND deleted_at IS NULL
    `;
    const result = await db.query<{ count: string }>(query, [siteId]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Get sites by status for a company
   */
  async getSitesByStatus(
    companyId: string,
    status: SiteStatus
  ): Promise<Site[]> {
    const query = `
      SELECT * FROM sites 
      WHERE company_id = $1 AND status = $2 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    const result = await db.query<Site>(query, [companyId, status]);
    return result.rows;
  }

  /**
   * Count sites by status for a company
   */
  async countSitesByStatus(companyId: string): Promise<Map<SiteStatus, number>> {
    const query = `
      SELECT status, COUNT(*) as count 
      FROM sites 
      WHERE company_id = $1 AND deleted_at IS NULL
      GROUP BY status
    `;
    const result = await db.query<{ status: SiteStatus; count: string }>(query, [companyId]);

    const counts = new Map<SiteStatus, number>();
    result.rows.forEach((row) => {
      counts.set(row.status, parseInt(row.count, 10));
    });

    return counts;
  }
}
