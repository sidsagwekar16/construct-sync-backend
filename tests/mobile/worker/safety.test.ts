// Worker Safety API Tests

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../../src/app';
import { mockDbQuery } from '../../setup';
import jwt from 'jsonwebtoken';
import { env } from '../../../src/config/env';
import { v4 as uuidv4 } from 'uuid';
import { UserRole, SeverityLevel, SafetyStatus } from '../../../src/types/enums';

describe('Worker Safety API', () => {
  let app: Application;
  let authToken: string;
  const companyId = uuidv4();
  const workerId = uuidv4();
  const incidentId = uuidv4();
  const jobId = uuidv4();

  beforeAll(() => {
    app = createApp();

    authToken = jwt.sign(
      { userId: workerId, companyId, email: 'worker@test.com', role: UserRole.WORKER },
      env.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/mobile/worker/safety/incidents', () => {
    it('should list incidents reported by worker', async () => {
      const mockIncidents = [
        {
          id: incidentId,
          job_id: jobId,
          site_id: uuidv4(),
          incident_date: new Date(),
          description: 'Test incident',
          severity: SeverityLevel.MINOR,
          status: SafetyStatus.OPEN,
          created_at: new Date(),
          updated_at: new Date(),
          job_name: 'Test Job',
          site_name: 'Test Site',
          site_address: '123 Test St',
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockIncidents });

      const res = await request(app)
        .get('/api/mobile/worker/safety/incidents')
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
        .get('/api/mobile/worker/safety/incidents')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/mobile/worker/safety/incidents', () => {
    it('should create safety incident for assigned job', async () => {
      const mockJob = {
        id: jobId,
        site_id: uuidv4(),
      };

      const mockIncident = {
        id: incidentId,
        job_id: jobId,
        site_id: mockJob.site_id,
        reported_by: workerId,
        incident_date: new Date(),
        description: 'Test incident',
        severity: SeverityLevel.MINOR,
        status: SafetyStatus.OPEN,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockJob] }) // verify job assignment
        .mockResolvedValueOnce({ rows: [mockIncident] }) // create incident
        .mockResolvedValueOnce({ rows: [{ job_name: 'Test Job', site_name: 'Test Site', site_address: '123 Test St' }] }); // get details

      const res = await request(app)
        .post('/api/mobile/worker/safety/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          jobId,
          incidentDate: new Date().toISOString(),
          description: 'Test incident',
          severity: SeverityLevel.MINOR,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('description', 'Test incident');
    });

    it('should return 400 if not assigned to job', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/mobile/worker/safety/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          jobId: uuidv4(),
          incidentDate: new Date().toISOString(),
          description: 'Test incident',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/mobile/worker/safety/incidents/statistics', () => {
    it('should get worker safety statistics', async () => {
      mockDbQuery.mockResolvedValueOnce({
        rows: [
          { total: '2', severity: SeverityLevel.MINOR, status: SafetyStatus.OPEN },
          { total: '1', severity: SeverityLevel.MODERATE, status: SafetyStatus.RESOLVED },
        ],
      });

      const res = await request(app)
        .get('/api/mobile/worker/safety/incidents/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalIncidents');
      expect(res.body.data).toHaveProperty('bySeverity');
      expect(res.body.data).toHaveProperty('byStatus');
    });
  });
});



