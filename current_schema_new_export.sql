-- ============================================
-- CONSTRUCTSYNC DATABASE - CURRENT SCHEMA
-- ============================================
-- Exported on: 2025-11-25T14:35:43.894Z
-- Database: constructsync
-- ============================================

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE adjustment_type AS ENUM (
  '{addition,removal,correction,damage,loss,return}'
);

CREATE TYPE contract_status AS ENUM (
  '{draft,active,completed,terminated,expired}'
);

CREATE TYPE document_type AS ENUM (
  '{blueprint,specification,contract,invoice,permit,inspection_report,safety_report,photo,video,other}'
);

CREATE TYPE hazard_type AS ENUM (
  '{slip_trip_fall,electrical,chemical,fire,equipment,structural,environmental,ergonomic,other}'
);

CREATE TYPE inspection_status AS ENUM (
  '{scheduled,in_progress,completed,failed,passed}'
);

CREATE TYPE inspection_type AS ENUM (
  '{routine,safety,quality,compliance,final,pre_start}'
);

CREATE TYPE issue_status AS ENUM (
  '{open,in_progress,resolved,closed,reopened}'
);

CREATE TYPE job_status AS ENUM (
  '{draft,planned,in_progress,on_hold,completed,cancelled,archived}'
);

CREATE TYPE job_unit_status AS ENUM (
  '{pending,in_progress,completed,on_hold}'
);

CREATE TYPE material_request_status AS ENUM (
  '{pending,approved,rejected,ordered,received,cancelled}'
);

CREATE TYPE media_type AS ENUM (
  '{photo,video,document,audio}'
);

CREATE TYPE milestone_status AS ENUM (
  '{pending,in_progress,completed,delayed,cancelled}'
);

CREATE TYPE notification_type AS ENUM (
  '{task_assigned,task_completed,task_overdue,job_updated,material_requested,material_low_stock,safety_incident,inspection_due,payment_received,document_uploaded,mention,system}'
);

CREATE TYPE payment_method AS ENUM (
  '{cash,check,bank_transfer,credit_card,eft,other}'
);

CREATE TYPE platform_type AS ENUM (
  '{ios,android,web,windows,macos}'
);

CREATE TYPE priority_level AS ENUM (
  '{low,medium,high,urgent,critical}'
);

CREATE TYPE revenue_type AS ENUM (
  '{contract_payment,variation,retention_release,bonus,other}'
);

CREATE TYPE safety_status AS ENUM (
  '{open,investigating,resolved,closed}'
);

CREATE TYPE sender_type AS ENUM (
  '{user,ai,system}'
);

CREATE TYPE severity_level AS ENUM (
  '{minor,moderate,major,critical,fatal}'
);

CREATE TYPE site_status AS ENUM (
  '{planning,active,on_hold,completed,archived}'
);

CREATE TYPE task_status AS ENUM (
  '{pending,in_progress,completed,cancelled,blocked}'
);

CREATE TYPE team_member_role AS ENUM (
  '{lead,member,viewer}'
);

CREATE TYPE transaction_type AS ENUM (
  '{expense,purchase,payment,refund,adjustment}'
);

CREATE TYPE user_role AS ENUM (
  '{super_admin,company_admin,project_manager,site_supervisor,foreman,worker,subcontractor,viewer}'
);

CREATE TYPE variation_status AS ENUM (
  '{draft,submitted,approved,rejected,completed}'
);

-- ============================================
-- TABLES
-- ============================================

-- ai_query_history
CREATE TABLE ai_query_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  query_text TEXT NOT NULL,
  response_text TEXT,
  context_used TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- audit_logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- budget_line_items
CREATE TABLE budget_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_budget_id UUID NOT NULL,
  category VARCHAR(255) NOT NULL,
  description TEXT,
  allocated_amount DECIMAL(15, 2) NOT NULL,
  spent_amount DECIMAL(15, 2) DEFAULT 0,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_budget_id) REFERENCES job_budgets(id) ON DELETE CASCADE
);

-- chat_conversations
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- chat_messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_type sender_type NOT NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
);

-- check_in_logs
CREATE TABLE check_in_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID NOT NULL,
  check_in_time TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  check_out_time TIMESTAMP WITHOUT TIME ZONE,
  duration_hours DECIMAL(5, 2),
  hourly_rate DECIMAL(10, 2),
  billable_amount DECIMAL(15, 2),
  notes TEXT,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- company_settings
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE(company_id)
);

