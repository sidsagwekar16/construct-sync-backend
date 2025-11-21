// Mobile Tasks API Tests

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { mockDbQuery } from '../setup';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../../src/types/enums';

describe('Mobile Tasks API', () => {
  let app: Application;
  let authToken: string;
  const mockCompanyId = uuidv4();
  const mockUserId = uuidv4();
  const mockJobId = uuidv4();
  const mockTaskId = uuidv4();

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

  describe('PATCH /api/mobile/jobs/:id/tasks/:taskId', () => {
    it('should update a task successfully', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockJobId }] }) // verify job exists
        .mockResolvedValueOnce({ rows: [{ id: mockTaskId }] }) // verify task exists
        .mockResolvedValueOnce({
          rows: [{
            id: mockTaskId,
            job_id: mockJobId,
            title: 'Updated Task',
            description: 'Updated description',
            status: 'in_progress',
            priority: 'high',
            due_date: '2024-12-31',
            created_at: new Date(),
            updated_at: new Date(),
          }],
        });

      const response = await request(app)
        .patch(`/api/mobile/jobs/${mockJobId}/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Task',
          description: 'Updated description',
          status: 'in_progress',
          priority: 'high',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Task');
    });
  });

  describe('DELETE /api/mobile/jobs/:id/tasks/:taskId', () => {
    it('should delete a task successfully', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockJobId }] }) // verify job exists
        .mockResolvedValueOnce({ rows: [{ id: mockTaskId }] }) // verify task exists
        .mockResolvedValueOnce({ rows: [] }); // delete task

      const response = await request(app)
        .delete(`/api/mobile/jobs/${mockJobId}/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
