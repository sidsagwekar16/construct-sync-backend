-- ============================================
-- SUBCONTRACTOR MODULE MIGRATION
-- ============================================
-- Creates subcontractors table and updates subcontractor_contracts
-- Version: 1.0
-- Date: 2024
-- ============================================

-- ============================================
-- STEP 1: Create Subcontractors Table
-- ============================================
-- This table stores subcontractor company details
-- Subcontractors are external companies that work on jobs

CREATE TABLE IF NOT EXISTS subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  business_name VARCHAR(255),
  abn VARCHAR(50),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  trade VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- STEP 2: Update Subcontractor Contracts Table
-- ============================================
-- Drop the existing table and recreate with proper relationships

DROP TABLE IF EXISTS contract_payments CASCADE;
DROP TABLE IF EXISTS subcontractor_contracts CASCADE;

-- Recreate subcontractor_contracts with reference to subcontractors table
CREATE TABLE subcontractor_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subcontractor_id UUID NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  contract_number VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  contract_value DECIMAL(15, 2),
  start_date DATE,
  end_date DATE,
  completion_date DATE,
  status contract_status DEFAULT 'draft',
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  payment_terms TEXT,
  notes TEXT,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recreate contract_payments table
CREATE TABLE contract_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES subcontractor_contracts(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  payment_date DATE,
  payment_method payment_method,
  reference_number VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- STEP 3: Create Indexes for Performance
-- ============================================

-- Subcontractors indexes
CREATE INDEX idx_subcontractors_company_id ON subcontractors(company_id);
CREATE INDEX idx_subcontractors_deleted_at ON subcontractors(deleted_at);
CREATE INDEX idx_subcontractors_name ON subcontractors(name);
CREATE INDEX idx_subcontractors_trade ON subcontractors(trade);
CREATE INDEX idx_subcontractors_is_active ON subcontractors(is_active);

-- Subcontractor contracts indexes
CREATE INDEX idx_subcontractor_contracts_company_id ON subcontractor_contracts(company_id);
CREATE INDEX idx_subcontractor_contracts_subcontractor_id ON subcontractor_contracts(subcontractor_id);
CREATE INDEX idx_subcontractor_contracts_job_id ON subcontractor_contracts(job_id);
CREATE INDEX idx_subcontractor_contracts_deleted_at ON subcontractor_contracts(deleted_at);
CREATE INDEX idx_subcontractor_contracts_status ON subcontractor_contracts(status);
CREATE INDEX idx_subcontractor_contracts_contract_number ON subcontractor_contracts(contract_number);

-- Contract payments indexes
CREATE INDEX idx_contract_payments_contract_id ON contract_payments(contract_id);
CREATE INDEX idx_contract_payments_payment_date ON contract_payments(payment_date);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- 
-- New Tables:
-- - subcontractors (external companies that perform work)
-- - subcontractor_contracts (agreements/projects with subcontractors)
-- - contract_payments (payment records for contracts)
-- 
-- To apply this migration:
-- psql -d construct_sync -f SUBCONTRACTOR_MIGRATION.sql
-- 
-- ============================================



