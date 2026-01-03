-- Add profile_picture column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_profile_picture ON users(profile_picture) WHERE profile_picture IS NOT NULL;
