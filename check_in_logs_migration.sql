-- ============================================
-- CHECK-IN LOGS TABLE MIGRATION
-- ============================================
-- Feature: Employee check-in/check-out system for time tracking
-- Tracks worker time on jobs for billable calculations
-- ============================================

-- Create check-in logs table
CREATE TABLE check_in_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  check_out_time TIMESTAMP,
  duration_hours DECIMAL(5, 2),
  hourly_rate DECIMAL(10, 2),
  billable_amount DECIMAL(15, 2),
  notes TEXT,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_check_in_logs_user_id ON check_in_logs(user_id);
CREATE INDEX idx_check_in_logs_job_id ON check_in_logs(job_id);
CREATE INDEX idx_check_in_logs_check_in_time ON check_in_logs(check_in_time);
CREATE INDEX idx_check_in_logs_deleted_at ON check_in_logs(deleted_at);
CREATE INDEX idx_check_in_logs_active ON check_in_logs(user_id, job_id) WHERE check_out_time IS NULL AND deleted_at IS NULL;

-- Add comments for documentation
COMMENT ON TABLE check_in_logs IS 'Tracks employee check-in/check-out times for jobs';
COMMENT ON COLUMN check_in_logs.user_id IS 'Worker who checked in';
COMMENT ON COLUMN check_in_logs.job_id IS 'Job the worker checked in for';
COMMENT ON COLUMN check_in_logs.check_in_time IS 'When the worker checked in';
COMMENT ON COLUMN check_in_logs.check_out_time IS 'When the worker checked out (NULL if still checked in)';
COMMENT ON COLUMN check_in_logs.duration_hours IS 'Calculated hours worked (check_out_time - check_in_time)';
COMMENT ON COLUMN check_in_logs.hourly_rate IS 'Worker hourly rate at time of check-in';
COMMENT ON COLUMN check_in_logs.billable_amount IS 'Calculated billable amount (duration_hours * hourly_rate)';
