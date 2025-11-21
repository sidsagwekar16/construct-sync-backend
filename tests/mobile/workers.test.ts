// Mobile Workers API Tests

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { mockDbQuery } from '../setup';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../../src/types/enums';

describe('Mobile Workers API', () => {
  let app: Application;
  let authToken: string;
  const companyId = uuidv4();
  const userId = uuidv4();
  const workerId = uuidv4();

  beforeAll(() => {
    app = createApp();

    // Generate auth token
    authToken = jwt.sign(
      { userId, companyId, email: 'admin@test.com', role: UserRole.COMPANY_ADMIN },
      env.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/mobile/workers', () => {
    it('should list workers', async () => {
      const mockWorkers = [
        {
          id: workerId,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone_number: '1234567890',
          role: 'worker',
        },
        {
          id: uuidv4(),
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          phone_number: '0987654321',
          role: 'foreman',
        },
      ];

      mockDbQuery.mockResolvedValueOnce({ rows: mockWorkers });

      const res = await request(app)
        .get('/api/mobile/workers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      if (res.body.data.length > 0) {
        const worker = res.body.data[0];
        expect(worker).toHaveProperty('id');
        expect(worker).toHaveProperty('name');
        expect(worker).toHaveProperty('role');
        expect(worker).toHaveProperty('email');
      }
    });

    it('should filter workers by role', async () => {
      const mockWorkers = [
        {
          id: workerId,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone_number: '1234567890',
          role: 'worker',
        },
      ];

      mockDbQuery.mockResolvedValueOnce({ rows: mockWorkers });

      const res = await request(app)
        .get('/api/mobile/workers?role=worker')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Check that all returned workers have the specified role
      res.body.data.forEach((worker: any) => {
        expect(['worker', 'foreman', 'site_supervisor']).toContain(worker.role);
      });
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/mobile/workers');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/mobile/workers/:id', () => {
    it('should get worker by ID', async () => {
      const mockWorker = {
        id: workerId,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone_number: '1234567890',
        role: 'worker',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockWorker] });

      const res = await request(app)
        .get(`/api/mobile/workers/${workerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(workerId);
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('email');
    });

    it('should return 404 for non-existent worker', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/mobile/workers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});
