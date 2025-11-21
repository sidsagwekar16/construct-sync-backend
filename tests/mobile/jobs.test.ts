// Mobile Jobs API Tests

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { mockDbQuery } from '../setup';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';
import { v4 as uuidv4 } from 'uuid';
import { UserRole, JobStatus, PriorityLevel } from '../../src/types/enums';

describe('Mobile Jobs API', () => {
  let app: Application;
  let authToken: string;
  const companyId = uuidv4();
  const userId = uuidv4();
  const siteId = uuidv4();
  const jobId = uuidv4();

  beforeAll(() => {
    app = createApp();

    // Generate auth token
    authToken = jwt.sign(
      { userId, companyId, email: 'admin@test.com', role: UserRole.COMPANY_ADMIN },
      env.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/mobile/jobs', () => {
    it('should list jobs with pagination', async () => {
      const mockJobs = [
        {
          id: jobId,
          name: 'Test Job',
          description: 'Test Description',
          job_type: 'Construction',
          status: JobStatus.IN_PROGRESS,
          priority: PriorityLevel.HIGH,
          start_date: new Date(),
          end_date: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          site_address: '123 Test St',
          assigned_to_first_name: 'John',
          assigned_to_last_name: 'Doe',
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }) // total count
        .mockResolvedValueOnce({ rows: mockJobs }); // job list

      const res = await request(app)
        .get('/api/mobile/jobs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('page');
      expect(res.body.data).toHaveProperty('pageSize');
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('hasMore');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should filter jobs by status', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/mobile/jobs?status=draft')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/mobile/jobs');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/mobile/jobs/:id', () => {
    it('should get job by ID', async () => {
      const mockJob = {
        id: jobId,
        name: 'Test Job',
        description: 'Test Description',
        job_type: 'Construction',
        status: JobStatus.IN_PROGRESS,
        priority: PriorityLevel.HIGH,
        start_date: new Date(),
        end_date: new Date(),
        completed_date: null,
        created_at: new Date(),
        updated_at: new Date(),
        site_address: '123 Test St',
        site_latitude: 40.7128,
        site_longitude: -74.0060,
        assigned_to_first_name: 'John',
        assigned_to_last_name: 'Doe',
        created_by_first_name: 'Admin',
        created_by_last_name: 'User',
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockJob] });

      const res = await request(app)
        .get(`/api/mobile/jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(jobId);
      expect(res.body.data).toHaveProperty('name');
    });

    it('should return 404 for non-existent job', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/mobile/jobs/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/mobile/jobs', () => {
    it('should create a new job', async () => {
      const newJobData = {
        name: 'New Job',
        description: 'New Description',
        siteId: siteId,
        status: JobStatus.DRAFT,
        priority: PriorityLevel.MEDIUM,
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: siteId }] }) // verify site exists
        .mockResolvedValueOnce({ rows: [] }) // insert job
        .mockResolvedValueOnce({ rows: [{ ...newJobData, id: uuidv4(), created_at: new Date(), updated_at: new Date() }] }); // fetch created job

      const res = await request(app)
        .post('/api/mobile/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newJobData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
    });
  });

  describe('GET /api/mobile/jobs/:id/tasks', () => {
    it('should get tasks for a job', async () => {
      const mockTasks = [
        {
          id: uuidv4(),
          name: 'Test Task',
          description: 'Test Description',
          status: 'pending',
          type: 'general',
          due_date: new Date(),
          assigned_to_first_name: 'John',
          assigned_to_last_name: 'Doe',
        },
      ];

      mockDbQuery.mockResolvedValueOnce({ rows: mockTasks });

      const res = await request(app)
        .get(`/api/mobile/jobs/${jobId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/mobile/jobs/:id/tasks', () => {
    it('should create a task for a job', async () => {
      const taskData = {
        name: 'Test Task',
        description: 'Test Description',
        status: 'pending',
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: jobId }] }) // verify job exists
        .mockResolvedValueOnce({ rows: [] }) // insert task
        .mockResolvedValueOnce({ rows: [{ ...taskData, id: uuidv4() }] }); // fetch created task

      const res = await request(app)
        .post(`/api/mobile/jobs/${jobId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
    });
  });

  describe('GET /api/mobile/jobs/:id/workers', () => {
    it('should get workers for a job', async () => {
      const mockWorkers = [
        {
          id: uuidv4(),
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone_number: '1234567890',
          role: 'worker',
        },
      ];

      mockDbQuery.mockResolvedValueOnce({ rows: mockWorkers });

      const res = await request(app)
        .get(`/api/mobile/jobs/${jobId}/workers`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/mobile/jobs/all-workers', () => {
    it('should get all workers', async () => {
      const mockWorkers = [
        {
          id: uuidv4(),
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone_number: '1234567890',
          role: 'worker',
        },
      ];

      mockDbQuery.mockResolvedValueOnce({ rows: mockWorkers });

      const res = await request(app)
        .get('/api/mobile/jobs/all-workers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
