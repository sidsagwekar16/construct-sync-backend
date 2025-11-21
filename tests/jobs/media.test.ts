// Job Media API Tests

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { mockDbQuery } from '../setup';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../../src/types/enums';

describe('Job Media API', () => {
  let app: Application;
  let authToken: string;
  const mockCompanyId = uuidv4();
  const mockUserId = uuidv4();
  const mockJobId = uuidv4();
  const mockPhotoId = uuidv4();
  const mockDocumentId = uuidv4();

  beforeAll(() => {
    app = createApp();
    authToken = jwt.sign(
      {
        userId: mockUserId,
        email: 'test@example.com',
        companyId: mockCompanyId,
        role: UserRole.COMPANY_ADMIN,
      },
      env.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    mockDbQuery.mockClear();
  });

  describe('POST /api/jobs/:jobId/media/photos', () => {
    it('should upload a photo successfully', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockJobId }] }) // verify job exists
        .mockResolvedValueOnce({
          rows: [{
            id: mockPhotoId,
            job_id: mockJobId,
            photo_url: 'https://example.com/photo.jpg',
            thumbnail_url: 'https://example.com/thumb.jpg',
            caption: 'Test photo',
            created_at: new Date(),
          }],
        });

      const response = await request(app)
        .post(`/api/jobs/${mockJobId}/media/photos`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          photoUrl: 'https://example.com/photo.jpg',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          caption: 'Test photo',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.photoUrl).toBe('https://example.com/photo.jpg');
    });
  });

  describe('GET /api/jobs/:jobId/media/photos', () => {
    it('should get all photos for a job', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockJobId }] }) // verify job exists
        .mockResolvedValueOnce({
          rows: [
            {
              id: mockPhotoId,
              job_id: mockJobId,
              photo_url: 'https://example.com/photo1.jpg',
              thumbnail_url: 'https://example.com/thumb1.jpg',
              caption: 'Photo 1',
              uploaded_by_name: 'John Doe',
              created_at: new Date(),
            },
          ],
        });

      const response = await request(app)
        .get(`/api/jobs/${mockJobId}/media/photos`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/jobs/:jobId/media/photos/:photoId', () => {
    it('should delete a photo successfully', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockJobId }] }) // verify job exists
        .mockResolvedValueOnce({ rows: [{ id: mockPhotoId }] }) // verify photo exists
        .mockResolvedValueOnce({ rows: [] }); // delete photo

      const response = await request(app)
        .delete(`/api/jobs/${mockJobId}/media/photos/${mockPhotoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/jobs/:jobId/media/documents', () => {
    it('should upload a document successfully', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockJobId }] }) // verify job exists
        .mockResolvedValueOnce({
          rows: [{
            id: mockDocumentId,
            job_id: mockJobId,
            document_name: 'test.pdf',
            document_url: 'https://example.com/test.pdf',
            document_type: 'blueprint',
            created_at: new Date(),
          }],
        });

      const response = await request(app)
        .post(`/api/jobs/${mockJobId}/media/documents`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          documentName: 'test.pdf',
          documentUrl: 'https://example.com/test.pdf',
          documentType: 'blueprint',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.documentName).toBe('test.pdf');
    });
  });

  describe('GET /api/jobs/:jobId/media/documents', () => {
    it('should get all documents for a job', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockJobId }] }) // verify job exists
        .mockResolvedValueOnce({
          rows: [
            {
              id: mockDocumentId,
              job_id: mockJobId,
              document_name: 'test.pdf',
              document_url: 'https://example.com/test.pdf',
              document_type: 'blueprint',
              uploaded_by_name: 'John Doe',
              created_at: new Date(),
            },
          ],
        });

      const response = await request(app)
        .get(`/api/jobs/${mockJobId}/media/documents`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/jobs/:jobId/media/documents/:documentId', () => {
    it('should delete a document successfully', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockJobId }] }) // verify job exists
        .mockResolvedValueOnce({ rows: [{ id: mockDocumentId }] }) // verify document exists
        .mockResolvedValueOnce({ rows: [] }); // delete document

      const response = await request(app)
        .delete(`/api/jobs/${mockJobId}/media/documents/${mockDocumentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
