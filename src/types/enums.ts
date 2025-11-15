// Database ENUM types matching schema

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  COMPANY_ADMIN = 'company_admin',
  PROJECT_MANAGER = 'project_manager',
  SITE_SUPERVISOR = 'site_supervisor',
  FOREMAN = 'foreman',
  WORKER = 'worker',
  SUBCONTRACTOR = 'subcontractor',
  VIEWER = 'viewer',
}

export enum TeamMemberRole {
  LEAD = 'lead',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export enum SiteStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum MediaType {
  PHOTO = 'photo',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
}

export enum JobStatus {
  DRAFT = 'draft',
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived',
}

export enum JobUnitStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked',
}

export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

export enum IssueStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REOPENED = 'reopened',
}

export enum VariationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELAYED = 'delayed',
  CANCELLED = 'cancelled',
}

export enum MaterialRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ORDERED = 'ordered',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

export enum AdjustmentType {
  ADDITION = 'addition',
  REMOVAL = 'removal',
  CORRECTION = 'correction',
  DAMAGE = 'damage',
  LOSS = 'loss',
  RETURN = 'return',
}

export enum ContractStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  TERMINATED = 'terminated',
  EXPIRED = 'expired',
}

export enum PaymentMethod {
  CASH = 'cash',
  CHECK = 'check',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  EFT = 'eft',
  OTHER = 'other',
}

export enum TransactionType {
  EXPENSE = 'expense',
  PURCHASE = 'purchase',
  PAYMENT = 'payment',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
}

export enum RevenueType {
  CONTRACT_PAYMENT = 'contract_payment',
  VARIATION = 'variation',
  RETENTION_RELEASE = 'retention_release',
  BONUS = 'bonus',
  OTHER = 'other',
}

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  TASK_OVERDUE = 'task_overdue',
  JOB_UPDATED = 'job_updated',
  MATERIAL_REQUESTED = 'material_requested',
  MATERIAL_LOW_STOCK = 'material_low_stock',
  SAFETY_INCIDENT = 'safety_incident',
  INSPECTION_DUE = 'inspection_due',
  PAYMENT_RECEIVED = 'payment_received',
  DOCUMENT_UPLOADED = 'document_uploaded',
  MENTION = 'mention',
  SYSTEM = 'system',
}

export enum SeverityLevel {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  CRITICAL = 'critical',
  FATAL = 'fatal',
}

export enum SafetyStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum InspectionType {
  ROUTINE = 'routine',
  SAFETY = 'safety',
  QUALITY = 'quality',
  COMPLIANCE = 'compliance',
  FINAL = 'final',
  PRE_START = 'pre_start',
}

export enum InspectionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PASSED = 'passed',
}

export enum HazardType {
  SLIP_TRIP_FALL = 'slip_trip_fall',
  ELECTRICAL = 'electrical',
  CHEMICAL = 'chemical',
  FIRE = 'fire',
  EQUIPMENT = 'equipment',
  STRUCTURAL = 'structural',
  ENVIRONMENTAL = 'environmental',
  ERGONOMIC = 'ergonomic',
  OTHER = 'other',
}

export enum PlatformType {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
  WINDOWS = 'windows',
  MACOS = 'macos',
}

export enum SenderType {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
}

export enum DocumentType {
  BLUEPRINT = 'blueprint',
  SPECIFICATION = 'specification',
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  PERMIT = 'permit',
  INSPECTION_REPORT = 'inspection_report',
  SAFETY_REPORT = 'safety_report',
  PHOTO = 'photo',
  VIDEO = 'video',
  OTHER = 'other',
}
