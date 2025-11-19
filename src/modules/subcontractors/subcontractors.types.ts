// Subcontractors module types

import { ContractStatus } from '../../types/enums';

/**
 * Database schema for subcontractors table
 */
export interface Subcontractor {
  id: string;
  company_id: string;
  name: string;
  business_name: string | null;
  abn: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  trade: string | null;
  description: string | null;
  is_active: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Database schema for subcontractor_contracts table
 */
export interface SubcontractorContract {
  id: string;
  company_id: string;
  subcontractor_id: string;
  job_id: string | null;
  contract_number: string | null;
  title: string;
  description: string | null;
  contract_value: number | null;
  start_date: Date | null;
  end_date: Date | null;
  completion_date: Date | null;
  status: ContractStatus;
  progress_percentage: number;
  payment_terms: string | null;
  notes: string | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Database schema for contract_payments table
 */
export interface ContractPayment {
  id: string;
  contract_id: string;
  amount: number;
  payment_date: Date | null;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: Date;
}

/**
 * Request body for creating a subcontractor
 */
export interface CreateSubcontractorRequest {
  name: string;
  businessName?: string;
  abn?: string;
  email?: string;
  phone?: string;
  address?: string;
  trade?: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Request body for updating a subcontractor
 */
export interface UpdateSubcontractorRequest {
  name?: string;
  businessName?: string;
  abn?: string;
  email?: string;
  phone?: string;
  address?: string;
  trade?: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Response object for subcontractor
 */
export interface SubcontractorResponse {
  id: string;
  companyId: string;
  name: string;
  businessName: string | null;
  abn: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  trade: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Query parameters for listing subcontractors
 */
export interface ListSubcontractorsQuery {
  page?: number;
  limit?: number;
  search?: string;
  trade?: string;
  isActive?: boolean;
}

/**
 * Request body for creating a contract
 */
export interface CreateContractRequest {
  subcontractorId: string;
  jobId?: string;
  contractNumber?: string;
  title: string;
  description?: string;
  contractValue?: number;
  startDate?: string;
  endDate?: string;
  status?: ContractStatus;
  paymentTerms?: string;
  notes?: string;
}

/**
 * Request body for updating a contract
 */
export interface UpdateContractRequest {
  jobId?: string;
  contractNumber?: string;
  title?: string;
  description?: string;
  contractValue?: number;
  startDate?: string;
  endDate?: string;
  completionDate?: string;
  status?: ContractStatus;
  progressPercentage?: number;
  paymentTerms?: string;
  notes?: string;
}

/**
 * Response object for contract
 */
export interface ContractResponse {
  id: string;
  companyId: string;
  subcontractorId: string;
  subcontractorName?: string;
  jobId: string | null;
  jobName?: string | null;
  contractNumber: string | null;
  title: string;
  description: string | null;
  contractValue: number | null;
  startDate: string | null;
  endDate: string | null;
  completionDate: string | null;
  status: ContractStatus;
  progressPercentage: number;
  paymentTerms: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Query parameters for listing contracts
 */
export interface ListContractsQuery {
  page?: number;
  limit?: number;
  search?: string;
  subcontractorId?: string;
  jobId?: string;
  status?: ContractStatus;
}

/**
 * Request body for creating a payment
 */
export interface CreatePaymentRequest {
  amount: number;
  paymentDate?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
}

/**
 * Response object for payment
 */
export interface PaymentResponse {
  id: string;
  contractId: string;
  amount: number;
  paymentDate: string | null;
  paymentMethod: string | null;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: Date;
}

/**
 * Subcontractor with contract count
 */
export interface SubcontractorWithStats extends SubcontractorResponse {
  activeContractsCount: number;
  totalContractValue: number;
}

/**
 * Contract with payment summary
 */
export interface ContractWithPayments extends ContractResponse {
  totalPaid: number;
  remainingBalance: number;
  payments?: PaymentResponse[];
}
