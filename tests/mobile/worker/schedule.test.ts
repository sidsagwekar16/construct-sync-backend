// Worker Schedule API Tests

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../../src/app';
import { mockDbQuery } from '../../setup';
import jwt from 'jsonwebtoken';
import { env } from '../../../src/config/env';
import { v4 as uuidv4 } from 'uuid';
import { UserRole, JobStatus, PriorityLevel } from '../../../src/types/enums';

describe('Worker Schedule API', () => {
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

  describe('GET /api/mobile/worker/schedule', () => {
    it('should get worker schedule with date range', async () => {
      const mockJobs = [
        {
          id: uuidv4(),
          name: 'Test Job',
          job_type: 'Construction',
          status: JobStatus.IN_PROGRESS,
          priority: PriorityLevel.HIGH,
          start_date: new Date(),
          end_date: new Date(),
          site_id: uuidv4(),
          site_name: 'Test Site',
          site_address: '123 Test St',
        },
      ];

      mockDbQuery.mockResolvedValueOnce({ rows: mockJobs });

      const res = await request(app)
        .get('/api/mobile/worker/schedule')
        .query({
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should require worker role', async () => {
      const adminToken = jwt.sign(
        { userId: uuidv4(), companyId, email: 'admin@test.com', role: UserRole.COMPANY_ADMIN },
        env.jwt.secret,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/mobile/worker/schedule')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/mobile/worker/schedule/today', () => {
    it('should get today jobs', async () => {
      const mockJobs = [
        {
          id: uuidv4(),
          name: 'Today Job',
          job_type: 'Construction',
          status: JobStatus.IN_PROGRESS,
          priority: PriorityLevel.HIGH,
          start_date: new Date(),
          end_date: new Date(),
          site_id: uuidv4(),
          site_name: 'Test Site',
          site_address: '123 Test St',
        },
      ];

      mockDbQuery.mockResolvedValueOnce({ rows: mockJobs });

      const res = await request(app)
        .get('/api/mobile/worker/schedule/today')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/mobile/worker/schedule/week', () => {
    it('should get this week jobs', async () => {
      const mockJobs = [
        {
          id: uuidv4(),
          name: 'Week Job',
          job_type: 'Construction',
          status: JobStatus.IN_PROGRESS,
          priority: PriorityLevel.HIGH,
          start_date: new Date(),
          end_date: new Date(),
          site_id: uuidv4(),
          site_name: 'Test Site',
          site_address: '123 Test St',
        },
      ];

      mockDbQuery.mockResolvedValueOnce({ rows: mockJobs });

      const res = await request(app)
        .get('/api/mobile/worker/schedule/week')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});

