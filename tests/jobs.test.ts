// Jobs API tests with mocked database

import request from 'supertest';
import { createApp } from '../src/app';
import { Application } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { mockDbQuery } from './setup';
import { v4 as uuidv4 } from 'uuid';
import { UserRole, JobStatus, PriorityLevel } from '../src/types/enums';

describe('Jobs API', () => {
  let app: Application;
  let authToken: string;
  const companyId = uuidv4();
  const userId = uuidv4();
  const jobId = uuidv4();
  const siteId = uuidv4();
  const workerId1 = uuidv4();
  const workerId2 = uuidv4();
  const managerId1 = uuidv4();

  beforeAll(() => {
    app = createApp();

    // Generate auth token
    authToken = jwt.sign(
      { userId, companyId, email: 'test@example.com', role: UserRole.COMPANY_ADMIN },
      env.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/jobs', () => {
    it('should create a new job with all fields', async () => {
      const mockJob = {
        id: jobId,
        company_id: companyId,
        site_id: siteId,
        name: 'New Job',
        description: 'New Job Description',
        job_number: 'JOB-002',
        job_type: 'Commercial Construction',
        status: JobStatus.PLANNED,
        priority: PriorityLevel.HIGH,
        start_date: new Date('2024-01-01T08:00:00Z'),
        end_date: new Date('2024-12-31T17:00:00Z'),
        completed_date: null,
        assigned_to: userId,
        created_by: userId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock: verifySiteCompany, verifyUserCompany (assignedTo), verifyUserCompany (worker1), 
      // verifyUserCompany (worker2), verifyUserCompany (manager1), createJob, addWorkers, addManagers,
      // getUserDetails (assignedTo), getUserDetails (createdBy), getJobWorkersWithDetails, getJobManagersWithDetails
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: siteId }] } as any) // verifySiteCompany
        .mockResolvedValueOnce({ rows: [{ id: userId }] } as any) // verifyUserCompany (assignedTo)
        .mockResolvedValueOnce({ rows: [{ id: workerId1 }] } as any) // verifyUserCompany (worker1)
        .mockResolvedValueOnce({ rows: [{ id: workerId2 }] } as any) // verifyUserCompany (worker2)
        .mockResolvedValueOnce({ rows: [{ id: managerId1 }] } as any) // verifyUserCompany (manager1)
        .mockResolvedValueOnce({ rows: [mockJob] } as any) // createJob
        .mockResolvedValueOnce({ rows: [] } as any) // addWorkers
        .mockResolvedValueOnce({ rows: [] } as any) // addManagers
        .mockResolvedValueOnce({ rows: [{ id: userId, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }] } as any) // getUserDetails (assignedTo)
        .mockResolvedValueOnce({ rows: [{ id: userId, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }] } as any) // getUserDetails (createdBy)
        .mockResolvedValueOnce({ rows: [{ id: workerId1, first_name: 'Worker', last_name: 'One', email: 'worker1@example.com' }] } as any) // getJobWorkersWithDetails
        .mockResolvedValueOnce({ rows: [{ id: managerId1, first_name: 'Manager', last_name: 'One', email: 'manager1@example.com' }] } as any); // getJobManagersWithDetails

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Job',
          description: 'New Job Description',
          jobNumber: 'JOB-002',
          jobType: 'Commercial Construction',
          siteId,
          status: JobStatus.PLANNED,
          priority: PriorityLevel.HIGH,
          startDate: '2024-01-01T08:00:00Z',
          endDate: '2024-12-31T17:00:00Z',
          assignedTo: userId,
          workerIds: [workerId1, workerId2],
          managerIds: [managerId1],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Job');
      expect(response.body.data.jobNumber).toBe('JOB-002');
      expect(response.body.data.status).toBe(JobStatus.PLANNED);
      expect(response.body.data.priority).toBe(PriorityLevel.HIGH);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .send({
          name: 'New Job',
          description: 'New Job Description',
        });

      expect(response.status).toBe(401);
    });

    it('should fail with invalid site', async () => {
      // Mock: verifySiteCompany returns empty
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Job',
          siteId: uuidv4(), // Non-existent site
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Site does not exist');
    });

    it('should fail with invalid date range', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Job',
          startDate: '2024-12-31T17:00:00Z',
          endDate: '2024-01-01T08:00:00Z',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Validation failed');
    });

    it('should fail with invalid worker ID', async () => {
      const invalidWorkerId = uuidv4();
      
      // Mock: verifyUserCompany returns empty for the worker
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Job',
          workerIds: [invalidWorkerId],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Worker');
      expect(response.body.error).toContain('does not exist');
    });
  });

  describe('GET /api/jobs', () => {
    it('should list jobs for the company', async () => {
      const mockJobs = [{
        id: jobId,
        company_id: companyId,
        site_id: siteId,
        name: 'Test Job',
        description: 'Test Description',
        job_number: 'JOB-001',
        job_type: 'Residential',
        status: JobStatus.DRAFT,
        priority: PriorityLevel.MEDIUM,
        start_date: null,
        end_date: null,
        completed_date: null,
        assigned_to: null,
        created_by: userId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      }];

      // Mock: countQuery, listQuery, getUserDetails (createdBy), getJobWorkersWithDetails, getJobManagersWithDetails
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any) // count
        .mockResolvedValueOnce({ rows: mockJobs } as any) // list
        .mockResolvedValueOnce({ rows: [{ id: userId, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }] } as any) // getUserDetails (createdBy)
        .mockResolvedValueOnce({ rows: [] } as any) // getJobWorkersWithDetails
        .mockResolvedValueOnce({ rows: [] } as any); // getJobManagersWithDetails

      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.jobs)).toBe(true);
      expect(response.body.data.jobs.length).toBe(1);
    });

    it('should filter jobs by status', async () => {
      const mockJobs = [{
        id: jobId,
        company_id: companyId,
        site_id: siteId,
        name: 'Test Job',
        status: JobStatus.DRAFT,
        priority: null,
        job_type: null,
        assigned_to: null,
        created_by: userId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      }];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
        .mockResolvedValueOnce({ rows: mockJobs } as any)
        .mockResolvedValueOnce({ rows: [{ id: userId, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get(`/api/jobs?status=${JobStatus.DRAFT}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.jobs.every((job: any) => job.status === JobStatus.DRAFT)).toBe(true);
    });

    it('should filter jobs by priority', async () => {
      const mockJobs = [{
        id: jobId,
        company_id: companyId,
        name: 'Test Job',
        status: JobStatus.DRAFT,
        priority: PriorityLevel.HIGH,
        job_type: null,
        assigned_to: null,
        created_by: userId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      }];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
        .mockResolvedValueOnce({ rows: mockJobs } as any)
        .mockResolvedValueOnce({ rows: [{ id: userId, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get(`/api/jobs?priority=${PriorityLevel.HIGH}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.jobs.every((job: any) => job.priority === PriorityLevel.HIGH)).toBe(true);
    });
  });

  describe('GET /api/jobs/:id', () => {
    it('should get a job by id with all relationships', async () => {
      const mockJob = {
        id: jobId,
        company_id: companyId,
        site_id: siteId,
        name: 'Test Job',
        description: 'Test Description',
        job_number: 'JOB-001',
        job_type: 'Commercial',
        status: JobStatus.DRAFT,
        priority: PriorityLevel.MEDIUM,
        start_date: null,
        end_date: null,
        completed_date: null,
        assigned_to: userId,
        created_by: userId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock: findJobById, getUserDetails (assignedTo), getUserDetails (createdBy), getJobWorkersWithDetails, getJobManagersWithDetails
      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockJob] } as any)
        .mockResolvedValueOnce({ rows: [{ id: userId, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: userId, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: workerId1, first_name: 'Worker', last_name: 'One', email: 'worker1@example.com' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: managerId1, first_name: 'Manager', last_name: 'One', email: 'manager1@example.com' }] } as any);

      const response = await request(app)
        .get(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(jobId);
      expect(response.body.data.name).toBe('Test Job');
      expect(response.body.data).toHaveProperty('workers');
      expect(response.body.data).toHaveProperty('managers');
      expect(response.body.data).toHaveProperty('createdByUser');
    });

    it('should return 404 for non-existent job', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get(`/api/jobs/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/jobs/:id', () => {
    it('should update a job', async () => {
      const mockJob = {
        id: jobId,
        company_id: companyId,
        site_id: siteId,
        name: 'Test Job',
        status: JobStatus.DRAFT,
        priority: PriorityLevel.MEDIUM,
        job_type: 'Residential',
        start_date: null,
        end_date: null,
        completed_date: null,
        assigned_to: null,
        created_by: userId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedJob = {
        ...mockJob,
        name: 'Updated Job',
        description: 'Updated Description',
        status: JobStatus.IN_PROGRESS,
        priority: PriorityLevel.HIGH,
      };

      // Mock: findJobById, updateJob, getUserDetails (createdBy), getJobWorkersWithDetails, getJobManagersWithDetails
      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockJob] } as any)
        .mockResolvedValueOnce({ rows: [updatedJob] } as any)
        .mockResolvedValueOnce({ rows: [{ id: userId, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .patch(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Job',
          description: 'Updated Description',
          status: JobStatus.IN_PROGRESS,
          priority: PriorityLevel.HIGH,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Job');
      expect(response.body.data.status).toBe(JobStatus.IN_PROGRESS);
    });

    it('should update job workers and managers', async () => {
      const mockJob = {
        id: jobId,
        company_id: companyId,
        name: 'Test Job',
        status: JobStatus.DRAFT,
        priority: null,
        job_type: null,
        assigned_to: null,
        created_by: userId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedJob = { ...mockJob };

      // Mock: findJobById, verifyUserCompany (worker), verifyUserCompany (manager), 
      // updateJob, removeAllWorkers, addWorkers, removeAllManagers, addManagers,
      // getUserDetails (createdBy), getJobWorkersWithDetails, getJobManagersWithDetails
      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockJob] } as any)
        .mockResolvedValueOnce({ rows: [{ id: workerId1 }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: managerId1 }] } as any)
        .mockResolvedValueOnce({ rows: [updatedJob] } as any)
        .mockResolvedValueOnce({ rows: [] } as any) // removeAllWorkers
        .mockResolvedValueOnce({ rows: [] } as any) // addWorkers
        .mockResolvedValueOnce({ rows: [] } as any) // removeAllManagers
        .mockResolvedValueOnce({ rows: [] } as any) // addManagers
        .mockResolvedValueOnce({ rows: [{ id: userId, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: workerId1, first_name: 'Worker', last_name: 'One', email: 'worker1@example.com' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: managerId1, first_name: 'Manager', last_name: 'One', email: 'manager1@example.com' }] } as any);

      const response = await request(app)
        .patch(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          workerIds: [workerId1],
          managerIds: [managerId1],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent job', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .patch(`/api/jobs/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Job',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/jobs/:id', () => {
    it('should delete a job', async () => {
      const mockJob = {
        id: jobId,
        company_id: companyId,
        name: 'Test Job',
        created_by: userId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock: findJobById, deleteJob
      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockJob] } as any)
        .mockResolvedValueOnce({ rows: [{ id: jobId }] } as any);

      const response = await request(app)
        .delete(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent job', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .delete(`/api/jobs/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/jobs/:id/archive', () => {
    it('should archive a job', async () => {
      const mockJob = {
        id: jobId,
        company_id: companyId,
        name: 'Test Job',
        status: JobStatus.DRAFT,
        priority: null,
        job_type: null,
        assigned_to: null,
        created_by: userId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const archivedJob = {
        ...mockJob,
        status: JobStatus.ARCHIVED,
      };

      // Mock: findJobById, archiveJob, getUserDetails (createdBy), getJobWorkersWithDetails, getJobManagersWithDetails
      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockJob] } as any)
        .mockResolvedValueOnce({ rows: [archivedJob] } as any)
        .mockResolvedValueOnce({ rows: [{ id: userId, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .patch(`/api/jobs/${jobId}/archive`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(JobStatus.ARCHIVED);
    });

    it('should fail if job is already archived', async () => {
      const archivedJob = {
        id: jobId,
        company_id: companyId,
        name: 'Test Job',
        status: JobStatus.ARCHIVED,
        priority: null,
        job_type: null,
        assigned_to: null,
        created_by: userId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [archivedJob] } as any);

      const response = await request(app)
        .patch(`/api/jobs/${jobId}/archive`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already archived');
    });

    it('should return 404 for non-existent job', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .patch(`/api/jobs/${uuidv4()}/archive`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .patch(`/api/jobs/${jobId}/archive`);

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/jobs/:id/unarchive', () => {
    it('should unarchive a job', async () => {
      const archivedJob = {
        id: jobId,
        company_id: companyId,
        name: 'Test Job',
        status: JobStatus.ARCHIVED,
        priority: null,
        job_type: null,
        assigned_to: null,
        created_by: userId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const unarchivedJob = {
        ...archivedJob,
        status: JobStatus.DRAFT,
      };

      // Mock: findJobById, unarchiveJob, getUserDetails (createdBy), getJobWorkersWithDetails, getJobManagersWithDetails
      mockDbQuery
        .mockResolvedValueOnce({ rows: [archivedJob] } as any)
        .mockResolvedValueOnce({ rows: [unarchivedJob] } as any)
        .mockResolvedValueOnce({ rows: [{ id: userId, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .patch(`/api/jobs/${jobId}/unarchive`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(JobStatus.DRAFT);
    });

    it('should fail if job is not archived', async () => {
      const mockJob = {
        id: jobId,
        company_id: companyId,
        name: 'Test Job',
        status: JobStatus.DRAFT,
        priority: null,
        job_type: null,
        assigned_to: null,
        created_by: userId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockJob] } as any);

      const response = await request(app)
        .patch(`/api/jobs/${jobId}/unarchive`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not archived');
    });

    it('should return 404 for non-existent job', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .patch(`/api/jobs/${uuidv4()}/unarchive`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .patch(`/api/jobs/${jobId}/unarchive`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/jobs/statistics', () => {
    it('should get job statistics', async () => {
      const mockStats = [
        { status: JobStatus.DRAFT, count: '5' },
        { status: JobStatus.IN_PROGRESS, count: '3' },
      ];

      mockDbQuery.mockResolvedValueOnce({ rows: mockStats } as any);

      const response = await request(app)
        .get('/api/jobs/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('byStatus');
    });
  });

  describe('GET /api/jobs/by-site/:siteId', () => {
    it('should get jobs by site', async () => {
      const mockJobs = [{
        id: jobId,
        company_id: companyId,
        site_id: siteId,
        name: 'Test Job',
        status: JobStatus.DRAFT,
        priority: null,
        job_type: null,
        assigned_to: null,
        created_by: userId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      }];

      // Mock: verifySiteCompany, getJobsBySite, getUserDetails (createdBy), getJobWorkersWithDetails, getJobManagersWithDetails
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: siteId }] } as any)
        .mockResolvedValueOnce({ rows: mockJobs } as any)
        .mockResolvedValueOnce({ rows: [{ id: userId, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get(`/api/jobs/by-site/${siteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.every((job: any) => job.siteId === siteId)).toBe(true);
    });

    it('should return 404 for non-existent site', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get(`/api/jobs/by-site/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
