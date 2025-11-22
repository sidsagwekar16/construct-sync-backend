// Site Memos Controller

import { Request, Response, NextFunction } from 'express';
import { SiteMemosService } from './memos.service';
import { successResponse } from '../../../utils/response';
import { CreateMemoRequest, UpdateMemoRequest } from './memos.types';

export class SiteMemosController {
  private service: SiteMemosService;

  constructor() {
    this.service = new SiteMemosService();
  }

  /**
   * POST /api/sites/:siteId/memos
   * Create a memo for a site
   */
  createMemo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.siteId;
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const data: CreateMemoRequest = req.body;

      const memo = await this.service.createMemo(siteId, companyId, userId, data);
      successResponse(res, memo, 'Memo created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/sites/:siteId/memos
   * Get all memos for a site
   */
  getSiteMemos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.siteId;
      const companyId = req.user!.companyId;

      const memos = await this.service.getSiteMemos(siteId, companyId);
      successResponse(res, memos);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/sites/:siteId/memos/:memoId
   * Update a memo
   */
  updateMemo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.siteId;
      const memoId = req.params.memoId;
      const companyId = req.user!.companyId;
      const data: UpdateMemoRequest = req.body;

      const memo = await this.service.updateMemo(siteId, memoId, companyId, data);
      successResponse(res, memo, 'Memo updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/sites/:siteId/memos/:memoId
   * Delete a memo
   */
  deleteMemo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.siteId;
      const memoId = req.params.memoId;
      const companyId = req.user!.companyId;

      await this.service.deleteMemo(siteId, memoId, companyId);
      successResponse(res, null, 'Memo deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}



