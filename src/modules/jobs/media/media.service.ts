// Job Media Service - Business Logic

import { db } from '../../../db/connection';
import { logger } from '../../../utils/logger';
import { NotFoundError, BadRequestError } from '../../../types/errors';
import {
  JobPhoto,
  JobDocument,
  JobPhotoResponse,
  JobDocumentResponse,
  UploadPhotoRequest,
  UploadDocumentRequest,
} from './media.types';

export class JobMediaService {
  /**
   * Verify job exists and belongs to company
   */
  private async verifyJobAccess(jobId: string, companyId: string): Promise<void> {
    const result = await db.query(
      'SELECT id FROM jobs WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL',
      [jobId, companyId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Job not found');
    }
  }

  /**
   * Upload a photo for a job
   */
  async uploadPhoto(
    jobId: string,
    companyId: string,
    userId: string,
    data: UploadPhotoRequest
  ): Promise<JobPhotoResponse> {
    await this.verifyJobAccess(jobId, companyId);

    const result = await db.query<JobPhoto>(
      `INSERT INTO job_photos (job_id, uploaded_by, photo_url, thumbnail_url, caption)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [jobId, userId, data.photoUrl, data.thumbnailUrl || null, data.caption || null]
    );

    const photo = result.rows[0];
    logger.info(`Photo uploaded for job ${jobId}: ${photo.id}`);

    return this.mapPhotoToResponse(photo);
  }

  /**
   * Get all photos for a job
   */
  async getJobPhotos(jobId: string, companyId: string): Promise<JobPhotoResponse[]> {
    await this.verifyJobAccess(jobId, companyId);

    const result = await db.query<JobPhoto & { uploaded_by_name: string }>(
      `SELECT 
        p.*,
        u.first_name || ' ' || u.last_name as uploaded_by_name
       FROM job_photos p
       LEFT JOIN users u ON p.uploaded_by = u.id
       WHERE p.job_id = $1 AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC`,
      [jobId]
    );

    return result.rows.map((row) => ({
      ...this.mapPhotoToResponse(row),
      uploadedByName: row.uploaded_by_name,
    }));
  }

  /**
   * Delete a photo (soft delete)
   */
  async deletePhoto(jobId: string, photoId: string, companyId: string): Promise<void> {
    await this.verifyJobAccess(jobId, companyId);

    // Verify photo belongs to job
    const checkResult = await db.query(
      'SELECT id FROM job_photos WHERE id = $1 AND job_id = $2 AND deleted_at IS NULL',
      [photoId, jobId]
    );

    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Photo not found');
    }

    await db.query('UPDATE job_photos SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [photoId]);
    
    logger.info(`Photo deleted: ${photoId} from job ${jobId}`);
  }

  /**
   * Upload a document for a job
   */
  async uploadDocument(
    jobId: string,
    companyId: string,
    userId: string,
    data: UploadDocumentRequest
  ): Promise<JobDocumentResponse> {
    await this.verifyJobAccess(jobId, companyId);

    const result = await db.query<JobDocument>(
      `INSERT INTO job_documents (job_id, uploaded_by, document_name, document_url, document_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [jobId, userId, data.documentName, data.documentUrl, data.documentType || null]
    );

    const document = result.rows[0];
    logger.info(`Document uploaded for job ${jobId}: ${document.id}`);

    return this.mapDocumentToResponse(document);
  }

  /**
   * Get all documents for a job
   */
  async getJobDocuments(jobId: string, companyId: string): Promise<JobDocumentResponse[]> {
    await this.verifyJobAccess(jobId, companyId);

    const result = await db.query<JobDocument & { uploaded_by_name: string }>(
      `SELECT 
        d.*,
        u.first_name || ' ' || u.last_name as uploaded_by_name
       FROM job_documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.job_id = $1 AND d.deleted_at IS NULL
       ORDER BY d.created_at DESC`,
      [jobId]
    );

    return result.rows.map((row) => ({
      ...this.mapDocumentToResponse(row),
      uploadedByName: row.uploaded_by_name,
    }));
  }

  /**
   * Delete a document (soft delete)
   */
  async deleteDocument(jobId: string, documentId: string, companyId: string): Promise<void> {
    await this.verifyJobAccess(jobId, companyId);

    // Verify document belongs to job
    const checkResult = await db.query(
      'SELECT id FROM job_documents WHERE id = $1 AND job_id = $2 AND deleted_at IS NULL',
      [documentId, jobId]
    );

    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Document not found');
    }

    await db.query('UPDATE job_documents SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [documentId]);
    
    logger.info(`Document deleted: ${documentId} from job ${jobId}`);
  }

  /**
   * Map JobPhoto to response format
   */
  private mapPhotoToResponse(photo: JobPhoto): JobPhotoResponse {
    return {
      id: photo.id,
      jobId: photo.job_id,
      uploadedBy: photo.uploaded_by,
      photoUrl: photo.photo_url,
      thumbnailUrl: photo.thumbnail_url,
      caption: photo.caption,
      createdAt: photo.created_at,
    };
  }

  /**
   * Map JobDocument to response format
   */
  private mapDocumentToResponse(document: JobDocument): JobDocumentResponse {
    return {
      id: document.id,
      jobId: document.job_id,
      uploadedBy: document.uploaded_by,
      documentName: document.document_name,
      documentUrl: document.document_url,
      documentType: document.document_type,
      createdAt: document.created_at,
    };
  }
}

