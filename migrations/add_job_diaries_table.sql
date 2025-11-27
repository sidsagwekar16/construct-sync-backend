-- Migration: Add job_diaries table
-- Created: 2025-11-27

-- Create job_diaries table
CREATE TABLE IF NOT EXISTS job_diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- Create index on job_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_job_diaries_job_id ON job_diaries(job_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_job_diaries_created_at ON job_diaries(created_at DESC);

-- Add comment to table
COMMENT ON TABLE job_diaries IS 'Daily diary entries for jobs';
COMMENT ON COLUMN job_diaries.id IS 'Unique identifier for the diary entry';
COMMENT ON COLUMN job_diaries.job_id IS 'Reference to the job';
COMMENT ON COLUMN job_diaries.content IS 'Diary entry content';
COMMENT ON COLUMN job_diaries.created_by IS 'User who created the diary entry';
COMMENT ON COLUMN job_diaries.created_at IS 'Timestamp when diary entry was created (UTC)';
COMMENT ON COLUMN job_diaries.updated_at IS 'Timestamp when diary entry was last updated (UTC)';
