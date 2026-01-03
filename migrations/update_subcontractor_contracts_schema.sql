-- Update subcontractor_contracts table structure to match current schema

-- Add missing columns
ALTER TABLE subcontractor_contracts 
ADD COLUMN IF NOT EXISTS subcontractor_id UUID,
ADD COLUMN IF NOT EXISTS contract_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS completion_date DATE,
ADD COLUMN IF NOT EXISTS progress_percentage DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update title from subcontractor_name if title is null
UPDATE subcontractor_contracts 
SET title = COALESCE(subcontractor_name, 'Untitled Contract')
WHERE title IS NULL;

-- Make title NOT NULL after populating it
ALTER TABLE subcontractor_contracts 
ALTER COLUMN title SET NOT NULL;

-- Create foreign key for subcontractor_id if subcontractors table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subcontractors') THEN
    ALTER TABLE subcontractor_contracts
    ADD CONSTRAINT fk_subcontractor_contracts_subcontractor
    FOREIGN KEY (subcontractor_id) REFERENCES subcontractors(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_subcontractor_contracts_subcontractor_id 
ON subcontractor_contracts(subcontractor_id);

CREATE INDEX IF NOT EXISTS idx_subcontractor_contracts_contract_number 
ON subcontractor_contracts(contract_number);

COMMENT ON COLUMN subcontractor_contracts.subcontractor_id IS 'Links to subcontractors table';
COMMENT ON COLUMN subcontractor_contracts.title IS 'Contract title';
