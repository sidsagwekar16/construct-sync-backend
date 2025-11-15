import request from 'supertest';
import { createApp } from '../src/app';
import { mockDbQuery } from './setup';
import { UserRole, JobStatus } from '../src/types/enums';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

describe('Jobs API Tests', () => {
  let app: any;
  let authToken: string;
  const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
  const mockCompanyId = '123e4567-e89b-12d3-a456-426614174000';
  const mockJobId = '123e4567-e89b-12d3-a456-426614174040';
  const mockSiteId = '123e4567-e89b-12d3-a456-426614174030';

  beforeAll(() => {
    app = createApp();
    
    // Generate a valid JWT token for testing
    authToken = jwt.sign(
      {
        userId: mockUserId,
        email: 'test@example.com',
        role: UserRole.COMPANY_ADMIN,
        companyId: mockCompanyId,
      },
      env.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/jobs', () => {
    it('should create a new job successfully', async () => {
      const jobData = {
        name: 'New Construction Project',
        description: 'Building a new office complex',
        jobNumber: 'JOB-2024-001',
        siteId: mockSiteId,
        status: JobStatus.DRAFT,
        startDate: '2024-01-15',
        endDate: '2024-12-31',
      };

      const mockJob = {
        id: mockJobId,
        company_id: mockCompanyId,
        site_id: mockSiteId,
        job_number: jobData.jobNumber,
        name: jobData.name,
        description: jobData.description,
        status: jobData.status,
        start_date: new Date(jobData.startDate),
        end_date: new Date(jobData.endDate),
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockSiteId }] } as any) // verifySiteCompany
        .mockResolvedValueOnce({ rows: [mockJob] } as any); // createJob

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Job created successfully');
      expect(response.body.data).toHaveProperty('id', mockJobId);
      expect(response.body.data).toHaveProperty('name', jobData.name);
      expect(response.body.data).toHaveProperty('jobNumber', jobData.jobNumber);
    });

    it('should create a job without optional fields', async () => {
      const jobData = {
        name: 'Simple Job',
      };

      const mockJob = {
        id: mockJobId,
        company_id: mockCompanyId,
        site_id: null,
        job_number: null,
        name: jobData.name,
        description: null,
        status: JobStatus.DRAFT,
        start_date: null,
        end_date: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockJob] } as any);

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(jobData.name);
    });

    it('should fail with invalid job name', async () => {
      const jobData = {
        name: '', // Empty name
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const jobData = {
        name: 'Test Job',
      };

      const response = await request(app)
        .post('/api/jobs')
        .send(jobData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token is required');
    });

    it('should fail with invalid site ID', async () => {
      const jobData = {
        name: 'Test Job',
        siteId: mockSiteId,
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any); // Site doesn't exist

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Site does not exist');
    });

    it('should fail when end date is before start date', async () => {
      const jobData = {
        name: 'Test Job',
        startDate: '2024-12-31',
        endDate: '2024-01-01',
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('End date must be after start date');
    });
  });

  describe('GET /api/jobs', () => {
    it('should list all jobs for a company', async () => {
      const mockJobs = [
        {
          id: mockJobId,
          company_id: mockCompanyId,
          site_id: mockSiteId,
          job_number: 'JOB-001',
          name: 'Job 1',
          description: 'Description 1',
          status: JobStatus.IN_PROGRESS,
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-12-31'),
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174041',
          company_id: mockCompanyId,
          site_id: null,
          job_number: 'JOB-002',
          name: 'Job 2',
          description: null,
          status: JobStatus.DRAFT,
          start_date: null,
          end_date: null,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '2' }] } as any)
        .mockResolvedValueOnce({ rows: mockJobs } as any);

      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobs).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
    });

    it('should filter jobs by search term', async () => {
      const mockJobs = [
        {
          id: mockJobId,
          company_id: mockCompanyId,
          site_id: null,
          job_number: 'JOB-001',
          name: 'Construction Project',
          description: null,
          status: JobStatus.IN_PROGRESS,
          start_date: null,
          end_date: null,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
        .mockResolvedValueOnce({ rows: mockJobs } as any);

      const response = await request(app)
        .get('/api/jobs?search=Construction')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobs).toHaveLength(1);
    });

    it('should filter jobs by status', async () => {
      const mockJobs = [
        {
          id: mockJobId,
          company_id: mockCompanyId,
          site_id: null,
          job_number: null,
          name: 'Active Job',
          description: null,
          status: JobStatus.IN_PROGRESS,
          start_date: null,
          end_date: null,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
        .mockResolvedValueOnce({ rows: mockJobs } as any);

      const response = await request(app)
        .get(`/api/jobs?status=${JobStatus.IN_PROGRESS}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobs).toHaveLength(1);
      expect(response.body.data.jobs[0].status).toBe(JobStatus.IN_PROGRESS);
    });

    it('should filter jobs by site', async () => {
      const mockJobs = [
        {
          id: mockJobId,
          company_id: mockCompanyId,
          site_id: mockSiteId,
          job_number: null,
          name: 'Site Job',
          description: null,
          status: JobStatus.DRAFT,
          start_date: null,
          end_date: null,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
        .mockResolvedValueOnce({ rows: mockJobs } as any);

      const response = await request(app)
        .get(`/api/jobs?siteId=${mockSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobs).toHaveLength(1);
      expect(response.body.data.jobs[0].siteId).toBe(mockSiteId);
    });

    it('should paginate jobs correctly', async () => {
      const mockJobs = [
        {
          id: mockJobId,
          company_id: mockCompanyId,
          site_id: null,
          job_number: null,
          name: 'Job 1',
          description: null,
          status: JobStatus.DRAFT,
          start_date: null,
          end_date: null,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '10' }] } as any)
        .mockResolvedValueOnce({ rows: mockJobs } as any);

      const response = await request(app)
        .get('/api/jobs?page=2&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(2);
      expect(response.body.data.limit).toBe(5);
    });
  });

  describe('GET /api/jobs/:id', () => {
    it('should get a job by ID', async () => {
      const mockJob = {
        id: mockJobId,
        company_id: mockCompanyId,
        site_id: mockSiteId,
        job_number: 'JOB-001',
        name: 'Test Job',
        description: 'Test description',
        status: JobStatus.IN_PROGRESS,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockJob] } as any);

      const response = await request(app)
        .get(`/api/jobs/${mockJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', mockJobId);
      expect(response.body.data).toHaveProperty('name', 'Test Job');
    });

    it('should return 404 for non-existent job', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get(`/api/jobs/${mockJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Job not found');
    });
  });

  describe('PATCH /api/jobs/:id', () => {
    it('should update a job successfully', async () => {
      const updateData = {
        name: 'Updated Job Name',
        description: 'Updated description',
        status: JobStatus.IN_PROGRESS,
      };

      const mockJob = {
        id: mockJobId,
        company_id: mockCompanyId,
        site_id: null,
        job_number: 'JOB-001',
        name: 'Original Name',
        description: 'Original description',
        status: JobStatus.DRAFT,
        start_date: null,
        end_date: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedJob = {
        ...mockJob,
        name: updateData.name,
        description: updateData.description,
        status: updateData.status,
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockJob] } as any)
        .mockResolvedValueOnce({ rows: [updatedJob] } as any);

      const response = await request(app)
        .patch(`/api/jobs/${mockJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Job updated successfully');
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.status).toBe(updateData.status);
    });

    it('should update job with new site', async () => {
      const updateData = {
        siteId: mockSiteId,
      };

      const mockJob = {
        id: mockJobId,
        company_id: mockCompanyId,
        site_id: null,
        job_number: null,
        name: 'Test Job',
        description: null,
        status: JobStatus.DRAFT,
        start_date: null,
        end_date: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockJob] } as any)
        .mockResolvedValueOnce({ rows: [{ id: mockSiteId }] } as any)
        .mockResolvedValueOnce({ rows: [{ ...mockJob, site_id: mockSiteId }] } as any);

      const response = await request(app)
        .patch(`/api/jobs/${mockJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.siteId).toBe(mockSiteId);
    });

    it('should fail when updating with invalid site', async () => {
      const mockJob = {
        id: mockJobId,
        company_id: mockCompanyId,
        site_id: null,
        job_number: null,
        name: 'Test Job',
        description: null,
        status: JobStatus.DRAFT,
        start_date: null,
        end_date: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockJob] } as any)
        .mockResolvedValueOnce({ rows: [] } as any); // Site doesn't exist

      const response = await request(app)
        .patch(`/api/jobs/${mockJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ siteId: mockSiteId })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent job', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .patch(`/api/jobs/${mockJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/jobs/:id', () => {
    it('should delete a job successfully', async () => {
      const mockJob = {
        id: mockJobId,
        company_id: mockCompanyId,
        site_id: null,
        job_number: null,
        name: 'Job to Delete',
        description: null,
        status: JobStatus.DRAFT,
        start_date: null,
        end_date: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockJob] } as any)
        .mockResolvedValueOnce({ rows: [{ id: mockJobId }] } as any);

      const response = await request(app)
        .delete(`/api/jobs/${mockJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Job deleted successfully');
    });

    it('should return 404 for non-existent job', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .delete(`/api/jobs/${mockJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Job not found');
    });
  });

  describe('GET /api/jobs/statistics', () => {
    it('should get job statistics successfully', async () => {
      const mockStats = [
        { status: JobStatus.DRAFT, count: '5' },
        { status: JobStatus.IN_PROGRESS, count: '10' },
        { status: JobStatus.COMPLETED, count: '3' },
      ];

      mockDbQuery.mockResolvedValueOnce({ rows: mockStats } as any);

      const response = await request(app)
        .get('/api/jobs/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total', 18);
      expect(response.body.data).toHaveProperty('byStatus');
      expect(response.body.data.byStatus[JobStatus.DRAFT]).toBe(5);
      expect(response.body.data.byStatus[JobStatus.IN_PROGRESS]).toBe(10);
      expect(response.body.data.byStatus[JobStatus.COMPLETED]).toBe(3);
    });

    it('should return empty statistics when no jobs exist', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get('/api/jobs/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(0);
      expect(response.body.data.byStatus).toEqual({});
    });
  });

  describe('GET /api/jobs/by-site/:siteId', () => {
    it('should get jobs by site successfully', async () => {
      const mockJobs = [
        {
          id: mockJobId,
          company_id: mockCompanyId,
          site_id: mockSiteId,
          job_number: 'JOB-001',
          name: 'Job 1',
          description: null,
          status: JobStatus.IN_PROGRESS,
          start_date: null,
          end_date: null,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockSiteId }] } as any)
        .mockResolvedValueOnce({ rows: mockJobs } as any);

      const response = await request(app)
        .get(`/api/jobs/by-site/${mockSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].siteId).toBe(mockSiteId);
    });

    it('should return 404 for non-existent site', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get(`/api/jobs/by-site/${mockSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Site not found');
    });
  });
});


