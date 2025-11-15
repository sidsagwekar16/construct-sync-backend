-- ============================================
-- POSTGRESQL ENUM DEFINITIONS
-- ============================================
-- Production-ready ENUM types for ConstructSync
-- Version: 1.0
-- ============================================

-- User Roles
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'company_admin',
  'project_manager',
  'site_supervisor',
  'foreman',
  'worker',
  'subcontractor',
  'viewer'
);

-- Team Member Roles
CREATE TYPE team_member_role AS ENUM (
  'lead',
  'member',
  'viewer'
);

-- Site Status
CREATE TYPE site_status AS ENUM (
  'planning',
  'active',
  'on_hold',
  'completed',
  'archived'
);

-- Media Types
CREATE TYPE media_type AS ENUM (
  'photo',
  'video',
  'document',
  'audio'
);

-- Job Status
CREATE TYPE job_status AS ENUM (
  'draft',
  'planned',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
  'archived'
);

-- Job Unit Status
CREATE TYPE job_unit_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'on_hold'
);

-- Task Status
CREATE TYPE task_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'cancelled',
  'blocked'
);

-- Priority Levels
CREATE TYPE priority_level AS ENUM (
  'low',
  'medium',
  'high',
  'urgent',
  'critical'
);

-- Issue Status
CREATE TYPE issue_status AS ENUM (
  'open',
  'in_progress',
  'resolved',
  'closed',
  'reopened'
);

-- Variation Status
CREATE TYPE variation_status AS ENUM (
  'draft',
  'submitted',
  'approved',
  'rejected',
  'completed'
);

-- Milestone Status
CREATE TYPE milestone_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'delayed',
  'cancelled'
);

-- Material Request Status
CREATE TYPE material_request_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'ordered',
  'received',
  'cancelled'
);

-- Stock Adjustment Types
CREATE TYPE adjustment_type AS ENUM (
  'addition',
  'removal',
  'correction',
  'damage',
  'loss',
  'return'
);

-- Contract Status
CREATE TYPE contract_status AS ENUM (
  'draft',
  'active',
  'completed',
  'terminated',
  'expired'
);

-- Payment Methods
CREATE TYPE payment_method AS ENUM (
  'cash',
  'check',
  'bank_transfer',
  'credit_card',
  'eft',
  'other'
);

-- Transaction Types
CREATE TYPE transaction_type AS ENUM (
  'expense',
  'purchase',
  'payment',
  'refund',
  'adjustment'
);

-- Revenue Types
CREATE TYPE revenue_type AS ENUM (
  'contract_payment',
  'variation',
  'retention_release',
  'bonus',
  'other'
);

-- Notification Types
CREATE TYPE notification_type AS ENUM (
  'task_assigned',
  'task_completed',
  'task_overdue',
  'job_updated',
  'material_requested',
  'material_low_stock',
  'safety_incident',
  'inspection_due',
  'payment_received',
  'document_uploaded',
  'mention',
  'system'
);

-- Severity Levels
CREATE TYPE severity_level AS ENUM (
  'minor',
  'moderate',
  'major',
  'critical',
  'fatal'
);

-- Safety Status
CREATE TYPE safety_status AS ENUM (
  'open',
  'investigating',
  'resolved',
  'closed'
);

-- Inspection Types
CREATE TYPE inspection_type AS ENUM (
  'routine',
  'safety',
  'quality',
  'compliance',
  'final',
  'pre_start'
);

-- Inspection Status
CREATE TYPE inspection_status AS ENUM (
  'scheduled',
  'in_progress',
  'completed',
  'failed',
  'passed'
);

-- Hazard Types
CREATE TYPE hazard_type AS ENUM (
  'slip_trip_fall',
  'electrical',
  'chemical',
  'fire',
  'equipment',
  'structural',
  'environmental',
  'ergonomic',
  'other'
);

-- Platform Types (for device tokens)
CREATE TYPE platform_type AS ENUM (
  'ios',
  'android',
  'web',
  'windows',
  'macos'
);

-- Chat Sender Types
CREATE TYPE sender_type AS ENUM (
  'user',
  'ai',
  'system'
);

-- Document Types
CREATE TYPE document_type AS ENUM (
  'blueprint',
  'specification',
  'contract',
  'invoice',
  'permit',
  'inspection_report',
  'safety_report',
  'photo',
  'video',
  'other'
);

