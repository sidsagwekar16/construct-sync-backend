// Test Setup File

import { db } from '../src/db/connection';

// Mock the database query method
export const mockDbQuery = jest.fn();

jest.mock('../src/db/connection', () => ({
  db: {
    query: jest.fn(),
    getClient: jest.fn(),
    testConnection: jest.fn().mockResolvedValue(true),
    close: jest.fn(),
  },
}));

// Setup for Jest tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-jwt-tokens';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  
  // Set up the mock
  (db.query as jest.Mock).mockImplementation(mockDbQuery);
});

afterAll(async () => {
  // Clean up after all tests
  jest.clearAllMocks();
});

beforeEach(() => {
  // Clear mock history before each test
  mockDbQuery.mockClear();
});

// Increase timeout for database operations
jest.setTimeout(30000);
