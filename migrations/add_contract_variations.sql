-- Add contract_id to job_variations to support both job and contract variations
ALTER TABLE job_variations 
ADD COLUMN contract_id UUID,
ADD CONSTRAINT fk_job_variations_contract 
  FOREIGN KEY (contract_id) REFERENCES subcontractor_contracts(id) ON DELETE CASCADE;

-- Make job_id nullable since variation can be for either job or contract
ALTER TABLE job_variations 
ALTER COLUMN job_id DROP NOT NULL;

-- Add check constraint to ensure either job_id or contract_id is set
ALTER TABLE job_variations
ADD CONSTRAINT check_job_or_contract CHECK (
  (job_id IS NOT NULL AND contract_id IS NULL) OR
  (job_id IS NULL AND contract_id IS NOT NULL)
);

-- Add index for contract_id
CREATE INDEX idx_job_variations_contract_id ON job_variations(contract_id);

COMMENT ON COLUMN job_variations.contract_id IS 'Links variation to a subcontractor contract';