-- construction_documents
CREATE TABLE construction_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID,
  job_id UUID,
  uploaded_by UUID,
  document_name VARCHAR(255) NOT NULL,
  document_url TEXT NOT NULL,
  document_type document_type,
  version VARCHAR(50),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES document_folders(id) ON DELETE SET NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- contract_payments
CREATE TABLE contract_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_date DATE,
  payment_method payment_method,
  reference_number VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES subcontractor_contracts(id) ON DELETE CASCADE
);

-- cost_transactions
CREATE TABLE cost_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  budget_line_item_id UUID,
  transaction_type transaction_type,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  transaction_date DATE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (budget_line_item_id) REFERENCES budget_line_items(id) ON DELETE SET NULL
);

-- device_tokens
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  token VARCHAR(500) NOT NULL,
  platform platform_type,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- document_folders
CREATE TABLE document_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  parent_folder_id UUID,
  name VARCHAR(255) NOT NULL,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_folder_id) REFERENCES document_folders(id) ON DELETE CASCADE
);

-- hazard_reports
CREATE TABLE hazard_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID,
  site_id UUID,
  reported_by UUID,
  hazard_type hazard_type,
  description TEXT NOT NULL,
  severity severity_level,
  status safety_status,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
  FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL
);

-- job_blocks
CREATE TABLE job_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- job_budgets
CREATE TABLE job_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  total_budget DECIMAL(15, 2) NOT NULL,
  allocated_budget DECIMAL(15, 2) DEFAULT 0,
  spent_budget DECIMAL(15, 2) DEFAULT 0,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  UNIQUE(job_id)
);

-- job_diary_entries
CREATE TABLE job_diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  created_by UUID,
  entry_date DATE NOT NULL,
  content TEXT,
  weather VARCHAR(100),
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- job_documents
CREATE TABLE job_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  uploaded_by UUID,
  document_name VARCHAR(255) NOT NULL,
  document_url TEXT NOT NULL,
  document_type document_type,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- job_issues
CREATE TABLE job_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  reported_by UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status issue_status,
  priority priority_level,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL
);

-- job_managers
CREATE TABLE job_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(job_id, user_id)
);

-- job_photos
CREATE TABLE job_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  uploaded_by UUID,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- job_revenue
CREATE TABLE job_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  revenue_type revenue_type,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  revenue_date DATE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- job_tasks
CREATE TABLE job_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  job_unit_id UUID,
  assigned_to UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status task_status,
  priority priority_level,
  due_date DATE,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (job_unit_id) REFERENCES job_units(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- job_units
CREATE TABLE job_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_block_id UUID,
  job_id UUID NOT NULL,
  unit_number VARCHAR(100),
  description TEXT,
  status job_unit_status,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_block_id) REFERENCES job_blocks(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- job_variations
CREATE TABLE job_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  created_by UUID,
  variation_number VARCHAR(100),
  description TEXT,
  amount DECIMAL(15, 2),
  status variation_status,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- job_workers
CREATE TABLE job_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(job_id, user_id)
);

-- jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  site_id UUID,
  job_number VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  job_type VARCHAR(100),
  status job_status,
  priority priority_level,
  start_date TIMESTAMP WITHOUT TIME ZONE,
  end_date TIMESTAMP WITHOUT TIME ZONE,
  completed_date TIMESTAMP WITHOUT TIME ZONE,
  assigned_to UUID,
  created_by UUID NOT NULL,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- material_requests
CREATE TABLE material_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  requested_by UUID,
  material_id UUID NOT NULL,
  quantity DECIMAL(15, 2) NOT NULL,
  status material_request_status,
  requested_date DATE,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

-- material_usage
CREATE TABLE material_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  material_id UUID NOT NULL,
  recorded_by UUID,
  quantity_used DECIMAL(15, 2) NOT NULL,
  usage_date DATE,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- materials
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit VARCHAR(50),
  unit_price DECIMAL(15, 2),
  stock_quantity DECIMAL(15, 2) DEFAULT 0,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- media_uploads
CREATE TABLE media_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size BIGINT,
  related_entity_type VARCHAR(100),
  related_entity_id UUID,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- near_miss_reports
