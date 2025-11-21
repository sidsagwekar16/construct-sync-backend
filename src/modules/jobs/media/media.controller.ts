// Job Media Controller - Request Handlers

import { Request, Response, NextFunction } from 'express';
import { JobMediaService } from './media.service';
import { successResponse } from '../../../utils/response';
import { UploadPhotoRequest, UploadDocumentRequest } from './media.types';

export class JobMediaController {
  private service: JobMediaService;

  constructor() {
    this.service = new JobMediaService();
  }

  /**
   * POST /api/jobs/:jobId/media/photos
   * Upload a photo for a job
   */
  uploadPhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.jobId;
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const data: UploadPhotoRequest = req.body;

      const photo = await this.service.uploadPhoto(jobId, companyId, userId, data);
      successResponse(res, photo, 'Photo uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/jobs/:jobId/media/photos
   * Get all photos for a job
   */
  getJobPhotos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.jobId;
      const companyId = req.user!.companyId;

      const photos = await this.service.getJobPhotos(jobId, companyId);
      successResponse(res, photos);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/jobs/:jobId/media/photos/:photoId
   * Delete a photo from a job
   */
  deletePhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.jobId;
      const photoId = req.params.photoId;
      const companyId = req.user!.companyId;

      await this.service.deletePhoto(jobId, photoId, companyId);
      successResponse(res, null, 'Photo deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/jobs/:jobId/media/documents
   * Upload a document for a job
   */
  uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.jobId;
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const data: UploadDocumentRequest = req.body;

      const document = await this.service.uploadDocument(jobId, companyId, userId, data);
      successResponse(res, document, 'Document uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/jobs/:jobId/media/documents
   * Get all documents for a job
   */
  getJobDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.jobId;
      const companyId = req.user!.companyId;

      const documents = await this.service.getJobDocuments(jobId, companyId);
      successResponse(res, documents);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/jobs/:jobId/media/documents/:documentId
   * Delete a document from a job
   */
  deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.jobId;
      const documentId = req.params.documentId;
      const companyId = req.user!.companyId;

      await this.service.deleteDocument(jobId, documentId, companyId);
      successResponse(res, null, 'Document deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

