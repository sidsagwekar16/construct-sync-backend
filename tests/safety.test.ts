// Safety API tests with mocked database

import request from 'supertest';
import { createApp } from '../src/app';
import { Application } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { mockDbQuery } from './setup';
import { v4 as uuidv4 } from 'uuid';
import { UserRole, SafetyStatus, SeverityLevel } from '../src/types/enums';

describe('Safety API', () => {
  let app: Application;
  let authToken: string;
  const companyId = uuidv4();
  const userId = uuidv4();
  const incidentId = uuidv4();
  const jobId = uuidv4();
  const siteId = uuidv4();

  beforeAll(() => {
    app = createApp();

    // Generate auth token
    authToken = jwt.sign(
      { userId, companyId, email: 'test@example.com', role: UserRole.COMPANY_ADMIN },
      env.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/safety/incidents', () => {
    it('should create a new safety incident with job', async () => {
      const mockIncident = {
        id: incidentId,
        job_id: jobId,
        site_id: null,
        reported_by: userId,
        incident_date: new Date('2024-01-15T10:30:00Z'),
        description: 'Worker slipped on wet floor',
        severity: SeverityLevel.MINOR,
        status: SafetyStatus.OPEN,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock: verifyJobCompany, createIncident, getUserDetails, getJobDetails
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: jobId }] } as any) // verifyJobCompany
        .mockResolvedValueOnce({ rows: [mockIncident] } as any) // createIncident
        .mockResolvedValueOnce({ rows: [{ id: userId, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }] } as any) // getUserDetails
        .mockResolvedValueOnce({ rows: [{ id: jobId, name: 'Test Job', job_number: 'JOB-001' }] } as any); // getJobDetails

      const response = await request(app)
        .post('/api/safety/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          jobId,
          incidentDate: '2024-01-15T10:30:00Z',
          description: 'Worker slipped on wet floor',
          severity: SeverityLevel.MINOR,
          status: SafetyStatus.OPEN,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Worker slipped on wet floor');
      expect(response.body.data.severity).toBe(SeverityLevel.MINOR);
      expect(response.body.data.status).toBe(SafetyStatus.OPEN);
      expect(response.body.message).toBe('Safety incident created successfully');
    });

    it('should create a new safety incident with site', async () => {
      const mockIncident = {
        id: incidentId,
        job_id: null,
        site_id: siteId,
        reported_by: userId,
        incident_date: new Date('2024-01-15T10:30:00Z'),
        description: 'Equipment malfunction',
        severity: SeverityLevel.MODERATE,
        status: SafetyStatus.OPEN,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock: verifySiteCompany, createIncident, getUserDetails, getSiteDetails
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: siteId }] } as any) // verifySiteCompany
        .mockResolvedValueOnce({ rows: [mockIncident] } as any) // createIncident
        .mockResolvedValueOnce({ rows: [{ id: userId, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }] } as any) // getUserDetails
        .mockResolvedValueOnce({ rows: [{ id: siteId, name: 'Test Site', address: '123 Main St' }] } as any); // getSiteDetails

      const response = await request(app)
        .post('/api/safety/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          siteId,
          incidentDate: '2024-01-15T10:30:00Z',
          description: 'Equipment malfunction',
          severity: SeverityLevel.MODERATE,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Equipment malfunction');
      expect(response.body.data.severity).toBe(SeverityLevel.MODERATE);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/safety/incidents')
        .send({
          jobId,
          incidentDate: '2024-01-15T10:30:00Z',
          description: 'Test incident',
        });

      expect(response.status).toBe(401);
    });

    it('should fail with invalid job ID', async () => {
      // Mock: verifyJobCompany returns empty (job doesn't exist)
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .post('/api/safety/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          jobId: uuidv4(),
          incidentDate: '2024-01-15T10:30:00Z',
          description: 'Test incident',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail without jobId or siteId', async () => {
      const response = await request(app)
        .post('/api/safety/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          incidentDate: '2024-01-15T10:30:00Z',
          description: 'Test incident',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/safety/incidents', () => {
    it('should list all safety incidents', async () => {
      const mockIncidents = [
        {
          id: incidentId,
          job_id: jobId,
          site_id: null,
          reported_by: userId,
          incident_date: new Date('2024-01-15T10:30:00Z'),
          description: 'Worker slipped on wet floor',
          severity: SeverityLevel.MINOR,
          status: SafetyStatus.OPEN,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Mock: findIncidentsByCompany (count + list), getUserDetails, getJobDetails
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any) // count
        .mockResolvedValueOnce({ rows: mockIncidents } as any) // list
        .mockResolvedValueOnce({ rows: [{ id: userId, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }] } as any) // getUserDetails
        .mockResolvedValueOnce({ rows: [{ id: jobId, name: 'Test Job', job_number: 'JOB-001' }] } as any); // getJobDetails

      const response = await request(app)
        .get('/api/safety/incidents')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.incidents).toHaveLength(1);
      expect(response.body.data.total).toBe(1);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(20);
    });

    it('should filter incidents by status', async () => {
      const mockIncidents = [
        {
          id: incidentId,
          job_id: jobId,
          site_id: null,
          reported_by: userId,
          incident_date: new Date('2024-01-15T10:30:00Z'),
          description: 'Worker slipped on wet floor',
          severity: SeverityLevel.MINOR,
          status: SafetyStatus.OPEN,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Mock: findIncidentsByCompany with status filter
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
        .mockResolvedValueOnce({ rows: mockIncidents } as any)
        .mockResolvedValueOnce({ rows: [{ id: userId, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: jobId, name: 'Test Job', job_number: 'JOB-001' }] } as any);

      const response = await request(app)
        .get('/api/safety/incidents?status=open')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.incidents).toHaveLength(1);
    });

    it('should filter incidents by severity', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get('/api/safety/incidents?severity=critical')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.incidents).toHaveLength(0);
    });

    it('should paginate results', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '5' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get('/api/safety/incidents?page=2&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.page).toBe(2);
      expect(response.body.data.limit).toBe(10);
    });
  });

  describe('GET /api/safety/incidents/:id', () => {
    it('should get a safety incident by ID', async () => {
      const mockIncident = {
        id: incidentId,
        job_id: jobId,
        site_id: null,
        reported_by: userId,
        incident_date: new Date('2024-01-15T10:30:00Z'),
        description: 'Worker slipped on wet floor',
        severity: SeverityLevel.MINOR,
        status: SafetyStatus.OPEN,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock: findIncidentById, getUserDetails, getJobDetails
      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockIncident] } as any)
        .mockResolvedValueOnce({ rows: [{ id: userId, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: jobId, name: 'Test Job', job_number: 'JOB-001' }] } as any);

      const response = await request(app)
        .get(`/api/safety/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(incidentId);
      expect(response.body.data.description).toBe('Worker slipped on wet floor');
    });

    it('should return 404 for non-existent incident', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get(`/api/safety/incidents/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/safety/incidents/:id', () => {
    it('should update a safety incident', async () => {
      const existingIncident = {
        id: incidentId,
        job_id: jobId,
        site_id: null,
        reported_by: userId,
        incident_date: new Date('2024-01-15T10:30:00Z'),
        description: 'Worker slipped on wet floor',
        severity: SeverityLevel.MINOR,
        status: SafetyStatus.OPEN,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedIncident = {
        ...existingIncident,
        status: SafetyStatus.RESOLVED,
        severity: SeverityLevel.MODERATE,
        description: 'Worker slipped on wet floor - First aid applied',
      };

      // Mock: findIncidentById, updateIncident, getUserDetails, getJobDetails
      mockDbQuery
        .mockResolvedValueOnce({ rows: [existingIncident] } as any)
        .mockResolvedValueOnce({ rows: [updatedIncident] } as any)
        .mockResolvedValueOnce({ rows: [{ id: userId, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: jobId, name: 'Test Job', job_number: 'JOB-001' }] } as any);

      const response = await request(app)
        .patch(`/api/safety/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: SafetyStatus.RESOLVED,
          severity: SeverityLevel.MODERATE,
          description: 'Worker slipped on wet floor - First aid applied',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(SafetyStatus.RESOLVED);
      expect(response.body.data.severity).toBe(SeverityLevel.MODERATE);
      expect(response.body.message).toBe('Safety incident updated successfully');
    });

    it('should return 404 for non-existent incident', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .patch(`/api/safety/incidents/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: SafetyStatus.RESOLVED,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/safety/incidents/:id', () => {
    it('should delete a safety incident', async () => {
      // Mock: deleteIncident
      mockDbQuery.mockResolvedValueOnce({ rows: [{ id: incidentId }] } as any);

      const response = await request(app)
        .delete(`/api/safety/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Safety incident deleted successfully');
    });

    it('should return 404 for non-existent incident', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .delete(`/api/safety/incidents/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/safety/incidents/statistics', () => {
    it('should get incident statistics', async () => {
      // Mock: countIncidentsByStatus, countIncidentsBySeverity
      mockDbQuery
        .mockResolvedValueOnce({
          rows: [
            { status: SafetyStatus.OPEN, count: '5' },
            { status: SafetyStatus.INVESTIGATING, count: '3' },
            { status: SafetyStatus.RESOLVED, count: '10' },
            { status: SafetyStatus.CLOSED, count: '15' },
          ],
        } as any)
        .mockResolvedValueOnce({
          rows: [
            { severity: SeverityLevel.MINOR, count: '12' },
            { severity: SeverityLevel.MODERATE, count: '8' },
            { severity: SeverityLevel.MAJOR, count: '5' },
            { severity: SeverityLevel.CRITICAL, count: '2' },
            { severity: SeverityLevel.FATAL, count: '0' },
          ],
        } as any);

      const response = await request(app)
        .get('/api/safety/incidents/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.byStatus).toBeDefined();
      expect(response.body.data.bySeverity).toBeDefined();
      expect(response.body.data.total).toBe(33);
      expect(response.body.data.byStatus[SafetyStatus.OPEN]).toBe(5);
      expect(response.body.data.bySeverity[SeverityLevel.MINOR]).toBe(12);
    });
  });
});

