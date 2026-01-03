-- Make old subcontractor_contracts columns nullable for backward compatibility
ALTER TABLE subcontractor_contracts 
ALTER COLUMN subcontractor_name DROP NOT NULL;

-- Add defaults for legacy columns
UPDATE subcontractor_contracts 
SET subcontractor_name = COALESCE(subcontractor_name, 'Legacy Contract')
WHERE subcontractor_name IS NULL;

COMMENT ON COLUMN subcontractor_contracts.subcontractor_name IS 'Legacy column - use subcontractor_id instead';
