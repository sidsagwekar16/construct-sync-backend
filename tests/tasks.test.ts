// Tasks API Tests

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../src/app';
import { mockDbQuery } from './setup';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../src/types/enums';

describe('Tasks API', () => {
  let app: Application;
  let authToken: string;
  const mockCompanyId = uuidv4();
  const mockUserId = uuidv4();
  const mockJobId = uuidv4();
  const mockTaskId = uuidv4();

  beforeAll(async () => {
    app = createApp();
    
    // Create a valid JWT token
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

  describe('PATCH /api/tasks/:id', () => {
    it('should update a task successfully', async () => {
      // Mock finding the task
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockTaskId, job_id: mockJobId, title: 'Old Title' }], rowCount: 1, command: '', oid: 0, fields: [] }) // findTaskById
        .mockResolvedValueOnce({ // updateTask
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
          rowCount: 1,
          command: 'UPDATE',
          oid: 0,
          fields: [],
        });

      const response = await request(app)
        .patch(`/api/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Task',
          description: 'Updated description',
          status: 'in_progress',
          priority: 'high',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Task');
    });

    it('should return 404 for non-existent task', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] }); // Task not found

      const response = await request(app)
        .patch(`/api/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Task' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task successfully', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockTaskId, job_id: mockJobId, title: 'Task to delete' }], rowCount: 1, command: '', oid: 0, fields: [] }) // findTaskById
        .mockResolvedValueOnce({ rows: [{ id: mockTaskId }], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] }); // deleteTask

      const response = await request(app)
        .delete(`/api/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent task', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] }); // Task not found

      const response = await request(app)
        .delete(`/api/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
