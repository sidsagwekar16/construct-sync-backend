-- Remove the overly restrictive constraint that prevents having both job_id and contract_id
-- A variation can be associated with both a job and a contract

ALTER TABLE job_variations
DROP CONSTRAINT IF EXISTS check_job_or_contract;

-- Add a new constraint that requires at least ONE of job_id or contract_id
ALTER TABLE job_variations
ADD CONSTRAINT check_job_or_contract CHECK (
  job_id IS NOT NULL OR contract_id IS NOT NULL
);
