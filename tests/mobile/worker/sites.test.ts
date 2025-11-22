// Worker Sites API Tests

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../../src/app';
import { mockDbQuery } from '../../setup';
import jwt from 'jsonwebtoken';
import { env } from '../../../src/config/env';
import { v4 as uuidv4 } from 'uuid';
import { UserRole, SiteStatus } from '../../../src/types/enums';

describe('Worker Sites API', () => {
  let app: Application;
  let authToken: string;
  const companyId = uuidv4();
  const workerId = uuidv4();
  const siteId = uuidv4();

  beforeAll(() => {
    app = createApp();

    authToken = jwt.sign(
      { userId: workerId, companyId, email: 'worker@test.com', role: UserRole.WORKER },
      env.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/mobile/worker/sites', () => {
    it('should list sites where worker has jobs', async () => {
      const mockSites = [
        {
          id: siteId,
          name: 'Test Site',
          address: '123 Test St',
          latitude: 40.7128,
          longitude: -74.0060,
          status: SiteStatus.ACTIVE,
          created_at: new Date(),
          updated_at: new Date(),
          job_count: '2',
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockSites });

      const res = await request(app)
        .get('/api/mobile/worker/sites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should require worker role', async () => {
      const adminToken = jwt.sign(
        { userId: uuidv4(), companyId, email: 'admin@test.com', role: UserRole.COMPANY_ADMIN },
        env.jwt.secret,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/mobile/worker/sites')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/mobile/worker/sites/:id', () => {
    it('should get site details if worker has jobs there', async () => {
      const mockSite = {
        id: siteId,
        name: 'Test Site',
        address: '123 Test St',
        latitude: 40.7128,
        longitude: -74.0060,
        status: SiteStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
        job_count: '2',
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockSite] });

      const res = await request(app)
        .get(`/api/mobile/worker/sites/${siteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'Test Site');
    });

    it('should return 404 if no access', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get(`/api/mobile/worker/sites/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/mobile/worker/sites/:id/jobs', () => {
    it('should get worker jobs at site', async () => {
      const mockJobs = [
        {
          id: uuidv4(),
          name: 'Job 1',
          job_type: 'Construction',
          status: 'in_progress',
          start_date: new Date(),
          end_date: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] })
        .mockResolvedValueOnce({ rows: mockJobs });

      const res = await request(app)
        .get(`/api/mobile/worker/sites/${siteId}/jobs`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 403 if no access to site', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get(`/api/mobile/worker/sites/${uuidv4()}/jobs`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(403);
    });
  });
});



