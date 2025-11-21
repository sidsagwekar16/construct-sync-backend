// Mobile Dashboard API Tests

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { mockDbQuery } from '../setup';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../../src/types/enums';

describe('Mobile Dashboard API', () => {
  let app: Application;
  let authToken: string;
  const companyId = uuidv4();
  const userId = uuidv4();

  beforeAll(() => {
    app = createApp();

    // Generate auth token
    authToken = jwt.sign(
      { userId, companyId, email: 'admin@test.com', role: UserRole.COMPANY_ADMIN },
      env.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/mobile/dashboard/metrics', () => {
    it('should return dashboard metrics', async () => {
      // Mock database queries with proper QueryResult structure
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '5' }], rowCount: 1, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ count: '3' }], rowCount: 1, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ count: '12' }], rowCount: 1, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ count: '2' }], rowCount: 1, command: '', oid: 0, fields: [] });

      const res = await request(app)
        .get('/api/mobile/dashboard/metrics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('activeSites');
      expect(res.body.data).toHaveProperty('totalJobsToday');
      expect(res.body.data).toHaveProperty('activeWorkers');
      expect(res.body.data).toHaveProperty('safetyIncidents');
      expect(res.body.data).toHaveProperty('generatedAt');
      expect(res.body.data.activeSites).toBe(5);
      expect(res.body.data.totalJobsToday).toBe(3);
      expect(res.body.data.activeWorkers).toBe(12);
      expect(res.body.data.safetyIncidents).toBe(2);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/mobile/dashboard/metrics');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/mobile/dashboard/activity', () => {
    it('should return activity feed', async () => {
      const mockJobs = [
        {
          id: uuidv4(),
          name: 'New Construction Project',
          created_at: new Date(),
          updated_at: new Date(),
          address: '123 Main St',
          site_id: uuidv4(),
          created_by_name: 'John Doe',
        },
      ];

      const mockTasks = [
        {
          id: uuidv4(),
          name: 'Complete Foundation',
          updated_at: new Date(),
          job_id: uuidv4(),
          job_name: 'Building Project',
          assigned_to_name: 'Jane Smith',
        },
      ];

      const mockIncidents = [
        {
          id: uuidv4(),
          description: 'Minor slip hazard',
          created_at: new Date(),
          severity: 'minor',
          job_id: uuidv4(),
          job_name: 'Site Work',
          address: '456 Oak Ave',
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: mockJobs, rowCount: mockJobs.length, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockTasks, rowCount: mockTasks.length, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockIncidents, rowCount: mockIncidents.length, command: '', oid: 0, fields: [] });

      const res = await request(app)
        .get('/api/mobile/dashboard/activity')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('activities');
      expect(res.body.data).toHaveProperty('generatedAt');
      expect(Array.isArray(res.body.data.activities)).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/mobile/dashboard/activity');

      expect(res.status).toBe(401);
    });
  });
});

