# Soft Delete Quick Reference

## 📋 At-a-Glance Summary

### Tables with Soft Delete (28 total)

#### ✅ Core Business (4)
`companies` • `users` • `teams` • `team_members`

#### ✅ Sites (4)
`sites` • `site_media` • `site_memos` • `site_zones`

#### ✅ Jobs (11)
`jobs` • `job_blocks` • `job_units` • `job_tasks` • `job_photos` • `job_documents` • `job_issues` • `job_variations` • `job_diary_entries` • `progress_milestones` • `job_budgets`

#### ✅ Materials (3)
`materials` • `material_requests` • `material_usage`

#### ✅ Subcontractors (1)
`subcontractor_contracts`

#### ✅ Safety (4)
`safety_incidents` • `near_miss_reports` • `safety_inspections` • `hazard_reports`

#### ✅ Documents (2)
`document_folders` • `construction_documents`

#### ✅ Financial (1)
`budget_line_items`

### Tables WITHOUT Soft Delete (Hard Delete)

#### ⛔ Authentication
`sessions` • `refresh_tokens` • `device_tokens`

#### ⛔ Operational
`worker_locations` • `time_entries` • `stock_adjustments` • `contract_payments` • `cost_transactions` • `job_revenue`

#### ⛔ System
`notifications` • `notification_preferences` • `company_settings` • `media_uploads` • `document_chunks`

#### ⛔ AI & Chat
`ai_query_history` • `chat_conversations` • `chat_messages`

#### ⛔ Audit
`audit_logs` • `system_settings` • `safety_training_records`

---

## 💡 Quick Code Snippets

### SQL Query Pattern
```sql
-- ✅ DO THIS (excludes deleted)
SELECT * FROM jobs WHERE deleted_at IS NULL;

-- ❌ NOT THIS (includes deleted)
SELECT * FROM jobs;
```

### Drizzle ORM (TypeScript)
```typescript
// Fetch active records
const activeJobs = await db
  .select()
  .from(jobs)
  .where(and(
    eq(jobs.companyId, companyId),
    isNull(jobs.deletedAt)
  ));

// Soft delete
await db
  .update(jobs)
  .set({ 
    deletedAt: new Date(), 
    updatedAt: new Date() 
  })
  .where(eq(jobs.id, jobId));

// Restore
await db
  .update(jobs)
  .set({ 
    deletedAt: null, 
    updatedAt: new Date() 
  })
  .where(eq(jobs.id, jobId));
```

### Prisma (TypeScript)
```typescript
// Fetch active records
const activeJobs = await prisma.jobs.findMany({
  where: {
    companyId,
    deletedAt: null
  }
});

// Soft delete
await prisma.jobs.update({
  where: { id: jobId },
  data: { 
    deletedAt: new Date(),
    updatedAt: new Date()
  }
});

// Restore
await prisma.jobs.update({
  where: { id: jobId },
  data: { 
    deletedAt: null,
    updatedAt: new Date()
  }
});
```

### Express API Routes
```typescript
// DELETE /api/jobs/:id
router.delete('/jobs/:id', async (req, res) => {
  await jobService.softDelete(req.params.id);
  res.json({ success: true });
});

// POST /api/jobs/:id/restore
router.post('/jobs/:id/restore', async (req, res) => {
  await jobService.restore(req.params.id);
  res.json({ success: true });
});

// GET /api/jobs/trash
router.get('/jobs/trash', async (req, res) => {
  const deleted = await jobService.findDeleted(req.user.companyId);
  res.json(deleted);
});
```

---

## 🎯 Common Use Cases

### 1. List Active Items
```sql
SELECT * FROM jobs 
WHERE company_id = ? 
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

### 2. List Deleted Items (Trash)
```sql
SELECT * FROM jobs 
WHERE company_id = ? 
  AND deleted_at IS NOT NULL
ORDER BY deleted_at DESC;
```

### 3. Soft Delete
```sql
UPDATE jobs 
SET deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
```

### 4. Restore
```sql
UPDATE jobs 
SET deleted_at = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
```

### 5. Permanently Delete (After 90 Days)
```sql
DELETE FROM jobs 
WHERE deleted_at < NOW() - INTERVAL '90 days';
```

---

## ⚠️ Important Reminders

### Always Filter Deleted Records
```typescript
// ❌ BAD - Returns deleted records too
const jobs = await db.select().from(jobs).where(eq(jobs.companyId, companyId));

// ✅ GOOD - Only active records
const jobs = await db.select().from(jobs)
  .where(and(
    eq(jobs.companyId, companyId),
    isNull(jobs.deletedAt)
  ));
```

### Cascade Deletes Manually
```typescript
// When deleting a job, also soft delete related entities
async function deleteJobWithRelations(jobId: string) {
  await db.update(jobs).set({ deletedAt: new Date() }).where(eq(jobs.id, jobId));
  await db.update(jobTasks).set({ deletedAt: new Date() }).where(eq(jobTasks.jobId, jobId));
  await db.update(jobPhotos).set({ deletedAt: new Date() }).where(eq(jobPhotos.jobId, jobId));
  // ... etc
}
```

### Unique Constraints
```sql
-- Use partial indexes for unique constraints
CREATE UNIQUE INDEX idx_users_email_active 
ON users(email) 
WHERE deleted_at IS NULL;
```

---

## 🔍 Testing Checklist

- [ ] Active records don't include deleted ones
- [ ] Soft delete sets `deleted_at` timestamp
- [ ] Restore nullifies `deleted_at`
- [ ] UI shows deleted items in trash/admin view
- [ ] Cascade deletes work for related entities
- [ ] Unique constraints respect soft delete
- [ ] Cleanup jobs remove old deleted records
- [ ] Performance is acceptable on large tables

---

## 📚 Related Files

- **Migration**: `migration.sql` - Database schema with soft delete
- **Guide**: `SOFT_DELETE_GUIDE.md` - Comprehensive documentation
- **Examples**: `soft-delete-examples.sql` - Query examples

---

## 🚀 Quick Start

1. Run migration: `psql -d your_db -f migration.sql`
2. Update queries to filter `WHERE deleted_at IS NULL`
3. Add delete/restore endpoints
4. Update UI to show trash view
5. Set up cleanup job for old deleted records

---

## 💬 Need Help?

### How do I know if a table has soft delete?
Check if it has a `deleted_at TIMESTAMP NULL` column. See list above.

### Should I soft delete or hard delete?
- **Soft delete**: User-created business data
- **Hard delete**: System logs, sessions, temporary data

### How long should I keep deleted records?
Recommended: 90 days, then permanently delete.

### What about GDPR/data privacy?
Hard delete user data immediately upon request using:
```sql
DELETE FROM users WHERE id = ? AND deleted_at IS NOT NULL;
```

---

**Last Updated**: November 2024  
**Schema Version**: 1.0  
**Soft Delete Tables**: 28  
**Indexes Created**: 28








