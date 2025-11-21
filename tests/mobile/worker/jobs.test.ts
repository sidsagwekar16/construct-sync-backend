// Worker Jobs API Tests

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../../src/app';
import { mockDbQuery } from '../../setup';
import jwt from 'jsonwebtoken';
import { env } from '../../../src/config/env';
import { v4 as uuidv4 } from 'uuid';
import { UserRole, JobStatus, PriorityLevel, TaskStatus } from '../../../src/types/enums';

describe('Worker Jobs API', () => {
  let app: Application;
  let authToken: string;
  const companyId = uuidv4();
  const workerId = uuidv4();
  const jobId = uuidv4();
  const taskId = uuidv4();

  beforeAll(() => {
    app = createApp();

    // Generate worker auth token
    authToken = jwt.sign(
      { userId: workerId, companyId, email: 'worker@test.com', role: UserRole.WORKER },
      env.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/mobile/worker/jobs', () => {
    it('should list jobs assigned to worker', async () => {
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
          site_id: uuidv4(),
          created_at: new Date(),
          updated_at: new Date(),
          site_address: '123 Test St',
          site_name: 'Test Site',
          assigned_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }) // total count
        .mockResolvedValueOnce({ rows: mockJobs }); // job list

      const res = await request(app)
        .get('/api/mobile/worker/jobs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('total');
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data[0]).toHaveProperty('name');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/mobile/worker/jobs');

      expect(res.status).toBe(401);
    });

    it('should require worker role', async () => {
      const adminToken = jwt.sign(
        { userId: uuidv4(), companyId, email: 'admin@test.com', role: UserRole.COMPANY_ADMIN },
        env.jwt.secret,
        { expiresIn: '1h' }
      );

      mockDbQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const res = await request(app)
        .get('/api/mobile/worker/jobs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/mobile/worker/jobs/:id', () => {
    it('should get job details if assigned', async () => {
      const mockJob = {
        id: jobId,
        name: 'Test Job',
        description: 'Test Description',
        job_type: 'Construction',
        status: JobStatus.IN_PROGRESS,
        priority: PriorityLevel.HIGH,
        start_date: new Date(),
        end_date: new Date(),
        site_id: uuidv4(),
        created_at: new Date(),
        updated_at: new Date(),
        site_address: '123 Test St',
        site_name: 'Test Site',
        assigned_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockJob] });

      const res = await request(app)
        .get(`/api/mobile/worker/jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'Test Job');
    });

    it('should return 404 if job not found or not assigned', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get(`/api/mobile/worker/jobs/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/mobile/worker/jobs/:id/tasks', () => {
    it('should get job tasks if assigned to job', async () => {
      const mockTasks = [
        {
          id: taskId,
          name: 'Task 1',
          title: 'Test Task',
          description: 'Task description',
          status: TaskStatus.IN_PROGRESS,
          priority: PriorityLevel.MEDIUM,
          due_date: new Date(),
          assigned_to: workerId,
          assigned_to_name: 'Test Worker',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // access check
        .mockResolvedValueOnce({ rows: mockTasks }); // tasks

      const res = await request(app)
        .get(`/api/mobile/worker/jobs/${jobId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 403 if worker not assigned to job', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] }); // access check fails

      const res = await request(app)
        .get(`/api/mobile/worker/jobs/${uuidv4()}/tasks`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/mobile/worker/jobs/:id/tasks/:taskId', () => {
    it('should update task status', async () => {
      const mockTask = {
        id: taskId,
        name: 'Task 1',
        title: 'Test Task',
        description: 'Task description',
        status: TaskStatus.COMPLETED,
        priority: PriorityLevel.MEDIUM,
        due_date: new Date(),
        assigned_to: workerId,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // access check
        .mockResolvedValueOnce({ rows: [mockTask] }) // update task
        .mockResolvedValueOnce({ rows: [{ name: 'Test Worker' }] }); // get user name

      const res = await request(app)
        .patch(`/api/mobile/worker/jobs/${jobId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: TaskStatus.COMPLETED });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status', TaskStatus.COMPLETED);
    });

    it('should return 403 if worker not assigned to job', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] }); // access check fails

      const res = await request(app)
        .patch(`/api/mobile/worker/jobs/${uuidv4()}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: TaskStatus.COMPLETED });

      expect(res.status).toBe(403);
    });
  });
});

