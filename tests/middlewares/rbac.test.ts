// RBAC Middleware Tests

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../../src/types/enums';
import { Router } from 'express';
import { authenticateToken } from '../../src/middlewares/auth';
import { requireRole, requireRoles, requireWorker, requireAdmin } from '../../src/middlewares/rbac';
import { successResponse } from '../../src/utils/response';

describe('RBAC Middleware Tests', () => {
  let app: Application;
  const companyId = uuidv4();
  const userId = uuidv4();

  beforeAll(() => {
    app = createApp();

    // Create test routes with RBAC
    const testRouter = Router();
    testRouter.get('/worker-only', authenticateToken, requireWorker, (req, res) => {
      successResponse(res, { message: 'Worker access granted' });
    });
    testRouter.get('/admin-only', authenticateToken, requireAdmin, (req, res) => {
      successResponse(res, { message: 'Admin access granted' });
    });
    testRouter.get('/multiple-roles', authenticateToken, requireRoles([UserRole.WORKER, UserRole.FOREMAN]), (req, res) => {
      successResponse(res, { message: 'Access granted' });
    });

    app.use('/test', testRouter);
  });

  describe('requireWorker', () => {
    it('should allow access for worker role', async () => {
      const authToken = jwt.sign(
        { userId, companyId, email: 'worker@test.com', role: UserRole.WORKER },
        env.jwt.secret,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/test/worker-only')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Worker access granted');
    });

    it('should deny access for admin role', async () => {
      const authToken = jwt.sign(
        { userId, companyId, email: 'admin@test.com', role: UserRole.COMPANY_ADMIN },
        env.jwt.secret,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/test/worker-only')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should deny access without token', async () => {
      const res = await request(app).get('/test/worker-only');

      expect(res.status).toBe(401);
    });
  });

  describe('requireAdmin', () => {
    it('should allow access for company admin role', async () => {
      const authToken = jwt.sign(
        { userId, companyId, email: 'admin@test.com', role: UserRole.COMPANY_ADMIN },
        env.jwt.secret,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/test/admin-only')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow access for super admin role', async () => {
      const authToken = jwt.sign(
        { userId, companyId, email: 'superadmin@test.com', role: UserRole.SUPER_ADMIN },
        env.jwt.secret,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/test/admin-only')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should deny access for worker role', async () => {
      const authToken = jwt.sign(
        { userId, companyId, email: 'worker@test.com', role: UserRole.WORKER },
        env.jwt.secret,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/test/admin-only')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('requireRoles', () => {
    it('should allow access for allowed roles (worker)', async () => {
      const authToken = jwt.sign(
        { userId, companyId, email: 'worker@test.com', role: UserRole.WORKER },
        env.jwt.secret,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/test/multiple-roles')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow access for allowed roles (foreman)', async () => {
      const authToken = jwt.sign(
        { userId, companyId, email: 'foreman@test.com', role: UserRole.FOREMAN },
        env.jwt.secret,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/test/multiple-roles')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should deny access for non-allowed roles', async () => {
      const authToken = jwt.sign(
        { userId, companyId, email: 'admin@test.com', role: UserRole.COMPANY_ADMIN },
        env.jwt.secret,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/test/multiple-roles')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});

