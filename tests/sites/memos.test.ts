// Site Memos API Tests

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { mockDbQuery } from '../setup';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../../src/types/enums';

describe('Site Memos API', () => {
  let app: Application;
  let authToken: string;
  const mockCompanyId = uuidv4();
  const mockUserId = uuidv4();
  const mockSiteId = uuidv4();
  const mockMemoId = uuidv4();

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

  describe('POST /api/sites/:siteId/memos', () => {
    it('should create a memo successfully', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockSiteId }] }) // verify site exists
        .mockResolvedValueOnce({
          rows: [{
            id: mockMemoId,
            site_id: mockSiteId,
            title: 'Test Memo',
            content: 'Test content',
            created_at: new Date(),
            updated_at: new Date(),
          }],
        });

      const response = await request(app)
        .post(`/api/sites/${mockSiteId}/memos`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Memo',
          content: 'Test content',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Memo');
    });
  });

  describe('GET /api/sites/:siteId/memos', () => {
    it('should get all memos for a site', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockSiteId }] }) // verify site exists
        .mockResolvedValueOnce({
          rows: [
            {
              id: mockMemoId,
              site_id: mockSiteId,
              title: 'Test Memo',
              content: 'Test content',
              created_by_name: 'John Doe',
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        });

      const response = await request(app)
        .get(`/api/sites/${mockSiteId}/memos`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('PATCH /api/sites/:siteId/memos/:memoId', () => {
    it('should update a memo successfully', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockSiteId }] }) // verify site exists
        .mockResolvedValueOnce({ rows: [{ id: mockMemoId }] }) // verify memo exists
        .mockResolvedValueOnce({
          rows: [{
            id: mockMemoId,
            site_id: mockSiteId,
            title: 'Updated Memo',
            content: 'Updated content',
            created_at: new Date(),
            updated_at: new Date(),
          }],
        });

      const response = await request(app)
        .patch(`/api/sites/${mockSiteId}/memos/${mockMemoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Memo',
          content: 'Updated content',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Memo');
    });
  });

  describe('DELETE /api/sites/:siteId/memos/:memoId', () => {
    it('should delete a memo successfully', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockSiteId }] }) // verify site exists
        .mockResolvedValueOnce({ rows: [{ id: mockMemoId }] }) // verify memo exists
        .mockResolvedValueOnce({ rows: [] }); // delete memo

      const response = await request(app)
        .delete(`/api/sites/${mockSiteId}/memos/${mockMemoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
