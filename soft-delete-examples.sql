-- ============================================
-- SOFT DELETE QUERY EXAMPLES
-- ============================================
-- Production-ready SQL examples for working with soft delete

-- ============================================
-- 1. STANDARD QUERIES (Active Records Only)
-- ============================================

-- Fetch all active jobs for a company
SELECT * FROM jobs 
WHERE company_id = '123e4567-e89b-12d3-a456-426614174000'
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- Fetch active tasks assigned to a user
SELECT * FROM job_tasks 
WHERE assigned_to = '123e4567-e89b-12d3-a456-426614174001'
  AND deleted_at IS NULL
  AND status != 'completed'
ORDER BY due_date ASC;

-- Get active materials with low stock
SELECT * FROM materials 
WHERE company_id = '123e4567-e89b-12d3-a456-426614174000'
  AND deleted_at IS NULL
  AND stock_quantity < 10
ORDER BY name;

-- Join with soft delete tables
SELECT 
  j.id,
  j.name,
  s.name as site_name,
  COUNT(jt.id) as task_count
FROM jobs j
LEFT JOIN sites s ON j.site_id = s.id AND s.deleted_at IS NULL
LEFT JOIN job_tasks jt ON j.id = jt.job_id AND jt.deleted_at IS NULL
WHERE j.company_id = '123e4567-e89b-12d3-a456-426614174000'
  AND j.deleted_at IS NULL
GROUP BY j.id, j.name, s.name;

-- ============================================
-- 2. SOFT DELETE OPERATIONS
-- ============================================

-- Soft delete a job
UPDATE jobs 
SET deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id = '123e4567-e89b-12d3-a456-426614174002';

-- Soft delete with cascade (manual cascade to related entities)
BEGIN;
  -- Delete the job
  UPDATE jobs 
  SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = '123e4567-e89b-12d3-a456-426614174002';
  
  -- Delete related tasks
  UPDATE job_tasks 
  SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE job_id = '123e4567-e89b-12d3-a456-426614174002';
  
  -- Delete related photos
  UPDATE job_photos 
  SET deleted_at = CURRENT_TIMESTAMP
  WHERE job_id = '123e4567-e89b-12d3-a456-426614174002';
  
  -- Delete related documents
  UPDATE job_documents 
  SET deleted_at = CURRENT_TIMESTAMP
  WHERE job_id = '123e4567-e89b-12d3-a456-426614174002';
COMMIT;

-- Bulk soft delete (e.g., delete all completed jobs older than 2 years)
UPDATE jobs 
SET deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE company_id = '123e4567-e89b-12d3-a456-426614174000'
  AND status = 'completed'
  AND end_date < CURRENT_DATE - INTERVAL '2 years'
  AND deleted_at IS NULL;

-- ============================================
-- 3. RESTORE OPERATIONS
-- ============================================

-- Restore a single job
UPDATE jobs 
SET deleted_at = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE id = '123e4567-e89b-12d3-a456-426614174002';

-- Restore with cascade (restore related entities)
BEGIN;
  -- Restore the job
  UPDATE jobs 
  SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
  WHERE id = '123e4567-e89b-12d3-a456-426614174002';
  
  -- Restore related tasks
  UPDATE job_tasks 
  SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
  WHERE job_id = '123e4567-e89b-12d3-a456-426614174002'
    AND deleted_at IS NOT NULL;
  
  -- Restore related photos
  UPDATE job_photos 
  SET deleted_at = NULL
  WHERE job_id = '123e4567-e89b-12d3-a456-426614174002'
    AND deleted_at IS NOT NULL;
  
  -- Restore related documents
  UPDATE job_documents 
  SET deleted_at = NULL
  WHERE job_id = '123e4567-e89b-12d3-a456-426614174002'
    AND deleted_at IS NOT NULL;
COMMIT;

-- ============================================
-- 4. ADMIN/AUDIT QUERIES
-- ============================================

-- View recently deleted jobs (last 30 days)
SELECT 
  id,
  name,
  status,
  deleted_at,
  EXTRACT(DAY FROM CURRENT_TIMESTAMP - deleted_at) as days_ago
