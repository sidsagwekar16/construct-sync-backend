// Worker Sites Service

import { NotFoundError, ForbiddenError } from '../../../../types/errors';
import { db } from '../../../../db/connection';
import { SiteStatus } from '../../../../types/enums';
import {
  WorkerSiteResponse,
  WorkerSiteJobSummary,
  ListWorkerSitesQuery,
} from './sites.types';

export class WorkerSitesService {
  /**
   * List sites where worker has assigned jobs
   */
  async listWorkerSites(
    workerId: string,
    companyId: string,
    query: ListWorkerSitesQuery
  ): Promise<{ data: WorkerSiteResponse[]; total: number; page: number; pageSize: number; hasMore: boolean }> {
    const page = query.page || 1;
    const pageSize = query.limit || 20;
    const offset = (page - 1) * pageSize;

    let whereConditions = ['jw.user_id = $1', 's.company_id = $2', 's.deleted_at IS NULL'];
    const params: any[] = [workerId, companyId];
    let paramIndex = 3;

    if (query.status) {
      whereConditions.push(`s.status = $${paramIndex}`);
      params.push(query.status);
      paramIndex++;
    }

    if (query.search) {
      whereConditions.push(`(s.name ILIKE $${paramIndex} OR s.address ILIKE $${paramIndex})`);
      params.push(`%${query.search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT s.id) as count
      FROM sites s
      INNER JOIN jobs j ON j.site_id = s.id
      INNER JOIN job_workers jw ON jw.job_id = j.id
      WHERE ${whereClause}
    `;
    const countResult = await db.query<{ count: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    // Get sites with job count
    const sitesQuery = `
      SELECT DISTINCT
        s.id,
        s.name,
        s.address,
        s.latitude,
        s.longitude,
        s.status,
        s.created_at,
        s.updated_at,
        COUNT(DISTINCT j.id) as job_count
      FROM sites s
      INNER JOIN jobs j ON j.site_id = s.id
      INNER JOIN job_workers jw ON jw.job_id = j.id
      WHERE ${whereClause}
      GROUP BY s.id, s.name, s.address, s.latitude, s.longitude, s.status, s.created_at, s.updated_at
      ORDER BY s.name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(pageSize, offset);

    const result = await db.query(sitesQuery, params);

    const sites: WorkerSiteResponse[] = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      status: row.status,
      jobCount: parseInt(row.job_count, 10),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return {
      data: sites,
      total,
      page,
      pageSize,
      hasMore: offset + sites.length < total,
    };
  }

  /**
   * Get site details (only if worker has jobs there)
   */
  async getWorkerSiteById(
    siteId: string,
    workerId: string,
    companyId: string
  ): Promise<WorkerSiteResponse> {
    const query = `
      SELECT DISTINCT
        s.id,
        s.name,
        s.address,
        s.latitude,
        s.longitude,
        s.status,
        s.created_at,
        s.updated_at,
        COUNT(DISTINCT j.id) as job_count
      FROM sites s
      INNER JOIN jobs j ON j.site_id = s.id
      INNER JOIN job_workers jw ON jw.job_id = j.id
      WHERE s.id = $1
        AND jw.user_id = $2
        AND s.company_id = $3
        AND s.deleted_at IS NULL
      GROUP BY s.id, s.name, s.address, s.latitude, s.longitude, s.status, s.created_at, s.updated_at
    `;

    const result = await db.query(query, [siteId, workerId, companyId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Site not found or you have no assigned jobs at this site');
    }

    const row = result.rows[0];

    return {
      id: row.id,
      name: row.name,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      status: row.status,
      jobCount: parseInt(row.job_count, 10),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Get worker's jobs at a specific site
   */
  async getWorkerSiteJobs(
    siteId: string,
    workerId: string,
    companyId: string
  ): Promise<WorkerSiteJobSummary[]> {
    // First verify worker has access to this site
    const accessQuery = `
      SELECT 1 FROM sites s
      INNER JOIN jobs j ON j.site_id = s.id
      INNER JOIN job_workers jw ON jw.job_id = j.id
      WHERE s.id = $1 AND jw.user_id = $2 AND s.company_id = $3 AND s.deleted_at IS NULL
      LIMIT 1
    `;
    const accessResult = await db.query(accessQuery, [siteId, workerId, companyId]);

    if (accessResult.rows.length === 0) {
      throw new ForbiddenError('You have no assigned jobs at this site');
    }

    // Get worker's jobs at this site
    const query = `
      SELECT DISTINCT
        j.id,
        j.name,
        j.job_type,
        j.status,
        j.start_date,
        j.end_date
      FROM jobs j
      INNER JOIN job_workers jw ON jw.job_id = j.id
      WHERE j.site_id = $1
        AND jw.user_id = $2
        AND j.company_id = $3
        AND j.deleted_at IS NULL
      ORDER BY j.start_date DESC, j.created_at DESC
    `;

    const result = await db.query(query, [siteId, workerId, companyId]);

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      jobType: row.job_type,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
    }));
  }
}

