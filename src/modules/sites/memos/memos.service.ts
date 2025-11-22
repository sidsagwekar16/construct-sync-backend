// Site Memos Service

import { db } from '../../../db/connection';
import { logger } from '../../../utils/logger';
import { NotFoundError } from '../../../types/errors';
import { SiteMemo, SiteMemoResponse, CreateMemoRequest, UpdateMemoRequest } from './memos.types';

export class SiteMemosService {
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
   * Create a memo for a site
   */
  async createMemo(
    siteId: string,
    companyId: string,
    userId: string,
    data: CreateMemoRequest
  ): Promise<SiteMemoResponse> {
    await this.verifySiteAccess(siteId, companyId);

    const result = await db.query<SiteMemo>(
      `INSERT INTO site_memos (site_id, created_by, title, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [siteId, userId, data.title || null, data.content]
    );

    const memo = result.rows[0];
    logger.info(`Memo created for site ${siteId}: ${memo.id}`);

    return this.mapMemoToResponse(memo);
  }

  /**
   * Get all memos for a site
   */
  async getSiteMemos(siteId: string, companyId: string): Promise<SiteMemoResponse[]> {
    await this.verifySiteAccess(siteId, companyId);

    const result = await db.query<SiteMemo & { created_by_name: string }>(
      `SELECT 
        m.*,
        u.first_name || ' ' || u.last_name as created_by_name
       FROM site_memos m
       LEFT JOIN users u ON m.created_by = u.id
       WHERE m.site_id = $1 AND m.deleted_at IS NULL
       ORDER BY m.created_at DESC`,
      [siteId]
    );

    return result.rows.map((row) => ({
      ...this.mapMemoToResponse(row),
      createdByName: row.created_by_name,
    }));
  }

  /**
   * Update a memo
   */
  async updateMemo(
    siteId: string,
    memoId: string,
    companyId: string,
    data: UpdateMemoRequest
  ): Promise<SiteMemoResponse> {
    await this.verifySiteAccess(siteId, companyId);

    // Verify memo belongs to site
    const checkResult = await db.query(
      'SELECT id FROM site_memos WHERE id = $1 AND site_id = $2 AND deleted_at IS NULL',
      [memoId, siteId]
    );

    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Memo not found');
    }

    // Build update query dynamically
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

    const result = await db.query<SiteMemo>(
      `UPDATE site_memos SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    const memo = result.rows[0];
    logger.info(`Memo updated: ${memoId} for site ${siteId}`);

    return this.mapMemoToResponse(memo);
  }

  /**
   * Delete a memo (soft delete)
   */
  async deleteMemo(siteId: string, memoId: string, companyId: string): Promise<void> {
    await this.verifySiteAccess(siteId, companyId);

    // Verify memo belongs to site
    const checkResult = await db.query(
      'SELECT id FROM site_memos WHERE id = $1 AND site_id = $2 AND deleted_at IS NULL',
      [memoId, siteId]
    );

    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Memo not found');
    }

    await db.query('UPDATE site_memos SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [memoId]);
    
    logger.info(`Memo deleted: ${memoId} from site ${siteId}`);
  }

  /**
   * Map SiteMemo to response format
   */
  private mapMemoToResponse(memo: SiteMemo): SiteMemoResponse {
    return {
      id: memo.id,
      siteId: memo.site_id,
      createdBy: memo.created_by,
      title: memo.title,
      content: memo.content,
      createdAt: memo.created_at,
      updatedAt: memo.updated_at,
    };
  }
}



