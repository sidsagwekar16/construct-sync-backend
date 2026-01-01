-- Add job_id column to site_budget_expenses table to track which job an expense belongs to
ALTER TABLE site_budget_expenses 
ADD COLUMN job_id UUID;

-- Add foreign key constraint
ALTER TABLE site_budget_expenses
ADD CONSTRAINT fk_site_budget_expenses_job
FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_site_budget_expenses_job_id ON site_budget_expenses(job_id);
