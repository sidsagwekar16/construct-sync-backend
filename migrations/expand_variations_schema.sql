-- Add additional fields to job_variations table to match frontend form structure

ALTER TABLE job_variations
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS pricing_model VARCHAR(100),
ADD COLUMN IF NOT EXISTS subcontractor_amount DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS labor_cost DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS materials_client_charge DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS materials_actual_cost DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS is_chargeable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS requires_subcontractor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS client_approval_required BOOLEAN DEFAULT false;

-- Add index for assigned_to for performance
CREATE INDEX IF NOT EXISTS idx_job_variations_assigned_to ON job_variations(assigned_to);

-- Add index for priority
CREATE INDEX IF NOT EXISTS idx_job_variations_priority ON job_variations(priority);
