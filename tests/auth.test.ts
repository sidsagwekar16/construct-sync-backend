import request from 'supertest';
import { createApp } from '../src/app';
import { mockDbQuery } from './setup';
import { UserRole } from '../src/types/enums';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

describe('Auth API Tests', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'TestPass123',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Test Company',
        companyEmail: 'company@example.com',
        companyPhone: '+1234567890',
        companyAddress: '123 Test St',
      };

      const mockCompanyId = '123e4567-e89b-12d3-a456-426614174000';
      const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
      const mockUser = {
        id: mockUserId,
        company_id: mockCompanyId,
        email: registerData.email,
        password_hash: await bcrypt.hash(registerData.password, 12),
        first_name: registerData.firstName,
        last_name: registerData.lastName,
        role: UserRole.COMPANY_ADMIN,
        is_active: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock database calls
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] } as any) // findUserByEmail returns null
        .mockResolvedValueOnce({ rows: [{ id: mockCompanyId }] } as any) // createCompany
        .mockResolvedValueOnce({ rows: [mockUser] } as any) // createUser
        .mockResolvedValueOnce({ rows: [{ id: 'session-id' }] } as any) // createSession
        .mockResolvedValueOnce({ rows: [{ id: 'refresh-token-id' }] } as any); // createRefreshToken

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Registration successful');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(registerData.email);
      expect(response.body.data.user.role).toBe(UserRole.COMPANY_ADMIN);
    });

    it('should fail registration with existing email', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'TestPass123',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Test Company',
      };

      const existingUser = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        email: registerData.email,
        company_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Mock finding existing user
      mockDbQuery.mockResolvedValueOnce({ rows: [existingUser] } as any);

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User with this email already exists');
    });

    it('should fail registration with weak password', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Test Company',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail registration with invalid email', async () => {
      const registerData = {
        email: 'invalid-email',
        password: 'TestPass123',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Test Company',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail registration with missing required fields', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'TestPass123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPass123',
      };

      const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
      const mockCompanyId = '123e4567-e89b-12d3-a456-426614174000';
      const passwordHash = await bcrypt.hash(loginData.password, 12);

      const mockUser = {
        id: mockUserId,
        company_id: mockCompanyId,
        email: loginData.email,
        password_hash: passwordHash,
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.COMPANY_ADMIN,
        is_active: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock database calls
      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockUser] } as any) // findUserByEmail
        .mockResolvedValueOnce({ rows: [{ id: 'session-id' }] } as any) // createSession
        .mockResolvedValueOnce({ rows: [{ id: 'refresh-token-id' }] } as any); // createRefreshToken

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    it('should fail login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPass123',
      };

      // Mock finding no user
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should fail login with incorrect password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPass123',
      };

      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        company_id: '123e4567-e89b-12d3-a456-426614174000',
        email: loginData.email,
        password_hash: await bcrypt.hash('CorrectPass123', 12),
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.COMPANY_ADMIN,
        is_active: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock finding user
      mockDbQuery.mockResolvedValueOnce({ rows: [mockUser] } as any);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should fail login with inactive account', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPass123',
      };

      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        company_id: '123e4567-e89b-12d3-a456-426614174000',
        email: loginData.email,
        password_hash: await bcrypt.hash(loginData.password, 12),
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.COMPANY_ADMIN,
        is_active: false, // Inactive account
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock finding inactive user
      mockDbQuery.mockResolvedValueOnce({ rows: [mockUser] } as any);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Account is inactive. Please contact support.');
    });

    it('should fail login with invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'TestPass123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail login with missing password', async () => {
      const loginData = {
        email: 'test@example.com',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
      const mockCompanyId = '123e4567-e89b-12d3-a456-426614174000';

      const mockUser = {
        id: mockUserId,
        company_id: mockCompanyId,
        email: 'test@example.com',
        password_hash: 'hashed',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.COMPANY_ADMIN,
        is_active: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Generate a valid JWT token
      const token = jwt.sign(
        {
          userId: mockUserId,
          email: mockUser.email,
          role: mockUser.role,
          companyId: mockCompanyId,
        },
        env.jwt.secret,
        { expiresIn: '1h' }
      );

      // Mock finding user
      mockDbQuery.mockResolvedValueOnce({ rows: [mockUser] } as any);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', mockUserId);
      expect(response.body.data).toHaveProperty('email', mockUser.email);
      expect(response.body.data).toHaveProperty('firstName', mockUser.first_name);
      expect(response.body.data).toHaveProperty('lastName', mockUser.last_name);
      expect(response.body.data).toHaveProperty('role', mockUser.role);
      expect(response.body.data).not.toHaveProperty('password_hash');
    });

    it('should fail without authorization token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token is required');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });

    it('should fail with expired token', async () => {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
      const mockCompanyId = '123e4567-e89b-12d3-a456-426614174000';

      // Generate an expired JWT token
      const token = jwt.sign(
        {
          userId: mockUserId,
          email: 'test@example.com',
          role: UserRole.COMPANY_ADMIN,
          companyId: mockCompanyId,
        },
        env.jwt.secret,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      // JWT can return either "Token expired" or "Invalid token" depending on validation order
      expect(response.body.error).toMatch(/Token expired|Invalid token/);
    });

    it('should fail when user not found', async () => {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
      const mockCompanyId = '123e4567-e89b-12d3-a456-426614174000';

      // Generate a valid JWT token
      const token = jwt.sign(
        {
          userId: mockUserId,
          email: 'test@example.com',
          role: UserRole.COMPANY_ADMIN,
          companyId: mockCompanyId,
        },
        env.jwt.secret,
        { expiresIn: '1h' }
      );

      // Mock no user found
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('POST /api/auth/support/report-error', () => {
    it('should report error successfully without authentication', async () => {
      const errorData = {
        errorMessage: 'Something went wrong',
        errorStack: 'Error stack trace...',
        userAgent: 'Mozilla/5.0...',
        url: '/dashboard',
        additionalInfo: {
          component: 'Dashboard',
          action: 'load',
        },
      };

      // Mock database insert
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .post('/api/auth/support/report-error')
        .send(errorData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Error report submitted successfully');
    });

    it('should report error successfully with authentication', async () => {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
      const mockCompanyId = '123e4567-e89b-12d3-a456-426614174000';

      const errorData = {
        errorMessage: 'Something went wrong',
        errorStack: 'Error stack trace...',
      };

      // Generate a valid JWT token
      const token = jwt.sign(
        {
          userId: mockUserId,
          email: 'test@example.com',
          role: UserRole.COMPANY_ADMIN,
          companyId: mockCompanyId,
        },
        env.jwt.secret,
        { expiresIn: '1h' }
      );

      // Mock database insert
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .post('/api/auth/support/report-error')
        .set('Authorization', `Bearer ${token}`)
        .send(errorData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Error report submitted successfully');
    });

    it('should fail with missing error message', async () => {
      const errorData = {
        errorStack: 'Error stack trace...',
      };

      const response = await request(app)
        .post('/api/auth/support/report-error')
        .send(errorData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should report error with minimal data', async () => {
      const errorData = {
        errorMessage: 'Minimal error report',
      };

      // Mock database insert
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .post('/api/auth/support/report-error')
        .send(errorData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should report error with all optional fields', async () => {
      const errorData = {
        errorMessage: 'Detailed error report',
        errorStack: 'Full stack trace here',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        url: 'https://app.example.com/dashboard',
        additionalInfo: {
          userId: '12345',
          component: 'UserDashboard',
          action: 'fetchData',
          timestamp: new Date().toISOString(),
          browserInfo: {
            name: 'Chrome',
            version: '120.0',
          },
        },
      };

      // Mock database insert
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .post('/api/auth/support/report-error')
        .send(errorData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Error report submitted successfully');
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Server is running');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('404 Not Found', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens with a valid refresh token', async () => {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
      const mockCompanyId = '123e4567-e89b-12d3-a456-426614174000';

      // Create a valid refresh token JWT
      const refreshToken = jwt.sign(
        {
          userId: mockUserId,
          email: 'test@example.com',
          role: UserRole.COMPANY_ADMIN,
          companyId: mockCompanyId,
        },
        env.jwt.secret,
        { expiresIn: '30d' }
      );

      // DB mocks: findRefreshTokenByToken → createSession → createRefreshToken
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: 'rt1', user_id: mockUserId, token: 'hashed', expires_at: new Date(Date.now() + 86400000), created_at: new Date() }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 'session-id', user_id: mockUserId, token: 'hashed', expires_at: new Date(Date.now() + 86400000) }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 'new-rt-id', user_id: mockUserId, token: 'hashed', expires_at: new Date(Date.now() + 2592000000) }] } as any);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token refreshed');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired refresh token');
    });

    it('should fail when refresh token not found in DB', async () => {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
      const mockCompanyId = '123e4567-e89b-12d3-a456-426614174000';
      const refreshToken = jwt.sign(
        {
          userId: mockUserId,
          email: 'test@example.com',
          role: UserRole.COMPANY_ADMIN,
          companyId: mockCompanyId,
        },
        env.jwt.secret,
        { expiresIn: '30d' }
      );

      // No record found
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired refresh token');
    });
  });
});

