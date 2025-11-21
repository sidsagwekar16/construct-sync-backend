// Worker Profile API Tests

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../../src/app';
import { mockDbQuery } from '../../setup';
import jwt from 'jsonwebtoken';
import { env } from '../../../src/config/env';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../../../src/types/enums';

describe('Worker Profile API', () => {
  let app: Application;
  let authToken: string;
  const companyId = uuidv4();
  const workerId = uuidv4();

  beforeAll(() => {
    app = createApp();

    authToken = jwt.sign(
      { userId: workerId, companyId, email: 'worker@test.com', role: UserRole.WORKER },
      env.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/mobile/worker/profile', () => {
    it('should get worker profile', async () => {
      const mockProfile = {
        id: workerId,
        email: 'worker@test.com',
        first_name: 'Test',
        last_name: 'Worker',
        role: UserRole.WORKER,
        phone: '+1234567890',
        hourly_rate: 25.00,
        company_id: companyId,
        is_active: true,
        created_at: new Date(),
        company_name: 'Test Company',
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockProfile] });

      const res = await request(app)
        .get('/api/mobile/worker/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('email', 'worker@test.com');
      expect(res.body.data).toHaveProperty('firstName', 'Test');
    });

    it('should require worker role', async () => {
      const adminToken = jwt.sign(
        { userId: uuidv4(), companyId, email: 'admin@test.com', role: UserRole.COMPANY_ADMIN },
        env.jwt.secret,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/mobile/worker/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/mobile/worker/profile', () => {
    it('should update worker profile', async () => {
      const mockProfile = {
        id: workerId,
        email: 'worker@test.com',
        first_name: 'Updated',
        last_name: 'Worker',
        role: UserRole.WORKER,
        phone: '+1234567890',
        hourly_rate: 25.00,
        company_id: companyId,
        is_active: true,
        created_at: new Date(),
        company_name: 'Test Company',
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: workerId }] }) // update
        .mockResolvedValueOnce({ rows: [mockProfile] }); // get updated profile

      const res = await request(app)
        .patch('/api/mobile/worker/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          phone: '+1234567890',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('firstName', 'Updated');
    });

    it('should return 404 if profile not found', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .patch('/api/mobile/worker/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'Updated' });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/mobile/worker/profile/stats', () => {
    it('should get worker statistics', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // total jobs
        .mockResolvedValueOnce({ rows: [{ count: '5' }] }) // completed jobs
        .mockResolvedValueOnce({ rows: [{ count: '3' }] }) // active jobs
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // safety incidents
        .mockResolvedValueOnce({ rows: [{ count: '8' }] }); // tasks completed

      const res = await request(app)
        .get('/api/mobile/worker/profile/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalJobsAssigned', 10);
      expect(res.body.data).toHaveProperty('completedJobs', 5);
      expect(res.body.data).toHaveProperty('activeJobs', 3);
      expect(res.body.data).toHaveProperty('safetyIncidentsReported', 2);
      expect(res.body.data).toHaveProperty('tasksCompleted', 8);
    });
  });
});

