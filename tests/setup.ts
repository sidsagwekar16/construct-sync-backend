import { Application } from 'express';
import { db } from '../src/db/connection';

// Mock database connection for tests
jest.mock('../src/db/connection', () => ({
  db: {
    query: jest.fn(),
    getClient: jest.fn(),
    testConnection: jest.fn().mockResolvedValue(true),
    close: jest.fn(),
  },
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost/test_db';
process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-characters-long-for-testing';
process.env.JWT_EXPIRES_IN = '7d';
process.env.JWT_REFRESH_EXPIRES_IN = '30d';
process.env.PORT = '3001';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';

// Global test helpers
export const mockDbQuery = db.query as jest.MockedFunction<typeof db.query>;

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

