// Site Media Controller

import { Request, Response, NextFunction } from 'express';
import { SiteMediaService } from './media.service';
import { successResponse } from '../../../utils/response';
import { UploadMediaRequest } from './media.types';

export class SiteMediaController {
  private service: SiteMediaService;

  constructor() {
    this.service = new SiteMediaService();
  }

  /**
   * POST /api/sites/:siteId/media
   * Upload media for a site
   */
  uploadMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.siteId;
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const data: UploadMediaRequest = req.body;

      const media = await this.service.uploadMedia(siteId, companyId, userId, data);
      successResponse(res, media, 'Media uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/sites/:siteId/media
   * Get all media for a site
   */
  getSiteMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.siteId;
      const companyId = req.user!.companyId;

      const media = await this.service.getSiteMedia(siteId, companyId);
      successResponse(res, media);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/sites/:siteId/media/:mediaId
   * Delete media from a site
   */
  deleteMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.siteId;
      const mediaId = req.params.mediaId;
      const companyId = req.user!.companyId;

      await this.service.deleteMedia(siteId, mediaId, companyId);
      successResponse(res, null, 'Media deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}



