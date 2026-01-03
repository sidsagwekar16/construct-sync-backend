-- Migration: Add task_status_history table for tracking task status changes
-- Description: Creates a table to log all status changes for tasks with timestamp and user info

-- Create task_status_history table
CREATE TABLE IF NOT EXISTS task_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES job_tasks(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups by task_id
CREATE INDEX idx_task_status_history_task_id ON task_status_history(task_id);

-- Create index for faster lookups by changed_by
CREATE INDEX idx_task_status_history_changed_by ON task_status_history(changed_by);

-- Create index for faster lookups by changed_at
CREATE INDEX idx_task_status_history_changed_at ON task_status_history(changed_at DESC);

-- Add comment to table
COMMENT ON TABLE task_status_history IS 'Tracks all status changes for tasks with timestamp and user information';

-- Add comments to columns
COMMENT ON COLUMN task_status_history.id IS 'Unique identifier for the status history entry';
COMMENT ON COLUMN task_status_history.task_id IS 'Reference to the task';
COMMENT ON COLUMN task_status_history.old_status IS 'Previous status before the change';
COMMENT ON COLUMN task_status_history.new_status IS 'New status after the change';
COMMENT ON COLUMN task_status_history.changed_by IS 'User who made the status change';
COMMENT ON COLUMN task_status_history.changed_at IS 'Timestamp when the status was changed';
COMMENT ON COLUMN task_status_history.notes IS 'Optional notes about the status change';
