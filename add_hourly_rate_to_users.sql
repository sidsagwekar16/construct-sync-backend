-- Migration: Add hourly_rate column to users table
-- This allows setting default hourly rate per user for check-in billing

-- Add hourly_rate column
ALTER TABLE users 
ADD COLUMN hourly_rate DECIMAL(10, 2) DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN users.hourly_rate IS 'Default hourly billing rate for worker check-ins (can be null)';

-- Create index for faster queries on workers with rates
CREATE INDEX idx_users_hourly_rate ON users(hourly_rate) WHERE hourly_rate IS NOT NULL AND deleted_at IS NULL;
