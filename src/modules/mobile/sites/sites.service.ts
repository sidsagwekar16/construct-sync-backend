// Mobile Sites Service

import { db } from '../../../db/connection';
import { logger } from '../../../utils/logger';
import { NotFoundError } from '../../../types/errors';

interface ListSitesQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export class MobileSitesService {
  /**
   * List sites with job/worker counts
   */
  async listSites(companyId: string, query: ListSitesQuery): Promise<any> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const offset = (page - 1) * limit;

      let whereConditions = ['s.company_id = $1', 's.deleted_at IS NULL'];
      const params: any[] = [companyId];
      let paramIndex = 2;

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
      const countResult = await db.query(
        `SELECT COUNT(*) as count FROM sites s WHERE ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get sites with aggregated counts
      const result = await db.query(
        `SELECT 
          s.id,
          s.name as site_name,
          s.address as location,
          s.latitude,
          s.longitude,
          s.status,
          COUNT(DISTINCT j.id) as jobs,
          COUNT(DISTINCT jw.user_id) as workers
         FROM sites s
         LEFT JOIN jobs j ON s.id = j.site_id AND j.deleted_at IS NULL
         LEFT JOIN job_workers jw ON j.id = jw.job_id
         WHERE ${whereClause}
         GROUP BY s.id, s.name, s.address, s.latitude, s.longitude, s.status
         ORDER BY s.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      const sites = result.rows.map(row => ({
        id: row.id,
        siteName: row.site_name,
        location: row.location || 'No address provided',
        latitude: row.latitude,
        longitude: row.longitude,
        status: row.status || 'active',
        jobs: parseInt(row.jobs, 10),
        workers: parseInt(row.workers, 10),
      }));

      return {
        data: sites,
        page,
        limit,
        total,
        hasMore: offset + sites.length < total,
      };
    } catch (error) {
      logger.error('Error listing sites:', error);
      throw error;
    }
  }

  /**
   * Get site details
   */
  async getSiteById(siteId: string, companyId: string): Promise<any> {
    try {
      const result = await db.query(
        `SELECT 
          id,
          name as site_name,
          address,
          latitude,
          longitude,
          radius,
          status,
          created_at,
          updated_at
         FROM sites
         WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL`,
        [siteId, companyId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Site not found');
      }

      const site = result.rows[0];
      return {
        id: site.id,
        siteName: site.site_name,
        address: site.address,
        latitude: site.latitude,
        longitude: site.longitude,
        radius: site.radius,
        status: site.status,
        contactName: null, // Not in current schema
        contactPhone: null, // Not in current schema
        contactEmail: null, // Not in current schema
        description: null, // Not in current schema
        createdAt: site.created_at,
        updatedAt: site.updated_at,
      };
    } catch (error) {
      logger.error('Error getting site by ID:', error);
      throw error;
    }
  }

  /**
   * Get jobs at a specific site
   */
  async getSiteJobs(siteId: string, companyId: string): Promise<any[]> {
    try {
      // Verify site exists
      const siteCheck = await db.query(
        'SELECT id FROM sites WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL',
        [siteId, companyId]
      );

      if (siteCheck.rows.length === 0) {
        throw new NotFoundError('Site not found');
      }

      const result = await db.query(
        `SELECT 
          j.id,
          j.name,
          j.job_type,
          j.status,
          j.priority,
          j.start_date,
          j.end_date,
          s.address
         FROM jobs j
         LEFT JOIN sites s ON j.site_id = s.id
         WHERE j.site_id = $1 AND j.deleted_at IS NULL
         ORDER BY j.start_date DESC`,
        [siteId]
      );

      return result.rows.map(row => ({
        id: row.id,
        jobTitle: row.name,
        jobType: row.job_type,
        status: row.status,
        priority: row.priority,
        startTime: row.start_date,
        endTime: row.end_date,
        address: row.address,
      }));
    } catch (error) {
      logger.error('Error getting site jobs:', error);
      throw error;
    }
  }

  /**
   * Get workers at a specific site
   */
  async getSiteWorkers(siteId: string, companyId: string): Promise<any[]> {
    try {
      // Verify site exists
      const siteCheck = await db.query(
        'SELECT id FROM sites WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL',
        [siteId, companyId]
      );

      if (siteCheck.rows.length === 0) {
        throw new NotFoundError('Site not found');
      }

      const result = await db.query(
        `SELECT DISTINCT
          u.id,
          u.first_name || ' ' || u.last_name as name,
          u.role,
          u.phone
         FROM users u
         JOIN job_workers jw ON u.id = jw.user_id
         JOIN jobs j ON jw.job_id = j.id
         WHERE j.site_id = $1 
         AND u.deleted_at IS NULL 
         AND j.deleted_at IS NULL
         ORDER BY u.first_name, u.last_name`,
        [siteId]
      );

      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        role: row.role,
        status: 'clocked_out', // Default - time tracking not in schema yet
        phone: row.phone,
      }));
    } catch (error) {
      logger.error('Error getting site workers:', error);
      throw error;
    }
  }

  /**
   * Upload media for a site
   */
  async uploadMedia(siteId: string, companyId: string, userId: string, data: any): Promise<any> {
    try {
      await this.verifySiteAccess(siteId, companyId);

      const result = await db.query(
        `INSERT INTO site_media (site_id, uploaded_by, media_type, media_url, thumbnail_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [siteId, userId, data.mediaType || 'photo', data.mediaUrl, data.thumbnailUrl || null]
      );

      const media = result.rows[0];
      return {
        id: media.id,
        siteId: media.site_id,
        uploadedBy: media.uploaded_by,
        mediaType: media.media_type,
        mediaUrl: media.media_url,
        thumbnailUrl: media.thumbnail_url,
        createdAt: media.created_at,
      };
    } catch (error) {
      logger.error('Error uploading media:', error);
      throw error;
    }
  }

  /**
   * Delete media from a site
   */
  async deleteMedia(siteId: string, mediaId: string, companyId: string): Promise<void> {
    try {
      await this.verifySiteAccess(siteId, companyId);

      const checkResult = await db.query(
        'SELECT id FROM site_media WHERE id = $1 AND site_id = $2 AND deleted_at IS NULL',
        [mediaId, siteId]
      );

      if (checkResult.rows.length === 0) {
        throw new NotFoundError('Media not found');
      }

      await db.query('UPDATE site_media SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [mediaId]);
      logger.info(`Media deleted: ${mediaId} from site ${siteId}`);
    } catch (error) {
      logger.error('Error deleting media:', error);
      throw error;
    }
  }

  /**
   * Update a memo
   */
  async updateMemo(siteId: string, memoId: string, companyId: string, data: any): Promise<any> {
    try {
      await this.verifySiteAccess(siteId, companyId);

      const checkResult = await db.query(
        'SELECT id FROM site_memos WHERE id = $1 AND site_id = $2 AND deleted_at IS NULL',
        [memoId, siteId]
      );

      if (checkResult.rows.length === 0) {
        throw new NotFoundError('Memo not found');
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.title !== undefined) {
        updates.push(`title = $${paramIndex}`);
        values.push(data.title);
        paramIndex++;
      }
      if (data.content !== undefined) {
        updates.push(`content = $${paramIndex}`);
        values.push(data.content);
        paramIndex++;
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(memoId);

      const result = await db.query(
        `UPDATE site_memos SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      const memo = result.rows[0];
      return {
        id: memo.id,
        siteId: memo.site_id,
        createdBy: memo.created_by,
        title: memo.title,
        content: memo.content,
        createdAt: memo.created_at,
        updatedAt: memo.updated_at,
      };
    } catch (error) {
      logger.error('Error updating memo:', error);
      throw error;
    }
  }

  /**
   * Delete a memo
   */
  async deleteMemo(siteId: string, memoId: string, companyId: string): Promise<void> {
    try {
      await this.verifySiteAccess(siteId, companyId);

      const checkResult = await db.query(
        'SELECT id FROM site_memos WHERE id = $1 AND site_id = $2 AND deleted_at IS NULL',
        [memoId, siteId]
      );

      if (checkResult.rows.length === 0) {
        throw new NotFoundError('Memo not found');
      }

      await db.query('UPDATE site_memos SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [memoId]);
      logger.info(`Memo deleted: ${memoId} from site ${siteId}`);
    } catch (error) {
      logger.error('Error deleting memo:', error);
      throw error;
    }
  }

  /**
   * Helper to verify site access
   */
  private async verifySiteAccess(siteId: string, companyId: string): Promise<void> {
    const result = await db.query(
      'SELECT id FROM sites WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL',
      [siteId, companyId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Site not found');
    }
  }
}

