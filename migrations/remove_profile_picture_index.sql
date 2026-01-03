-- Remove index on profile_picture column as base64 images are too large for indexing
DROP INDEX IF EXISTS idx_users_profile_picture;