CREATE TABLE near_miss_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID,
  site_id UUID,
  reported_by UUID,
  incident_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  description TEXT NOT NULL,
  potential_severity severity_level,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
  FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL
);

-- notification_preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id)
);

-- notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  notification_type notification_type,
  is_read BOOLEAN DEFAULT false,
  related_entity_type VARCHAR(100),
  related_entity_id UUID,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- progress_milestones
CREATE TABLE progress_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE,
  completion_date DATE,
  status milestone_status,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- refresh_tokens
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(token)
);

-- safety_incidents
CREATE TABLE safety_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID,
  site_id UUID,
  reported_by UUID,
  incident_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  description TEXT NOT NULL,
  severity severity_level,
  status safety_status,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
  FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL
);

-- safety_inspections
CREATE TABLE safety_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID,
  site_id UUID,
  inspected_by UUID,
  inspection_date DATE NOT NULL,
  inspection_type inspection_type,
  findings TEXT,
  status inspection_status,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
  FOREIGN KEY (inspected_by) REFERENCES users(id) ON DELETE SET NULL
);

-- safety_training_records
CREATE TABLE safety_training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  training_type VARCHAR(255) NOT NULL,
  training_date DATE NOT NULL,
  expiry_date DATE,
  certificate_url TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(token)
);

-- site_budget_categories
CREATE TABLE site_budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_budget_id UUID NOT NULL,
  category_name VARCHAR(255) NOT NULL,
  description TEXT,
  allocated_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  spent_amount DECIMAL(15, 2) DEFAULT 0,
  is_custom BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_budget_id) REFERENCES site_budgets(id) ON DELETE CASCADE
);

-- site_budget_expenses
CREATE TABLE site_budget_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_budget_id UUID NOT NULL,
  category_id UUID,
  expense_name VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(15, 2) NOT NULL,
  expense_date DATE NOT NULL,
  vendor VARCHAR(255),
  receipt_url TEXT,
  created_by UUID,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_budget_id) REFERENCES site_budgets(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES site_budget_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- site_budgets
CREATE TABLE site_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  company_id UUID NOT NULL,
  total_budget DECIMAL(15, 2) NOT NULL DEFAULT 0,
  allocated_budget DECIMAL(15, 2) DEFAULT 0,
  spent_budget DECIMAL(15, 2) DEFAULT 0,
  created_by UUID,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(site_id)
);

-- site_media
CREATE TABLE site_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  uploaded_by UUID,
  media_type media_type,
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- site_memos
CREATE TABLE site_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  created_by UUID,
  title VARCHAR(255),
  content TEXT,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- site_zones
CREATE TABLE site_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- sites
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  radius DECIMAL(10, 2) DEFAULT 100.00,
  status site_status,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- stock_adjustments
CREATE TABLE stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL,
  adjusted_by UUID,
  adjustment_type adjustment_type,
  quantity_change DECIMAL(15, 2) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
  FOREIGN KEY (adjusted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- subcontractor_contracts
CREATE TABLE subcontractor_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  subcontractor_id UUID NOT NULL,
  job_id UUID,
  contract_number VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  contract_value DECIMAL(15, 2),
  start_date DATE,
  end_date DATE,
  completion_date DATE,
  status contract_status DEFAULT 'draft'::contract_status,
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  payment_terms TEXT,
  notes TEXT,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (subcontractor_id) REFERENCES subcontractors(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
);

-- subcontractors
CREATE TABLE subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  business_name VARCHAR(255),
  abn VARCHAR(50),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  trade VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- system_settings
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(255) NOT NULL,
  setting_value TEXT,
  description TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(setting_key)
);

-- team_members
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role team_member_role,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(team_id, user_id)
);

-- teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- time_entries
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID,
  clock_in TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  clock_out TIMESTAMP WITHOUT TIME ZONE,
  total_hours DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
);

-- users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role user_role NOT NULL,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  hourly_rate DECIMAL(10, 2) DEFAULT NULL::numeric,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE(email)
);

