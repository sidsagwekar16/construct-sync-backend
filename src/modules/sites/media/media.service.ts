// Site Media Service

import { db } from '../../../db/connection';
import { logger } from '../../../utils/logger';
import { NotFoundError } from '../../../types/errors';
import { SiteMedia, SiteMediaResponse, UploadMediaRequest } from './media.types';

export class SiteMediaService {
  /**
   * Verify site exists and belongs to company
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

  /**
   * Upload media for a site
   */
  async uploadMedia(
    siteId: string,
    companyId: string,
    userId: string,
    data: UploadMediaRequest
  ): Promise<SiteMediaResponse> {
    await this.verifySiteAccess(siteId, companyId);

    const result = await db.query<SiteMedia>(
      `INSERT INTO site_media (site_id, uploaded_by, media_type, media_url, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [siteId, userId, data.mediaType || 'photo', data.mediaUrl, data.thumbnailUrl || null]
    );

    const media = result.rows[0];
    logger.info(`Media uploaded for site ${siteId}: ${media.id}`);

    return this.mapMediaToResponse(media);
  }

  /**
   * Get all media for a site
   */
  async getSiteMedia(siteId: string, companyId: string): Promise<SiteMediaResponse[]> {
    await this.verifySiteAccess(siteId, companyId);

    const result = await db.query<SiteMedia & { uploaded_by_name: string }>(
      `SELECT 
        m.*,
        u.first_name || ' ' || u.last_name as uploaded_by_name
       FROM site_media m
       LEFT JOIN users u ON m.uploaded_by = u.id
       WHERE m.site_id = $1 AND m.deleted_at IS NULL
       ORDER BY m.created_at DESC`,
      [siteId]
    );

    return result.rows.map((row) => ({
      ...this.mapMediaToResponse(row),
      uploadedByName: row.uploaded_by_name,
    }));
  }

  /**
   * Delete media (soft delete)
   */
  async deleteMedia(siteId: string, mediaId: string, companyId: string): Promise<void> {
    await this.verifySiteAccess(siteId, companyId);

    // Verify media belongs to site
    const checkResult = await db.query(
      'SELECT id FROM site_media WHERE id = $1 AND site_id = $2 AND deleted_at IS NULL',
      [mediaId, siteId]
    );

    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Media not found');
    }

    await db.query('UPDATE site_media SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [mediaId]);
    
    logger.info(`Media deleted: ${mediaId} from site ${siteId}`);
  }

  /**
   * Map SiteMedia to response format
   */
  private mapMediaToResponse(media: SiteMedia): SiteMediaResponse {
    return {
      id: media.id,
      siteId: media.site_id,
      uploadedBy: media.uploaded_by,
      mediaType: media.media_type,
      mediaUrl: media.media_url,
      thumbnailUrl: media.thumbnail_url,
      createdAt: media.created_at,
    };
  }
}

