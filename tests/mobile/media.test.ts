// Mobile Media API Tests

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { mockDbQuery } from '../setup';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../../src/types/enums';

describe('Mobile Media API', () => {
  let app: Application;
  let authToken: string;
  const mockCompanyId = uuidv4();
  const mockUserId = uuidv4();
  const mockJobId = uuidv4();
  const mockSiteId = uuidv4();
  const mockPhotoId = uuidv4();
  const mockMediaId = uuidv4();

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

  describe('Job Media - Mobile Routes', () => {
    describe('POST /api/mobile/jobs/:id/media/photos', () => {
      it('should upload a job photo successfully', async () => {
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
          .post(`/api/mobile/jobs/${mockJobId}/media/photos`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            photoUrl: 'https://example.com/photo.jpg',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            caption: 'Test photo',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });

    describe('DELETE /api/mobile/jobs/:id/media/photos/:photoId', () => {
      it('should delete a job photo successfully', async () => {
        mockDbQuery
          .mockResolvedValueOnce({ rows: [{ id: mockJobId }] }) // verify job exists
          .mockResolvedValueOnce({ rows: [{ id: mockPhotoId }] }) // verify photo exists
          .mockResolvedValueOnce({ rows: [] }); // delete photo

        const response = await request(app)
          .delete(`/api/mobile/jobs/${mockJobId}/media/photos/${mockPhotoId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Site Media - Mobile Routes', () => {
    describe('POST /api/mobile/sites/:id/media', () => {
      it('should upload site media successfully', async () => {
        mockDbQuery
          .mockResolvedValueOnce({ rows: [{ id: mockSiteId }] }) // verify site exists
          .mockResolvedValueOnce({
            rows: [{
              id: mockMediaId,
              site_id: mockSiteId,
              media_type: 'photo',
              media_url: 'https://example.com/media.jpg',
              thumbnail_url: 'https://example.com/thumb.jpg',
              created_at: new Date(),
            }],
          });

        const response = await request(app)
          .post(`/api/mobile/sites/${mockSiteId}/media`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            mediaUrl: 'https://example.com/media.jpg',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            mediaType: 'photo',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });

    describe('DELETE /api/mobile/sites/:id/media/:mediaId', () => {
      it('should delete site media successfully', async () => {
        mockDbQuery
          .mockResolvedValueOnce({ rows: [{ id: mockSiteId }] }) // verify site exists
          .mockResolvedValueOnce({ rows: [{ id: mockMediaId }] }) // verify media exists
          .mockResolvedValueOnce({ rows: [] }); // delete media

        const response = await request(app)
          .delete(`/api/mobile/sites/${mockSiteId}/media/${mockMediaId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});