FROM jobs
WHERE company_id = '123e4567-e89b-12d3-a456-426614174000'
  AND deleted_at IS NOT NULL
  AND deleted_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
ORDER BY deleted_at DESC;

-- Count deleted vs active records
SELECT 
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_count,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_count,
  COUNT(*) as total_count
FROM jobs
WHERE company_id = '123e4567-e89b-12d3-a456-426614174000';

-- Find orphaned soft-deleted records (deleted parent, active children)
SELECT 
  jt.id,
  jt.title,
  jt.deleted_at as task_deleted_at,
  j.deleted_at as job_deleted_at
FROM job_tasks jt
INNER JOIN jobs j ON jt.job_id = j.id
WHERE jt.deleted_at IS NULL
  AND j.deleted_at IS NOT NULL;

-- Get deletion activity report
SELECT 
  DATE(deleted_at) as deletion_date,
  COUNT(*) as deletions_count
FROM jobs
WHERE company_id = '123e4567-e89b-12d3-a456-426614174000'
  AND deleted_at IS NOT NULL
  AND deleted_at > CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(deleted_at)
ORDER BY deletion_date DESC;

-- ============================================
-- 5. DATA CLEANUP (Hard Delete)
-- ============================================

-- Hard delete old soft-deleted records (90+ days old)
DELETE FROM jobs 
WHERE deleted_at IS NOT NULL 
  AND deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';

-- Preview records to be hard deleted
SELECT 
  id,
  name,
  deleted_at,
  EXTRACT(DAY FROM CURRENT_TIMESTAMP - deleted_at) as days_deleted
FROM jobs
WHERE deleted_at IS NOT NULL 
  AND deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days'
ORDER BY deleted_at ASC;

-- Cleanup all tables (use with caution!)
BEGIN;
  DELETE FROM budget_line_items WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM job_budgets WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM construction_documents WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM document_folders WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM hazard_reports WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM safety_inspections WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM near_miss_reports WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM safety_incidents WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM subcontractor_contracts WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM material_usage WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM material_requests WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM materials WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM progress_milestones WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM job_diary_entries WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM job_variations WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM job_issues WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM job_documents WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM job_photos WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM job_tasks WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM job_units WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM job_blocks WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM jobs WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM site_zones WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM site_memos WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM site_media WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM sites WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM team_members WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM teams WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM users WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  DELETE FROM companies WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
COMMIT;

-- ============================================
-- 6. SPECIALIZED QUERIES
-- ============================================

-- Get active count of jobs per status (excluding deleted)
SELECT 
  status,
  COUNT(*) as count
FROM jobs
WHERE company_id = '123e4567-e89b-12d3-a456-426614174000'
  AND deleted_at IS NULL
GROUP BY status
ORDER BY count DESC;

-- Find users with deleted teams
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  t.name as deleted_team_name
FROM users u
INNER JOIN team_members tm ON u.id = tm.user_id AND tm.deleted_at IS NULL
INNER JOIN teams t ON tm.team_id = t.id AND t.deleted_at IS NOT NULL
WHERE u.company_id = '123e4567-e89b-12d3-a456-426614174000'
  AND u.deleted_at IS NULL;

-- Calculate storage used by soft-deleted documents
SELECT 
  COUNT(*) as deleted_docs_count,
  SUM(LENGTH(document_url)) as approx_storage_bytes
FROM construction_documents
WHERE deleted_at IS NOT NULL;

-- Active materials with deleted usage records (data integrity check)
SELECT 
  m.id,
  m.name,
  COUNT(mu.id) as deleted_usage_count
FROM materials m
INNER JOIN material_usage mu ON m.id = mu.material_id AND mu.deleted_at IS NOT NULL
WHERE m.deleted_at IS NULL
GROUP BY m.id, m.name
HAVING COUNT(mu.id) > 0;

-- ============================================
-- 7. PERFORMANCE TESTING QUERIES
-- ============================================

-- Explain analyze for active jobs query (check index usage)
EXPLAIN ANALYZE
SELECT * FROM jobs 
WHERE company_id = '123e4567-e89b-12d3-a456-426614174000'
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 50;

-- Test index effectiveness on deleted_at
EXPLAIN ANALYZE
SELECT * FROM jobs 
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC
LIMIT 100;

