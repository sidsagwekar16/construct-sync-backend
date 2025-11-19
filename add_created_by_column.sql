-- Quick migration to add created_by column to jobs table
-- Run this directly in your database if the migration runner didn't work

-- Step 1: Check if column exists
DO $$ 
DECLARE
    column_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'jobs' 
        AND column_name = 'created_by'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE '✅ Column created_by already exists in jobs table';
    ELSE
        RAISE NOTICE '🔄 Adding created_by column to jobs table...';
        
        -- Step 2: Add the column as nullable first
        ALTER TABLE jobs 
        ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;
        
        -- Step 3: Update existing rows with a default value
        UPDATE jobs 
        SET created_by = (
            SELECT u.id 
            FROM users u 
            WHERE u.company_id = jobs.company_id 
            AND u.role IN ('company_admin', 'project_manager', 'super_admin')
            ORDER BY u.created_at ASC
            LIMIT 1
        )
        WHERE created_by IS NULL;
        
        -- Step 4: Make the column NOT NULL
        ALTER TABLE jobs 
        ALTER COLUMN created_by SET NOT NULL;
        
        RAISE NOTICE '✅ Successfully added created_by column to jobs table';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name = 'created_by';

