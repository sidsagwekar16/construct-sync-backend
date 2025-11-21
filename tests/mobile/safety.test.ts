// Mobile Safety API Tests

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { mockDbQuery } from '../setup';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';
import { v4 as uuidv4 } from 'uuid';
import { UserRole, SafetyStatus, SeverityLevel } from '../../src/types/enums';

describe('Mobile Safety API', () => {
  let app: Application;
  let authToken: string;
  const companyId = uuidv4();
  const userId = uuidv4();
  const siteId = uuidv4();
  const jobId = uuidv4();
  const incidentId = uuidv4();

  beforeAll(() => {
    app = createApp();

    // Generate auth token
    authToken = jwt.sign(
      { userId, companyId, email: 'admin@test.com', role: UserRole.COMPANY_ADMIN },
      env.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/mobile/safety/incidents/statistics', () => {
    it('should return safety statistics', async () => {
      const mockIncidents = [
        { status: SafetyStatus.OPEN, severity: SeverityLevel.MINOR },
        { status: SafetyStatus.INVESTIGATING, severity: SeverityLevel.MODERATE },
        { status: SafetyStatus.RESOLVED, severity: SeverityLevel.MINOR },
      ];

      mockDbQuery.mockResolvedValueOnce({ rows: mockIncidents });

      const res = await request(app)
        .get('/api/mobile/safety/incidents/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('byStatus');
      expect(res.body.data).toHaveProperty('bySeverity');
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data.total).toBe(3);
    });
  });

  describe('GET /api/mobile/safety/incidents', () => {
    it('should list safety incidents', async () => {
      const mockIncidents = [
        {
          id: incidentId,
          incident_date: new Date(),
          description: 'Worker slipped on wet floor',
          severity: SeverityLevel.MINOR,
          status: SafetyStatus.OPEN,
          job_name: 'Test Job',
          site_name: 'Test Site',
          reported_by_first_name: 'John',
          reported_by_last_name: 'Doe',
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }) // total count
        .mockResolvedValueOnce({ rows: mockIncidents }); // incident list

      const res = await request(app)
        .get('/api/mobile/safety/incidents')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should filter incidents by severity', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/mobile/safety/incidents?severity=minor')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/mobile/safety/incidents');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/mobile/safety/incidents', () => {
    it('should create a safety incident', async () => {
      const incidentData = {
        jobId: jobId,
        siteId: siteId,
        incidentDate: new Date().toISOString(),
        description: 'Test safety incident',
        severity: SeverityLevel.MINOR,
        status: SafetyStatus.OPEN,
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: jobId }] }) // verify job exists
        .mockResolvedValueOnce({ rows: [] }) // insert incident
        .mockResolvedValueOnce({ rows: [{ ...incidentData, id: uuidv4(), created_at: new Date() }] }); // fetch created incident

      const res = await request(app)
        .post('/api/mobile/safety/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incidentData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
    });

    it('should require required fields', async () => {
      const res = await request(app)
        .post('/api/mobile/safety/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/mobile/safety/incidents/:id', () => {
    it('should get incident details', async () => {
      const mockIncident = {
        id: incidentId,
        incident_date: new Date(),
        description: 'Test incident for details',
        severity: SeverityLevel.MINOR,
        status: SafetyStatus.OPEN,
        job_name: 'Test Job',
        site_name: 'Test Site',
        reported_by_first_name: 'John',
        reported_by_last_name: 'Doe',
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockIncident] });

      const res = await request(app)
        .get(`/api/mobile/safety/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(incidentId);
    });

    it('should return 404 for non-existent incident', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/mobile/safety/incidents/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/mobile/safety/incidents/:id', () => {
    it('should update a safety incident', async () => {
      const existingIncident = {
        id: incidentId,
        company_id: companyId,
      };

      const updateData = {
        status: SafetyStatus.RESOLVED,
        description: 'Updated description',
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [existingIncident] }) // verify incident exists
        .mockResolvedValueOnce({ rows: [] }) // update incident
        .mockResolvedValueOnce({ rows: [{ ...existingIncident, ...updateData }] }); // fetch updated incident

      const res = await request(app)
        .patch(`/api/mobile/safety/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/mobile/safety/incidents/:id', () => {
    it('should delete a safety incident', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: incidentId }] }) // verify incident exists
        .mockResolvedValueOnce({ rows: [] }); // soft delete

      const res = await request(app)
        .delete(`/api/mobile/safety/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent incident', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .delete('/api/mobile/safety/incidents/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});
