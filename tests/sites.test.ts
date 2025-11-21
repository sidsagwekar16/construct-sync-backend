import request from 'supertest';
import { createApp } from '../src/app';
import { mockDbQuery } from './setup';
import { UserRole, SiteStatus } from '../src/types/enums';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

describe('Sites API Tests', () => {
  let app: any;
  let authToken: string;
  const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
  const mockCompanyId = '123e4567-e89b-12d3-a456-426614174000';
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

  describe('POST /api/sites', () => {
    it('should create a new site successfully', async () => {
      const siteData = {
        name: 'Construction Site A',
        address: '123 Main Street, New York, NY',
        latitude: 40.7128,
        longitude: -74.0060,
        status: SiteStatus.PLANNING,
      };

      const mockSite = {
        id: mockSiteId,
        company_id: mockCompanyId,
        name: siteData.name,
        address: siteData.address,
        latitude: siteData.latitude,
        longitude: siteData.longitude,
        status: siteData.status,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockBudget = {
        id: '123e4567-e89b-12d3-a456-426614174070',
        site_id: mockSiteId,
        company_id: mockCompanyId,
        total_budget: 0,
        allocated_budget: 0,
        spent_budget: 0,
        created_by: mockUserId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockSite] } as any) // Create site
        .mockResolvedValueOnce({ rows: [mockBudget] } as any) // Create budget
        .mockResolvedValueOnce({ rows: [] } as any); // Create default categories (multiple calls)

      const response = await request(app)
        .post('/api/sites')
        .set('Authorization', `Bearer ${authToken}`)
        .send(siteData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Site created successfully');
      expect(response.body.data).toHaveProperty('id', mockSiteId);
      expect(response.body.data).toHaveProperty('name', siteData.name);
      expect(response.body.data).toHaveProperty('address', siteData.address);
      expect(response.body.data).toHaveProperty('latitude', siteData.latitude);
      expect(response.body.data).toHaveProperty('longitude', siteData.longitude);
    });

    it('should create a site without optional fields', async () => {
      const siteData = {
        name: 'Simple Site',
      };

      const mockSite = {
        id: mockSiteId,
        company_id: mockCompanyId,
        name: siteData.name,
        address: null,
        latitude: null,
        longitude: null,
        status: SiteStatus.PLANNING,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockBudget = {
        id: '123e4567-e89b-12d3-a456-426614174070',
        site_id: mockSiteId,
        company_id: mockCompanyId,
        total_budget: 0,
        allocated_budget: 0,
        spent_budget: 0,
        created_by: mockUserId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockSite] } as any) // Create site
        .mockResolvedValueOnce({ rows: [mockBudget] } as any) // Create budget
        .mockResolvedValueOnce({ rows: [] } as any); // Create default categories

      const response = await request(app)
        .post('/api/sites')
        .set('Authorization', `Bearer ${authToken}`)
        .send(siteData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(siteData.name);
    });

    it('should fail with invalid site name', async () => {
      const siteData = {
        name: '', // Empty name
      };

      const response = await request(app)
        .post('/api/sites')
        .set('Authorization', `Bearer ${authToken}`)
        .send(siteData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const siteData = {
        name: 'Test Site',
      };

      const response = await request(app)
        .post('/api/sites')
        .send(siteData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token is required');
    });

    it('should fail with invalid latitude', async () => {
      const siteData = {
        name: 'Test Site',
        latitude: 100, // Invalid latitude > 90
        longitude: -74.0060,
      };

      const response = await request(app)
        .post('/api/sites')
        .set('Authorization', `Bearer ${authToken}`)
        .send(siteData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with latitude but no longitude', async () => {
      const siteData = {
        name: 'Test Site',
        latitude: 40.7128,
      };

      const response = await request(app)
        .post('/api/sites')
        .set('Authorization', `Bearer ${authToken}`)
        .send(siteData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/sites', () => {
    it('should list all sites for a company', async () => {
      const mockSites = [
        {
          id: mockSiteId,
          company_id: mockCompanyId,
          name: 'Site 1',
          address: '123 Main St',
          latitude: 40.7128,
          longitude: -74.0060,
          status: SiteStatus.ACTIVE,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174031',
          company_id: mockCompanyId,
          name: 'Site 2',
          address: '456 Oak Ave',
          latitude: null,
          longitude: null,
          status: SiteStatus.PLANNING,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '2' }] } as any)
        .mockResolvedValueOnce({ rows: mockSites } as any);

      const response = await request(app)
        .get('/api/sites')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sites).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
    });

    it('should filter sites by search term', async () => {
      const mockSites = [
        {
          id: mockSiteId,
          company_id: mockCompanyId,
          name: 'Construction Site A',
          address: '123 Main St',
          latitude: null,
          longitude: null,
          status: SiteStatus.ACTIVE,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
        .mockResolvedValueOnce({ rows: mockSites } as any);

      const response = await request(app)
        .get('/api/sites?search=Construction')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sites).toHaveLength(1);
    });

    it('should filter sites by status', async () => {
      const mockSites = [
        {
          id: mockSiteId,
          company_id: mockCompanyId,
          name: 'Active Site',
          address: null,
          latitude: null,
          longitude: null,
          status: SiteStatus.ACTIVE,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
        .mockResolvedValueOnce({ rows: mockSites } as any);

      const response = await request(app)
        .get(`/api/sites?status=${SiteStatus.ACTIVE}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sites).toHaveLength(1);
      expect(response.body.data.sites[0].status).toBe(SiteStatus.ACTIVE);
    });

    it('should paginate sites correctly', async () => {
      const mockSites = [
        {
          id: mockSiteId,
          company_id: mockCompanyId,
          name: 'Site 1',
          address: null,
          latitude: null,
          longitude: null,
          status: SiteStatus.PLANNING,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '10' }] } as any)
        .mockResolvedValueOnce({ rows: mockSites } as any);

      const response = await request(app)
        .get('/api/sites?page=2&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(2);
      expect(response.body.data.limit).toBe(5);
    });
  });

  describe('GET /api/sites/:id', () => {
    it('should get a site by ID', async () => {
      const mockSite = {
        id: mockSiteId,
        company_id: mockCompanyId,
        name: 'Test Site',
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.0060,
        status: SiteStatus.ACTIVE,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockSite] } as any);

      const response = await request(app)
        .get(`/api/sites/${mockSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', mockSiteId);
      expect(response.body.data).toHaveProperty('name', 'Test Site');
    });

    it('should return 404 for non-existent site', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get(`/api/sites/${mockSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Site not found');
    });
  });

  describe('PATCH /api/sites/:id', () => {
    it('should update a site successfully', async () => {
      const updateData = {
        name: 'Updated Site Name',
        address: 'Updated Address',
        status: SiteStatus.ACTIVE,
      };

      const mockSite = {
        id: mockSiteId,
        company_id: mockCompanyId,
        name: 'Original Name',
        address: 'Original Address',
        latitude: null,
        longitude: null,
        status: SiteStatus.PLANNING,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedSite = {
        ...mockSite,
        name: updateData.name,
        address: updateData.address,
        status: updateData.status,
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockSite] } as any)
        .mockResolvedValueOnce({ rows: [updatedSite] } as any);

      const response = await request(app)
        .patch(`/api/sites/${mockSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Site updated successfully');
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.status).toBe(updateData.status);
    });

    it('should update coordinates', async () => {
      const updateData = {
        latitude: 40.7128,
        longitude: -74.0060,
      };

      const mockSite = {
        id: mockSiteId,
        company_id: mockCompanyId,
        name: 'Test Site',
        address: null,
        latitude: null,
        longitude: null,
        status: SiteStatus.PLANNING,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockSite] } as any)
        .mockResolvedValueOnce({ rows: [{ ...mockSite, ...updateData }] } as any);

      const response = await request(app)
        .patch(`/api/sites/${mockSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.latitude).toBe(updateData.latitude);
      expect(response.body.data.longitude).toBe(updateData.longitude);
    });

    it('should fail when updating only latitude', async () => {
      const mockSite = {
        id: mockSiteId,
        company_id: mockCompanyId,
        name: 'Test Site',
        address: null,
        latitude: null,
        longitude: null,
        status: SiteStatus.PLANNING,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockSite] } as any);

      const response = await request(app)
        .patch(`/api/sites/${mockSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ latitude: 40.7128 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent site', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .patch(`/api/sites/${mockSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/sites/:id', () => {
    it('should delete a site successfully', async () => {
      const mockSite = {
        id: mockSiteId,
        company_id: mockCompanyId,
        name: 'Site to Delete',
        address: null,
        latitude: null,
        longitude: null,
        status: SiteStatus.PLANNING,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockBudget = {
        id: '123e4567-e89b-12d3-a456-426614174070',
        site_id: mockSiteId,
        company_id: mockCompanyId,
        total_budget: 0,
        allocated_budget: 0,
        spent_budget: 0,
        created_by: mockUserId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockSite] } as any) // findSiteById
        .mockResolvedValueOnce({ rows: [{ count: '0' }] } as any) // getSiteJobCount
        .mockResolvedValueOnce({ rows: [mockBudget] } as any) // findBudgetBySiteId
        .mockResolvedValueOnce({ rows: [{ id: mockBudget.id }] } as any) // deleteBudget
        .mockResolvedValueOnce({ rows: [{ id: mockSiteId }] } as any); // deleteSite

      const response = await request(app)
        .delete(`/api/sites/${mockSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Site deleted successfully');
    });

    it('should fail to delete site with associated jobs', async () => {
      const mockSite = {
        id: mockSiteId,
        company_id: mockCompanyId,
        name: 'Site with Jobs',
        address: null,
        latitude: null,
        longitude: null,
        status: SiteStatus.ACTIVE,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockSite] } as any)
        .mockResolvedValueOnce({ rows: [{ count: '3' }] } as any); // 3 associated jobs

      const response = await request(app)
        .delete(`/api/sites/${mockSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Cannot delete site with');
    });

    it('should return 404 for non-existent site', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .delete(`/api/sites/${mockSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Site not found');
    });
  });

  describe('GET /api/sites/statistics', () => {
    it('should get site statistics successfully', async () => {
      const mockStats = [
        { status: SiteStatus.PLANNING, count: '5' },
        { status: SiteStatus.ACTIVE, count: '10' },
        { status: SiteStatus.COMPLETED, count: '3' },
      ];

      mockDbQuery.mockResolvedValueOnce({ rows: mockStats } as any);

      const response = await request(app)
        .get('/api/sites/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total', 18);
      expect(response.body.data).toHaveProperty('byStatus');
      expect(response.body.data.byStatus[SiteStatus.PLANNING]).toBe(5);
      expect(response.body.data.byStatus[SiteStatus.ACTIVE]).toBe(10);
      expect(response.body.data.byStatus[SiteStatus.COMPLETED]).toBe(3);
    });

    it('should return empty statistics when no sites exist', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get('/api/sites/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(0);
      expect(response.body.data.byStatus).toEqual({});
    });
  });
});