-- worker_locations
CREATE TABLE worker_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  recorded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_ai_query_history_user_id ON public.ai_query_history USING btree (user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);
CREATE INDEX idx_budget_line_items_deleted_at ON public.budget_line_items USING btree (deleted_at);
CREATE INDEX idx_budget_line_items_job_budget_id ON public.budget_line_items USING btree (job_budget_id);
CREATE INDEX idx_chat_conversations_user_id ON public.chat_conversations USING btree (user_id);
CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages USING btree (conversation_id);
CREATE INDEX idx_check_in_logs_active ON public.check_in_logs USING btree (user_id, job_id) WHERE ((check_out_time IS NULL) AND (deleted_at IS NULL));
CREATE INDEX idx_check_in_logs_check_in_time ON public.check_in_logs USING btree (check_in_time);
CREATE INDEX idx_check_in_logs_deleted_at ON public.check_in_logs USING btree (deleted_at);
CREATE INDEX idx_check_in_logs_job_id ON public.check_in_logs USING btree (job_id);
CREATE INDEX idx_check_in_logs_user_id ON public.check_in_logs USING btree (user_id);
CREATE INDEX idx_companies_deleted_at ON public.companies USING btree (deleted_at);
CREATE UNIQUE INDEX company_settings_company_id_key ON public.company_settings USING btree (company_id);
CREATE INDEX idx_company_settings_company_id ON public.company_settings USING btree (company_id);
CREATE INDEX idx_construction_documents_deleted_at ON public.construction_documents USING btree (deleted_at);
CREATE INDEX idx_construction_documents_folder_id ON public.construction_documents USING btree (folder_id);
CREATE INDEX idx_construction_documents_job_id ON public.construction_documents USING btree (job_id);
CREATE INDEX idx_construction_documents_uploaded_by ON public.construction_documents USING btree (uploaded_by);
CREATE INDEX idx_contract_payments_contract_id ON public.contract_payments USING btree (contract_id);
CREATE INDEX idx_contract_payments_payment_date ON public.contract_payments USING btree (payment_date);
CREATE INDEX idx_cost_transactions_budget_line_item_id ON public.cost_transactions USING btree (budget_line_item_id);
CREATE INDEX idx_cost_transactions_job_id ON public.cost_transactions USING btree (job_id);
CREATE INDEX idx_device_tokens_user_id ON public.device_tokens USING btree (user_id);
CREATE INDEX idx_document_folders_company_id ON public.document_folders USING btree (company_id);
CREATE INDEX idx_document_folders_deleted_at ON public.document_folders USING btree (deleted_at);
CREATE INDEX idx_document_folders_parent_folder_id ON public.document_folders USING btree (parent_folder_id);
CREATE INDEX idx_hazard_reports_deleted_at ON public.hazard_reports USING btree (deleted_at);
CREATE INDEX idx_hazard_reports_job_id ON public.hazard_reports USING btree (job_id);
CREATE INDEX idx_hazard_reports_reported_by ON public.hazard_reports USING btree (reported_by);
CREATE INDEX idx_hazard_reports_site_id ON public.hazard_reports USING btree (site_id);
CREATE INDEX idx_job_blocks_deleted_at ON public.job_blocks USING btree (deleted_at);
CREATE INDEX idx_job_blocks_job_id ON public.job_blocks USING btree (job_id);
CREATE INDEX idx_job_budgets_deleted_at ON public.job_budgets USING btree (deleted_at);
CREATE INDEX idx_job_budgets_job_id ON public.job_budgets USING btree (job_id);
CREATE UNIQUE INDEX job_budgets_job_id_key ON public.job_budgets USING btree (job_id);
CREATE INDEX idx_job_diary_entries_created_by ON public.job_diary_entries USING btree (created_by);
CREATE INDEX idx_job_diary_entries_deleted_at ON public.job_diary_entries USING btree (deleted_at);
CREATE INDEX idx_job_diary_entries_entry_date ON public.job_diary_entries USING btree (entry_date);
CREATE INDEX idx_job_diary_entries_job_id ON public.job_diary_entries USING btree (job_id);
CREATE INDEX idx_job_documents_deleted_at ON public.job_documents USING btree (deleted_at);
CREATE INDEX idx_job_documents_job_id ON public.job_documents USING btree (job_id);
CREATE INDEX idx_job_documents_uploaded_by ON public.job_documents USING btree (uploaded_by);
CREATE INDEX idx_job_issues_deleted_at ON public.job_issues USING btree (deleted_at);
CREATE INDEX idx_job_issues_job_id ON public.job_issues USING btree (job_id);
CREATE INDEX idx_job_issues_reported_by ON public.job_issues USING btree (reported_by);
CREATE INDEX idx_job_managers_job_id ON public.job_managers USING btree (job_id);
CREATE INDEX idx_job_managers_user_id ON public.job_managers USING btree (user_id);
CREATE UNIQUE INDEX job_managers_job_id_user_id_key ON public.job_managers USING btree (job_id, user_id);
CREATE INDEX idx_job_photos_deleted_at ON public.job_photos USING btree (deleted_at);
CREATE INDEX idx_job_photos_job_id ON public.job_photos USING btree (job_id);
CREATE INDEX idx_job_photos_uploaded_by ON public.job_photos USING btree (uploaded_by);
CREATE INDEX idx_job_revenue_job_id ON public.job_revenue USING btree (job_id);
CREATE INDEX idx_job_tasks_assigned_to ON public.job_tasks USING btree (assigned_to);
CREATE INDEX idx_job_tasks_deleted_at ON public.job_tasks USING btree (deleted_at);
CREATE INDEX idx_job_tasks_due_date ON public.job_tasks USING btree (due_date);
CREATE INDEX idx_job_tasks_job_id ON public.job_tasks USING btree (job_id);
CREATE INDEX idx_job_tasks_job_unit_id ON public.job_tasks USING btree (job_unit_id);
CREATE INDEX idx_job_tasks_priority ON public.job_tasks USING btree (priority);
CREATE INDEX idx_job_tasks_status ON public.job_tasks USING btree (status);
CREATE INDEX idx_job_units_deleted_at ON public.job_units USING btree (deleted_at);
CREATE INDEX idx_job_units_job_block_id ON public.job_units USING btree (job_block_id);
CREATE INDEX idx_job_units_job_id ON public.job_units USING btree (job_id);
CREATE INDEX idx_job_variations_created_by ON public.job_variations USING btree (created_by);
CREATE INDEX idx_job_variations_deleted_at ON public.job_variations USING btree (deleted_at);
CREATE INDEX idx_job_variations_job_id ON public.job_variations USING btree (job_id);
CREATE INDEX idx_job_workers_job_id ON public.job_workers USING btree (job_id);
CREATE INDEX idx_job_workers_user_id ON public.job_workers USING btree (user_id);
CREATE UNIQUE INDEX job_workers_job_id_user_id_key ON public.job_workers USING btree (job_id, user_id);
CREATE INDEX idx_jobs_assigned_to ON public.jobs USING btree (assigned_to);
CREATE INDEX idx_jobs_company_id ON public.jobs USING btree (company_id);
CREATE INDEX idx_jobs_created_by ON public.jobs USING btree (created_by);
CREATE INDEX idx_jobs_deleted_at ON public.jobs USING btree (deleted_at);
CREATE INDEX idx_jobs_job_number ON public.jobs USING btree (job_number);
CREATE INDEX idx_jobs_job_type ON public.jobs USING btree (job_type);
CREATE INDEX idx_jobs_priority ON public.jobs USING btree (priority);
CREATE INDEX idx_jobs_site_id ON public.jobs USING btree (site_id);
CREATE INDEX idx_jobs_status ON public.jobs USING btree (status);
CREATE INDEX idx_material_requests_deleted_at ON public.material_requests USING btree (deleted_at);
CREATE INDEX idx_material_requests_job_id ON public.material_requests USING btree (job_id);
CREATE INDEX idx_material_requests_material_id ON public.material_requests USING btree (material_id);
CREATE INDEX idx_material_requests_requested_by ON public.material_requests USING btree (requested_by);
CREATE INDEX idx_material_usage_deleted_at ON public.material_usage USING btree (deleted_at);
CREATE INDEX idx_material_usage_job_id ON public.material_usage USING btree (job_id);
CREATE INDEX idx_material_usage_material_id ON public.material_usage USING btree (material_id);
CREATE INDEX idx_material_usage_recorded_by ON public.material_usage USING btree (recorded_by);
CREATE INDEX idx_materials_company_id ON public.materials USING btree (company_id);
CREATE INDEX idx_materials_deleted_at ON public.materials USING btree (deleted_at);
CREATE INDEX idx_materials_name ON public.materials USING btree (name);
CREATE INDEX idx_media_uploads_related_entity ON public.media_uploads USING btree (related_entity_type, related_entity_id);
CREATE INDEX idx_media_uploads_uploaded_by ON public.media_uploads USING btree (uploaded_by);
CREATE INDEX idx_near_miss_reports_deleted_at ON public.near_miss_reports USING btree (deleted_at);
CREATE INDEX idx_near_miss_reports_job_id ON public.near_miss_reports USING btree (job_id);
CREATE INDEX idx_near_miss_reports_reported_by ON public.near_miss_reports USING btree (reported_by);
CREATE INDEX idx_near_miss_reports_site_id ON public.near_miss_reports USING btree (site_id);
CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences USING btree (user_id);
CREATE UNIQUE INDEX notification_preferences_user_id_key ON public.notification_preferences USING btree (user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);
CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);
CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);
CREATE INDEX idx_progress_milestones_deleted_at ON public.progress_milestones USING btree (deleted_at);
CREATE INDEX idx_progress_milestones_job_id ON public.progress_milestones USING btree (job_id);
CREATE INDEX idx_refresh_tokens_expires_at ON public.refresh_tokens USING btree (expires_at);
CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens USING btree (token);
CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);
CREATE UNIQUE INDEX refresh_tokens_token_key ON public.refresh_tokens USING btree (token);
CREATE INDEX idx_safety_incidents_deleted_at ON public.safety_incidents USING btree (deleted_at);
CREATE INDEX idx_safety_incidents_incident_date ON public.safety_incidents USING btree (incident_date);
CREATE INDEX idx_safety_incidents_job_id ON public.safety_incidents USING btree (job_id);
CREATE INDEX idx_safety_incidents_reported_by ON public.safety_incidents USING btree (reported_by);
CREATE INDEX idx_safety_incidents_site_id ON public.safety_incidents USING btree (site_id);
CREATE INDEX idx_safety_inspections_deleted_at ON public.safety_inspections USING btree (deleted_at);
CREATE INDEX idx_safety_inspections_inspected_by ON public.safety_inspections USING btree (inspected_by);
CREATE INDEX idx_safety_inspections_job_id ON public.safety_inspections USING btree (job_id);
CREATE INDEX idx_safety_inspections_site_id ON public.safety_inspections USING btree (site_id);
CREATE INDEX idx_safety_training_records_user_id ON public.safety_training_records USING btree (user_id);
CREATE INDEX idx_sessions_expires_at ON public.sessions USING btree (expires_at);
CREATE INDEX idx_sessions_token ON public.sessions USING btree (token);
CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);
CREATE UNIQUE INDEX sessions_token_key ON public.sessions USING btree (token);
CREATE INDEX idx_site_budget_categories_deleted_at ON public.site_budget_categories USING btree (deleted_at);
CREATE INDEX idx_site_budget_categories_site_budget_id ON public.site_budget_categories USING btree (site_budget_id);
CREATE INDEX idx_site_budget_expenses_category_id ON public.site_budget_expenses USING btree (category_id);
CREATE INDEX idx_site_budget_expenses_deleted_at ON public.site_budget_expenses USING btree (deleted_at);
CREATE INDEX idx_site_budget_expenses_expense_date ON public.site_budget_expenses USING btree (expense_date);
CREATE INDEX idx_site_budget_expenses_site_budget_id ON public.site_budget_expenses USING btree (site_budget_id);
CREATE INDEX idx_site_budgets_company_id ON public.site_budgets USING btree (company_id);
CREATE INDEX idx_site_budgets_deleted_at ON public.site_budgets USING btree (deleted_at);
CREATE INDEX idx_site_budgets_site_id ON public.site_budgets USING btree (site_id);
CREATE UNIQUE INDEX site_budgets_site_id_key ON public.site_budgets USING btree (site_id);
CREATE INDEX idx_site_media_deleted_at ON public.site_media USING btree (deleted_at);
CREATE INDEX idx_site_media_site_id ON public.site_media USING btree (site_id);
CREATE INDEX idx_site_media_uploaded_by ON public.site_media USING btree (uploaded_by);
CREATE INDEX idx_site_memos_created_by ON public.site_memos USING btree (created_by);
CREATE INDEX idx_site_memos_deleted_at ON public.site_memos USING btree (deleted_at);
CREATE INDEX idx_site_memos_site_id ON public.site_memos USING btree (site_id);
CREATE INDEX idx_site_zones_deleted_at ON public.site_zones USING btree (deleted_at);
CREATE INDEX idx_site_zones_site_id ON public.site_zones USING btree (site_id);
CREATE INDEX idx_sites_company_id ON public.sites USING btree (company_id);
CREATE INDEX idx_sites_deleted_at ON public.sites USING btree (deleted_at);
CREATE INDEX idx_stock_adjustments_adjusted_by ON public.stock_adjustments USING btree (adjusted_by);
CREATE INDEX idx_stock_adjustments_material_id ON public.stock_adjustments USING btree (material_id);
CREATE INDEX idx_subcontractor_contracts_company_id ON public.subcontractor_contracts USING btree (company_id);
CREATE INDEX idx_subcontractor_contracts_contract_number ON public.subcontractor_contracts USING btree (contract_number);
CREATE INDEX idx_subcontractor_contracts_deleted_at ON public.subcontractor_contracts USING btree (deleted_at);
CREATE INDEX idx_subcontractor_contracts_job_id ON public.subcontractor_contracts USING btree (job_id);
CREATE INDEX idx_subcontractor_contracts_status ON public.subcontractor_contracts USING btree (status);
CREATE INDEX idx_subcontractor_contracts_subcontractor_id ON public.subcontractor_contracts USING btree (subcontractor_id);
CREATE INDEX idx_subcontractors_company_id ON public.subcontractors USING btree (company_id);
CREATE INDEX idx_subcontractors_deleted_at ON public.subcontractors USING btree (deleted_at);
CREATE INDEX idx_subcontractors_is_active ON public.subcontractors USING btree (is_active);
CREATE INDEX idx_subcontractors_name ON public.subcontractors USING btree (name);
CREATE INDEX idx_subcontractors_trade ON public.subcontractors USING btree (trade);
CREATE UNIQUE INDEX system_settings_setting_key_key ON public.system_settings USING btree (setting_key);
CREATE INDEX idx_team_members_deleted_at ON public.team_members USING btree (deleted_at);
CREATE INDEX idx_team_members_team_id ON public.team_members USING btree (team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members USING btree (user_id);
CREATE UNIQUE INDEX team_members_team_id_user_id_key ON public.team_members USING btree (team_id, user_id);
CREATE INDEX idx_teams_company_id ON public.teams USING btree (company_id);
CREATE INDEX idx_teams_deleted_at ON public.teams USING btree (deleted_at);
CREATE INDEX idx_time_entries_clock_in ON public.time_entries USING btree (clock_in);
CREATE INDEX idx_time_entries_clock_out ON public.time_entries USING btree (clock_out);
CREATE INDEX idx_time_entries_job_id ON public.time_entries USING btree (job_id);
CREATE INDEX idx_time_entries_user_id ON public.time_entries USING btree (user_id);
CREATE INDEX idx_users_company_id ON public.users USING btree (company_id);
CREATE INDEX idx_users_deleted_at ON public.users USING btree (deleted_at);
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE INDEX idx_users_hourly_rate ON public.users USING btree (hourly_rate) WHERE ((hourly_rate IS NOT NULL) AND (deleted_at IS NULL));
CREATE INDEX idx_users_is_active ON public.users USING btree (is_active);
CREATE INDEX idx_users_role ON public.users USING btree (role);
CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);
CREATE INDEX idx_worker_locations_recorded_at ON public.worker_locations USING btree (recorded_at);
CREATE INDEX idx_worker_locations_user_id ON public.worker_locations USING btree (user_id);

-- ============================================
-- COLUMN COMMENTS
-- ============================================

COMMENT ON COLUMN check_in_logs.user_id IS 'Worker who checked in';
COMMENT ON COLUMN check_in_logs.job_id IS 'Job the worker checked in for';
COMMENT ON COLUMN check_in_logs.check_in_time IS 'When the worker checked in';
COMMENT ON COLUMN check_in_logs.check_out_time IS 'When the worker checked out (NULL if still checked in)';
COMMENT ON COLUMN check_in_logs.duration_hours IS 'Calculated hours worked (check_out_time - check_in_time)';
COMMENT ON COLUMN check_in_logs.hourly_rate IS 'Worker hourly rate at time of check-in';
COMMENT ON COLUMN check_in_logs.billable_amount IS 'Calculated billable amount (duration_hours * hourly_rate)';
COMMENT ON COLUMN users.hourly_rate IS 'Default hourly billing rate for worker check-ins (can be null)';

