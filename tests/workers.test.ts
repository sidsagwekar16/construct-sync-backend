// Workers/Users API tests with mocked database

import request from 'supertest';
import { createApp } from '../src/app';
import { Application } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { mockDbQuery } from './setup';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../src/types/enums';
import bcrypt from 'bcryptjs';

describe('Workers API', () => {
  let app: Application;
  let authToken: string;
  const companyId = uuidv4();
  const userId = uuidv4();
  const workerId = uuidv4();

  beforeAll(() => {
    app = createApp();

    // Generate auth token
    authToken = jwt.sign(
      { userId, companyId, email: 'admin@example.com', role: UserRole.COMPANY_ADMIN },
      env.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/workers', () => {
    it('should create a new worker', async () => {
      const mockWorker = {
        id: uuidv4(),
        company_id: companyId,
        email: 'newworker@example.com',
        password_hash: await bcrypt.hash('Password123', 10),
        first_name: 'New',
        last_name: 'Worker',
        role: UserRole.WORKER,
        is_active: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock: findUserByEmail (no existing), createUser
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [mockWorker] } as any);

      const response = await request(app)
        .post('/api/workers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newworker@example.com',
          password: 'Password123',
          firstName: 'New',
          lastName: 'Worker',
          role: UserRole.WORKER,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('newworker@example.com');
      expect(response.body.data.firstName).toBe('New');
      expect(response.body.data.lastName).toBe('Worker');
      expect(response.body.data.role).toBe(UserRole.WORKER);
      expect(response.body.data).not.toHaveProperty('password_hash');
    });

    it('should create a worker with default role', async () => {
      const mockWorker = {
        id: uuidv4(),
        company_id: companyId,
        email: 'defaultrole@example.com',
        password_hash: await bcrypt.hash('Password123', 10),
        first_name: 'Default',
        last_name: 'Role',
        role: UserRole.WORKER,
        is_active: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [mockWorker] } as any);

      const response = await request(app)
        .post('/api/workers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'defaultrole@example.com',
          password: 'Password123',
          firstName: 'Default',
          lastName: 'Role',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.role).toBe(UserRole.WORKER);
    });

    it('should fail with duplicate email', async () => {
      const existingWorker = {
        id: workerId,
        company_id: companyId,
        email: 'worker@example.com',
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [existingWorker] } as any);

      const response = await request(app)
        .post('/api/workers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'worker@example.com',
          password: 'Password123',
          firstName: 'Duplicate',
          lastName: 'Email',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('Email already exists');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/workers')
        .send({
          email: 'noauth@example.com',
          password: 'Password123',
          firstName: 'No',
          lastName: 'Auth',
        });

      expect(response.status).toBe(401);
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/workers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email',
          password: 'Password123',
          firstName: 'Invalid',
          lastName: 'Email',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Validation failed');
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/workers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'weakpass@example.com',
          password: 'weak',
          firstName: 'Weak',
          lastName: 'Password',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Validation failed');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/workers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'missing@example.com',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/workers', () => {
    it('should list workers for the company', async () => {
      const mockWorkers = [{
        id: workerId,
        company_id: companyId,
        email: 'worker@example.com',
        password_hash: 'hash',
        first_name: 'Test',
        last_name: 'Worker',
        role: UserRole.WORKER,
        is_active: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      }];

      // Mock: countQuery, listQuery
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
        .mockResolvedValueOnce({ rows: mockWorkers } as any);

      const response = await request(app)
        .get('/api/workers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.workers)).toBe(true);
      expect(response.body.data.workers.length).toBeGreaterThan(0);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
    });

    it('should filter workers by role', async () => {
      const mockWorkers = [{
        id: workerId,
        company_id: companyId,
        email: 'worker@example.com',
        first_name: 'Test',
        last_name: 'Worker',
        role: UserRole.WORKER,
        is_active: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      }];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
        .mockResolvedValueOnce({ rows: mockWorkers } as any);

      const response = await request(app)
        .get(`/api/workers?role=${UserRole.WORKER}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.workers.every((worker: any) => worker.role === UserRole.WORKER)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/workers');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/workers/:id', () => {
    it('should get a worker by id', async () => {
      const mockWorker = {
        id: workerId,
        company_id: companyId,
        email: 'worker@example.com',
        password_hash: 'hash',
        first_name: 'Test',
        last_name: 'Worker',
        role: UserRole.WORKER,
        is_active: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockWorker] } as any);

      const response = await request(app)
        .get(`/api/workers/${workerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(workerId);
      expect(response.body.data.email).toBe('worker@example.com');
      expect(response.body.data).not.toHaveProperty('password_hash');
    });

    it('should return 404 for non-existent worker', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get(`/api/workers/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Worker not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/workers/${workerId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/workers/:id', () => {
    it('should update a worker', async () => {
      const mockWorker = {
        id: workerId,
        company_id: companyId,
        email: 'worker@example.com',
        first_name: 'Test',
        last_name: 'Worker',
        role: UserRole.WORKER,
        is_active: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedWorker = {
        ...mockWorker,
        first_name: 'Updated',
        last_name: 'Name',
        role: UserRole.FOREMAN,
      };

      // Mock: findUserById, updateUser
      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockWorker] } as any)
        .mockResolvedValueOnce({ rows: [updatedWorker] } as any);

      const response = await request(app)
        .patch(`/api/workers/${workerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          role: UserRole.FOREMAN,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
      expect(response.body.data.role).toBe(UserRole.FOREMAN);
    });

    it('should update worker email', async () => {
      const mockWorker = {
        id: workerId,
        company_id: companyId,
        email: 'worker@example.com',
        first_name: 'Test',
        last_name: 'Worker',
        role: UserRole.WORKER,
        is_active: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedWorker = {
        ...mockWorker,
        email: 'newemail@example.com',
      };

      // Mock: findUserById, findUserByEmail (no conflict), updateUser
      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockWorker] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [updatedWorker] } as any);

      const response = await request(app)
        .patch(`/api/workers/${workerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newemail@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe('newemail@example.com');
    });

    it('should fail with duplicate email', async () => {
      const mockWorker = {
        id: workerId,
        company_id: companyId,
        email: 'worker@example.com',
        first_name: 'Test',
        last_name: 'Worker',
        role: UserRole.WORKER,
        is_active: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const existingUser = {
        id: uuidv4(),
        email: 'admin@example.com',
      };

      // Mock: findUserById, findUserByEmail (conflict found)
      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockWorker] } as any)
        .mockResolvedValueOnce({ rows: [existingUser] } as any);

      const response = await request(app)
        .patch(`/api/workers/${workerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'admin@example.com',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('Email already exists');
    });

    it('should return 404 for non-existent worker', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .patch(`/api/workers/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
        });

      expect(response.status).toBe(404);
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .patch(`/api/workers/${workerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email',
        });

      expect(response.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .patch(`/api/workers/${workerId}`)
        .send({
          firstName: 'Updated',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/workers/:id', () => {
    it('should delete a worker', async () => {
      const mockWorker = {
        id: workerId,
        company_id: companyId,
        email: 'worker@example.com',
        first_name: 'Test',
        last_name: 'Worker',
        role: UserRole.WORKER,
        is_active: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock: findUserById, deleteUser
      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockWorker] } as any)
        .mockResolvedValueOnce({ rows: [{ id: workerId }] } as any);

      const response = await request(app)
        .delete(`/api/workers/${workerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent worker', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .delete(`/api/workers/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should fail to delete super admin', async () => {
      const superAdmin = {
        id: workerId,
        company_id: companyId,
        email: 'superadmin@example.com',
        first_name: 'Super',
        last_name: 'Admin',
        role: UserRole.SUPER_ADMIN,
        is_active: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [superAdmin] } as any);

      const response = await request(app)
        .delete(`/api/workers/${workerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot delete super admin');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/workers/${workerId}`);

      expect(response.status).toBe(401);
    });
  });
});
