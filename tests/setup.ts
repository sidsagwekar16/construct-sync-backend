// Test Setup File

// Mock the database query method FIRST, before any imports
export const mockDbQuery = jest.fn().mockResolvedValue({
  rows: [],
  rowCount: 0,
  command: '',
  oid: 0,
  fields: [],
});

jest.mock('../src/db/connection', () => ({
  db: {
    query: mockDbQuery,
    getClient: jest.fn(),
    testConnection: jest.fn().mockResolvedValue(true),
    close: jest.fn(),
  },
}));

// Setup for Jest tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-jwt-tokens-must-be-at-least-32-characters-long';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.JWT_EXPIRES_IN = '7d';
  process.env.JWT_REFRESH_EXPIRES_IN = '30d';
  process.env.PORT = '5000';
  process.env.CORS_ORIGIN = 'http://localhost:3000';
  process.env.RATE_LIMIT_WINDOW_MS = '900000';
  process.env.RATE_LIMIT_MAX_REQUESTS = '100';
});

afterAll(async () => {
  // Clean up after all tests
  jest.clearAllMocks();
});

beforeEach(() => {
  // Clear mock history before each test and reset to default
  mockDbQuery.mockClear();
  mockDbQuery.mockResolvedValue({
    rows: [],
    rowCount: 0,
    command: '',
    oid: 0,
    fields: [],
  });
});

// Increase timeout for database operations
jest.setTimeout(30000);

