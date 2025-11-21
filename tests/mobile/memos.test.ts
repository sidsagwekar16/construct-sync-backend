// Mobile Memos API Tests

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { mockDbQuery } from '../setup';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../../src/types/enums';

describe('Mobile Memos API', () => {
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

  describe('PATCH /api/mobile/sites/:id/memos/:memoId', () => {
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
        .patch(`/api/mobile/sites/${mockSiteId}/memos/${mockMemoId}`)
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

  describe('DELETE /api/mobile/sites/:id/memos/:memoId', () => {
    it('should delete a memo successfully', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockSiteId }] }) // verify site exists
        .mockResolvedValueOnce({ rows: [{ id: mockMemoId }] }) // verify memo exists
        .mockResolvedValueOnce({ rows: [] }); // delete memo

      const response = await request(app)
        .delete(`/api/mobile/sites/${mockSiteId}/memos/${mockMemoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
