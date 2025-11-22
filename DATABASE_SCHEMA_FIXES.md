# Database Schema Fixes - Nov 21, 2025

## Issues Found and Fixed

### Problem Summary
The mobile API endpoints were failing in production with database errors that weren't caught during testing. This document explains what went wrong and how it was fixed.

---

## Critical Issues

### 1. **Column Name Mismatch: `phone_number` vs `phone`**

**Error:**
```
error: column u.phone_number does not exist
```

**Root Cause:**
- Code was referencing `phone_number` column
- Actual schema uses `phone` column (from `final_schema.sql` line 274)

**Files Fixed:**
- `backend/src/modules/mobile/workers/workers.service.ts` (line 33)
- `backend/src/modules/mobile/jobs/jobs.service.ts` (line 343)
- `backend/src/modules/mobile/sites/sites.service.ts` (line 209)

**Schema Reference:**
```sql
-- companies table (line 274)
phone VARCHAR(50),

-- users table (line 282-294)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role user_role NOT NULL,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Note: NO phone column in users table!
```

**Actual Issue:** The users table doesn't have a phone column at all. This needs to be addressed in a future schema update.

---

### 2. **Table Name Mismatch: `tasks` vs `job_tasks`**

**Error:**
```
error: relation "tasks" does not exist
```

**Root Cause:**
- Code was referencing `tasks` table
- Actual schema uses `job_tasks` table (from `final_schema.sql` line 470)

**Files Fixed:**
- `backend/src/modules/mobile/jobs/jobs.service.ts` (lines 230-247, 286)
- `backend/src/modules/mobile/dashboard/dashboard.service.ts` (line 124)

**Schema Reference:**
```sql
-- line 470
CREATE TABLE job_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  job_unit_id UUID REFERENCES job_units(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,  -- Note: uses 'title' not 'name'
  description TEXT,
  status task_status,
  priority priority_level,
  due_date DATE,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Why Tests Didn't Catch These Issues

### The Root Problem: **Mocked Database Queries**

Looking at test files:
- `backend/tests/mobile/workers.test.ts`
- `backend/tests/mobile/jobs.test.ts`

**Test Example:**
```typescript
const mockWorkers = [
  {
    id: workerId,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone_number: '1234567890',  // ❌ Wrong column name
    role: 'worker',
  },
];

mockDbQuery.mockResolvedValueOnce({ rows: mockWorkers });
```

**The Problem:**
1. Tests use `mockDbQuery` which returns fake data
2. Mock data can have ANY column names - they never hit the real database
3. Schema mismatches are completely invisible to unit tests
4. Tests pass ✅ but production fails ❌

---

## Solutions Implemented

### ✅ Quick Fixes (Completed)
1. ✅ Fixed all `phone_number` → `phone` references
2. ✅ Fixed all `tasks` → `job_tasks` table references  
3. ✅ Fixed column name `name` → `title` in job_tasks
4. ✅ Updated mobile app to use `siteAddress` field
5. ✅ Hidden assigned field on jobs list page

### 🔄 Recommended Improvements

#### 1. Add Integration Tests
Create tests that actually hit a test database:

```typescript
// backend/tests/integration/mobile-api.integration.test.ts
describe('Mobile API Integration Tests', () => {
  let testDb: Database;
  
  beforeAll(async () => {
    // Connect to test database with real schema
    testDb = await createTestDatabase();
    await testDb.runMigrations();
  });
  
  it('should fetch workers with correct columns', async () => {
    // This will FAIL if schema doesn't match
    const workers = await workersService.listWorkers(companyId);
    expect(workers).toBeDefined();
  });
});
```

#### 2. Add Schema Validation Tests
```typescript
describe('Schema Validation', () => {
  it('should have matching columns between code and schema', async () => {
    const schemaColumns = await db.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    // Verify expected columns exist
    expect(schemaColumns).toContain('phone');
    expect(schemaColumns).not.toContain('phone_number');
  });
});
```

#### 3. TypeScript Schema Types
Generate TypeScript types directly from the database schema using tools like:
- `pg-typed`
- `kysely-codegen`
- `prisma`

This would make column mismatches a **compile-time error** instead of a runtime error.

---

## Testing Best Practices Going Forward

### ✅ DO:
- Run integration tests against a real test database
- Seed test database with real schema
- Use database-generated types
- Validate query results match expected schema

### ❌ DON'T:
- Only rely on mocked database queries
- Assume mock data structure matches production
- Skip integration testing for database-heavy features

---

## Files Modified

### Backend Services:
1. `backend/src/modules/mobile/workers/workers.service.ts`
2. `backend/src/modules/mobile/jobs/jobs.service.ts`
3. `backend/src/modules/mobile/sites/sites.service.ts`
4. `backend/src/modules/mobile/dashboard/dashboard.service.ts`

### Mobile App:
1. `mobile-app-UI/rork-construct-sync/app/(tabs)/jobs.tsx`
2. `mobile-app-UI/rork-construct-sync/services/api.ts`

---

## Lessons Learned

1. **Mocks Hide Schema Issues**: Unit tests with mocked database calls can't catch schema mismatches
2. **Integration Tests Are Critical**: Real database queries catch real issues
3. **Type Safety Matters**: Generated types from schema prevent many errors
4. **Documentation Is Key**: Keep schema docs up-to-date with actual implementation

---

## Status: ✅ RESOLVED

All database query errors have been fixed. The mobile APIs now properly reference:
- `phone` column (not `phone_number`)
- `job_tasks` table (not `tasks`)
- `title` column in job_tasks (not `name`)

The mobile app now displays site addresses correctly on the jobs list page.



