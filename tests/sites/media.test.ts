// Site Media API Tests

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { mockDbQuery } from '../setup';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../../src/types/enums';

describe('Site Media API', () => {
  let app: Application;
  let authToken: string;
  const mockCompanyId = uuidv4();
  const mockUserId = uuidv4();
  const mockSiteId = uuidv4();
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

  describe('POST /api/sites/:siteId/media', () => {
    it('should upload media successfully', async () => {
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
        .post(`/api/sites/${mockSiteId}/media`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaUrl: 'https://example.com/media.jpg',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          mediaType: 'photo',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.mediaUrl).toBe('https://example.com/media.jpg');
    });
  });

  describe('GET /api/sites/:siteId/media', () => {
    it('should get all media for a site', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockSiteId }] }) // verify site exists
        .mockResolvedValueOnce({
          rows: [
            {
              id: mockMediaId,
              site_id: mockSiteId,
              media_type: 'photo',
              media_url: 'https://example.com/media1.jpg',
              thumbnail_url: 'https://example.com/thumb1.jpg',
              uploaded_by_name: 'John Doe',
              created_at: new Date(),
            },
          ],
        });

      const response = await request(app)
        .get(`/api/sites/${mockSiteId}/media`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/sites/:siteId/media/:mediaId', () => {
    it('should delete media successfully', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockSiteId }] }) // verify site exists
        .mockResolvedValueOnce({ rows: [{ id: mockMediaId }] }) // verify media exists
        .mockResolvedValueOnce({ rows: [] }); // delete media

      const response = await request(app)
        .delete(`/api/sites/${mockSiteId}/media/${mockMediaId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