-- Compare performance: with vs without soft delete filter
-- (Should use idx_jobs_company_id and idx_jobs_deleted_at)
EXPLAIN ANALYZE
SELECT j.*, COUNT(jt.id) as task_count
FROM jobs j
LEFT JOIN job_tasks jt ON j.id = jt.job_id AND jt.deleted_at IS NULL
WHERE j.company_id = '123e4567-e89b-12d3-a456-426614174000'
  AND j.deleted_at IS NULL
GROUP BY j.id;

-- ============================================
-- 8. UTILITY FUNCTIONS
-- ============================================

-- Function to soft delete a job and all related entities
CREATE OR REPLACE FUNCTION soft_delete_job_cascade(job_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE jobs SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = job_uuid;
  UPDATE job_tasks SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE job_id = job_uuid;
  UPDATE job_photos SET deleted_at = CURRENT_TIMESTAMP WHERE job_id = job_uuid;
  UPDATE job_documents SET deleted_at = CURRENT_TIMESTAMP WHERE job_id = job_uuid;
  UPDATE job_issues SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE job_id = job_uuid;
  UPDATE job_variations SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE job_id = job_uuid;
  UPDATE job_diary_entries SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE job_id = job_uuid;
  UPDATE progress_milestones SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE job_id = job_uuid;
  UPDATE material_requests SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE job_id = job_uuid;
  UPDATE material_usage SET deleted_at = CURRENT_TIMESTAMP WHERE job_id = job_uuid;
  UPDATE job_budgets SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE job_id = job_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to restore a job and all related entities
CREATE OR REPLACE FUNCTION restore_job_cascade(job_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE jobs SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = job_uuid;
  UPDATE job_tasks SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE job_id = job_uuid;
  UPDATE job_photos SET deleted_at = NULL WHERE job_id = job_uuid;
  UPDATE job_documents SET deleted_at = NULL WHERE job_id = job_uuid;
  UPDATE job_issues SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE job_id = job_uuid;
  UPDATE job_variations SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE job_id = job_uuid;
  UPDATE job_diary_entries SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE job_id = job_uuid;
  UPDATE progress_milestones SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE job_id = job_uuid;
  UPDATE material_requests SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE job_id = job_uuid;
  UPDATE material_usage SET deleted_at = NULL WHERE job_id = job_uuid;
  UPDATE job_budgets SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE job_id = job_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to hard delete old soft-deleted records
CREATE OR REPLACE FUNCTION cleanup_old_deleted_records(days_old INTEGER DEFAULT 90)
RETURNS TABLE(table_name TEXT, rows_deleted BIGINT) AS $$
DECLARE
  cutoff_date TIMESTAMP;
  rows_count BIGINT;
BEGIN
  cutoff_date := CURRENT_TIMESTAMP - (days_old || ' days')::INTERVAL;
  
  DELETE FROM budget_line_items WHERE deleted_at < cutoff_date;
  GET DIAGNOSTICS rows_count = ROW_COUNT;
  RETURN QUERY SELECT 'budget_line_items'::TEXT, rows_count;
  
  DELETE FROM job_budgets WHERE deleted_at < cutoff_date;
  GET DIAGNOSTICS rows_count = ROW_COUNT;
  RETURN QUERY SELECT 'job_budgets'::TEXT, rows_count;
  
  DELETE FROM construction_documents WHERE deleted_at < cutoff_date;
  GET DIAGNOSTICS rows_count = ROW_COUNT;
  RETURN QUERY SELECT 'construction_documents'::TEXT, rows_count;
  
  DELETE FROM document_folders WHERE deleted_at < cutoff_date;
  GET DIAGNOSTICS rows_count = ROW_COUNT;
  RETURN QUERY SELECT 'document_folders'::TEXT, rows_count;
  
  -- Add more tables as needed...
  
END;
$$ LANGUAGE plpgsql;

-- Usage examples:
-- SELECT * FROM soft_delete_job_cascade('123e4567-e89b-12d3-a456-426614174002');
-- SELECT * FROM restore_job_cascade('123e4567-e89b-12d3-a456-426614174002');
-- SELECT * FROM cleanup_old_deleted_records(90);


