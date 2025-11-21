// Mobile Sites API Tests

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { mockDbQuery } from '../setup';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';
import { v4 as uuidv4 } from 'uuid';
import { UserRole, SiteStatus } from '../../src/types/enums';

describe('Mobile Sites API', () => {
  let app: Application;
  let authToken: string;
  const companyId = uuidv4();
  const userId = uuidv4();
  const siteId = uuidv4();

  beforeAll(() => {
    app = createApp();

    // Generate auth token
    authToken = jwt.sign(
      { userId, companyId, email: 'admin@test.com', role: UserRole.COMPANY_ADMIN },
      env.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/mobile/sites', () => {
    it('should list sites with job/worker counts', async () => {
      const mockSites = [
        {
          id: siteId,
          site_name: 'Test Site',
          address: '123 Test St',
          latitude: 40.7128,
          longitude: -74.0060,
          status: SiteStatus.ACTIVE,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }) // total count
        .mockResolvedValueOnce({ rows: mockSites }) // site list
        .mockResolvedValueOnce({ rows: [{ site_id: siteId, count: '2' }] }) // job counts
        .mockResolvedValueOnce({ rows: [{ site_id: siteId, count: '3' }] }); // worker counts

      const res = await request(app)
        .get('/api/mobile/sites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('page');
      expect(res.body.data).toHaveProperty('total');
      expect(Array.isArray(res.body.data.data)).toBe(true);

      if (res.body.data.data.length > 0) {
        const site = res.body.data.data[0];
        expect(site).toHaveProperty('siteName');
        expect(site).toHaveProperty('location');
        expect(site).toHaveProperty('jobs');
        expect(site).toHaveProperty('workers');
      }
    });

    it('should filter sites by status', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/mobile/sites?status=active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/mobile/sites');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/mobile/sites/:id', () => {
    it('should get site details', async () => {
      const mockSite = {
        id: siteId,
        site_name: 'Test Site',
        address: '123 Test St',
        latitude: 40.7128,
        longitude: -74.0060,
        status: SiteStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockSite] })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // job count
        .mockResolvedValueOnce({ rows: [{ count: '3' }] }); // worker count

      const res = await request(app)
        .get(`/api/mobile/sites/${siteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(siteId);
      expect(res.body.data).toHaveProperty('siteName');
      expect(res.body.data).toHaveProperty('address');
      expect(res.body.data).toHaveProperty('latitude');
      expect(res.body.data).toHaveProperty('longitude');
    });

    it('should return 404 for non-existent site', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/mobile/sites/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/mobile/sites', () => {
    it('should create a new site', async () => {
      const newSiteData = {
        name: 'New Site',
        address: '456 New St',
        latitude: 40.7128,
        longitude: -74.0060,
        status: SiteStatus.PLANNING,
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [] }) // insert site
        .mockResolvedValueOnce({ rows: [{ ...newSiteData, id: uuidv4(), created_at: new Date(), updated_at: new Date() }] }) // fetch created site
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const res = await request(app)
        .post('/api/mobile/sites')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newSiteData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
    });
  });

  describe('GET /api/mobile/sites/:id/workers', () => {
    it('should get workers at a site', async () => {
      const mockWorkers = [
        {
          id: uuidv4(),
          first_name: 'John',
          last_name: 'Doe',
          role: 'worker',
          phone_number: '1234567890',
          email: 'john@example.com',
        },
      ];

      mockDbQuery.mockResolvedValueOnce({ rows: mockWorkers });

      const res = await request(app)
        .get(`/api/mobile/sites/${siteId}/workers`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/mobile/sites/:id/media', () => {
    it('should get media for a site', async () => {
      const mockMedia = [
        {
          id: uuidv4(),
          file_name: 'photo.jpg',
          file_url: 'https://example.com/photo.jpg',
          file_type: 'image/jpeg',
          file_size: 1024,
          uploaded_by: userId,
          created_at: new Date(),
        },
      ];

      mockDbQuery.mockResolvedValueOnce({ rows: mockMedia });

      const res = await request(app)
        .get(`/api/mobile/sites/${siteId}/media`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/mobile/sites/:id/memos', () => {
    it('should get memos for a site', async () => {
      const mockMemos = [
        {
          id: uuidv4(),
          title: 'Important Note',
          description: 'Remember to check...',
          priority: 'high',
          status: 'pending',
          type: 'personal',
          due_date: new Date(),
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
          first_name: 'John',
          last_name: 'Doe',
        },
      ];

      mockDbQuery.mockResolvedValueOnce({ rows: mockMemos });

      const res = await request(app)
        .get(`/api/mobile/sites/${siteId}/memos`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/mobile/sites/:id/memos', () => {
    it('should create a memo for a site', async () => {
      const memoData = {
        title: 'New Memo',
        description: 'Important information',
        priority: 'medium',
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: siteId }] }) // verify site exists
        .mockResolvedValueOnce({ rows: [] }) // insert memo
        .mockResolvedValueOnce({ rows: [{ ...memoData, id: uuidv4(), created_at: new Date(), updated_at: new Date(), first_name: 'John', last_name: 'Doe' }] }); // fetch created memo

      const res = await request(app)
        .post(`/api/mobile/sites/${siteId}/memos`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(memoData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
    });
  });
});
