// Subcontractors service - Business logic

import { SubcontractorsRepository } from './subcontractors.repository';
import {
  CreateSubcontractorRequest,
  UpdateSubcontractorRequest,
  SubcontractorResponse,
  ListSubcontractorsQuery,
  SubcontractorWithStats,
  CreateContractRequest,
  UpdateContractRequest,
  ContractResponse,
  ListContractsQuery,
  ContractWithPayments,
  CreatePaymentRequest,
  PaymentResponse,
  Subcontractor,
  SubcontractorContract,
  ContractPayment,
} from './subcontractors.types';
import { NotFoundError, BadRequestError } from '../../types/errors';
import { logger } from '../../utils/logger';

export class SubcontractorsService {
  private repository: SubcontractorsRepository;

  constructor() {
    this.repository = new SubcontractorsRepository();
  }

  // ============================================
  // SUBCONTRACTORS
  // ============================================

  /**
   * List all subcontractors for a company
   */
  async listSubcontractors(
    companyId: string,
    query: ListSubcontractorsQuery
  ): Promise<{
    subcontractors: SubcontractorResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    const { subcontractors, total } = await this.repository.findSubcontractorsByCompany(
      companyId,
      query.search,
      query.trade,
      query.isActive,
      limit,
      offset
    );

    const responses = subcontractors.map(this.mapSubcontractorToResponse);

    return {
      subcontractors: responses,
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single subcontractor by ID
   */
  async getSubcontractorById(
    subcontractorId: string,
    companyId: string
  ): Promise<SubcontractorResponse> {
    const subcontractor = await this.repository.findSubcontractorById(
      subcontractorId,
      companyId
    );

    if (!subcontractor) {
      throw new NotFoundError('Subcontractor not found');
    }

    return this.mapSubcontractorToResponse(subcontractor);
  }

  /**
   * Get a subcontractor with statistics
   */
  async getSubcontractorWithStats(
    subcontractorId: string,
    companyId: string
  ): Promise<SubcontractorWithStats> {
    const subcontractor = await this.repository.findSubcontractorById(
      subcontractorId,
      companyId
    );

    if (!subcontractor) {
      throw new NotFoundError('Subcontractor not found');
    }

    const stats = await this.repository.getSubcontractorStats(subcontractorId, companyId);

    return {
      ...this.mapSubcontractorToResponse(subcontractor),
      activeContractsCount: stats.activeContractsCount,
      totalContractValue: stats.totalContractValue,
    };
  }

  /**
   * Create a new subcontractor
   */
  async createSubcontractor(
    companyId: string,
    data: CreateSubcontractorRequest
  ): Promise<SubcontractorResponse> {
    const subcontractor = await this.repository.createSubcontractor(
      companyId,
      data.name,
      data.businessName,
      data.abn,
      data.email,
      data.phone,
      data.address,
      data.trade,
      data.description,
      data.isActive
    );

    logger.info(
      `Subcontractor created: ${subcontractor.name} (${subcontractor.id}) for company ${companyId}`
    );

    return this.mapSubcontractorToResponse(subcontractor);
  }

  /**
   * Update a subcontractor
   */
  async updateSubcontractor(
    subcontractorId: string,
    companyId: string,
    data: UpdateSubcontractorRequest
  ): Promise<SubcontractorResponse> {
    const subcontractor = await this.repository.updateSubcontractor(
      subcontractorId,
      companyId,
      data
    );

    if (!subcontractor) {
      throw new NotFoundError('Subcontractor not found');
    }

    logger.info(`Subcontractor updated: ${subcontractor.id}`);

    return this.mapSubcontractorToResponse(subcontractor);
  }

  /**
   * Delete a subcontractor (soft delete)
   */
  async deleteSubcontractor(subcontractorId: string, companyId: string): Promise<void> {
    // Check if subcontractor has active contracts
    const { contracts } = await this.repository.findContracts(
      companyId,
      undefined,
      subcontractorId,
      undefined,
      undefined,
      1,
      0
    );

    const hasActiveContracts = contracts.some(
      (c) => c.status !== 'completed' && c.status !== 'terminated'
    );

    if (hasActiveContracts) {
      throw new BadRequestError(
        'Cannot delete subcontractor with active contracts. Please complete or terminate all contracts first.'
      );
    }

    const deleted = await this.repository.deleteSubcontractor(subcontractorId, companyId);

    if (!deleted) {
      throw new NotFoundError('Subcontractor not found');
    }

    logger.info(`Subcontractor deleted: ${subcontractorId}`);
  }

  // ============================================
  // CONTRACTS
  // ============================================

  /**
   * List all contracts for a company
   */
  async listContracts(
    companyId: string,
    query: ListContractsQuery
  ): Promise<{
    contracts: ContractResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    const { contracts, total } = await this.repository.findContracts(
      companyId,
      query.search,
      query.subcontractorId,
      query.jobId,
      query.status,
      limit,
      offset
    );

    // Get subcontractor and job names for each contract
    const responses = await Promise.all(
      contracts.map(async (contract) => {
        const details = await this.repository.findContractWithDetails(
          contract.id,
          companyId
        );
        return this.mapContractToResponse(contract, details);
      })
    );

    return {
      contracts: responses,
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single contract by ID
   */
  async getContractById(
    contractId: string,
    companyId: string
  ): Promise<ContractResponse> {
    const contract = await this.repository.findContractById(contractId, companyId);

    if (!contract) {
      throw new NotFoundError('Contract not found');
    }

    const details = await this.repository.findContractWithDetails(contractId, companyId);
    return this.mapContractToResponse(contract, details);
  }

  /**
   * Get a contract with payment details
   */
  async getContractWithPayments(
    contractId: string,
    companyId: string
  ): Promise<ContractWithPayments> {
    const contract = await this.repository.findContractById(contractId, companyId);

    if (!contract) {
      throw new NotFoundError('Contract not found');
    }

    const details = await this.repository.findContractWithDetails(contractId, companyId);
    const payments = await this.repository.findPaymentsByContract(contractId);
    const totalPaid = await this.repository.getTotalPaidForContract(contractId);
    const remainingBalance = (contract.contract_value || 0) - totalPaid;

    return {
      ...this.mapContractToResponse(contract, details),
      totalPaid,
      remainingBalance,
      payments: payments.map(this.mapPaymentToResponse),
    };
  }

  /**
   * Create a new contract
   */
  async createContract(
    companyId: string,
    data: CreateContractRequest
  ): Promise<ContractResponse> {
    // Verify subcontractor exists
    const subcontractor = await this.repository.findSubcontractorById(
      data.subcontractorId,
      companyId
    );

    if (!subcontractor) {
      throw new NotFoundError('Subcontractor not found');
    }

    const contract = await this.repository.createContract(
      companyId,
      data.subcontractorId,
      data.title,
      data.jobId,
      data.contractNumber,
      data.description,
      data.contractValue,
      data.startDate ? new Date(data.startDate) : undefined,
      data.endDate ? new Date(data.endDate) : undefined,
      data.status,
      data.paymentTerms,
      data.notes
    );

    logger.info(
      `Contract created: ${contract.title} (${contract.id}) for company ${companyId}`
    );

    const details = await this.repository.findContractWithDetails(contract.id, companyId);
    return this.mapContractToResponse(contract, details);
  }

  /**
   * Update a contract
   */
  async updateContract(
    contractId: string,
    companyId: string,
    data: UpdateContractRequest
  ): Promise<ContractResponse> {
    const updates: any = { ...data };

    // Convert date strings to Date objects
    if (data.startDate) updates.startDate = new Date(data.startDate);
    if (data.endDate) updates.endDate = new Date(data.endDate);
    if (data.completionDate) updates.completionDate = new Date(data.completionDate);

    const contract = await this.repository.updateContract(contractId, companyId, updates);

    if (!contract) {
      throw new NotFoundError('Contract not found');
    }

    logger.info(`Contract updated: ${contract.id}`);

    const details = await this.repository.findContractWithDetails(contractId, companyId);
    return this.mapContractToResponse(contract, details);
  }

  /**
   * Delete a contract (soft delete)
   */
  async deleteContract(contractId: string, companyId: string): Promise<void> {
    const deleted = await this.repository.deleteContract(contractId, companyId);

    if (!deleted) {
      throw new NotFoundError('Contract not found');
    }

    logger.info(`Contract deleted: ${contractId}`);
  }

  // ============================================
  // PAYMENTS
  // ============================================

  /**
   * Create a payment for a contract
   */
  async createPayment(
    contractId: string,
    companyId: string,
    data: CreatePaymentRequest
  ): Promise<PaymentResponse> {
    // Verify contract exists
    const contract = await this.repository.findContractById(contractId, companyId);

    if (!contract) {
      throw new NotFoundError('Contract not found');
    }

    // Verify payment doesn't exceed contract value
    if (contract.contract_value) {
      const totalPaid = await this.repository.getTotalPaidForContract(contractId);
      const newTotal = totalPaid + data.amount;

      if (newTotal > contract.contract_value) {
        throw new BadRequestError(
          `Payment amount exceeds remaining contract balance. Remaining: ${contract.contract_value - totalPaid}`
        );
      }
    }

    const payment = await this.repository.createPayment(
      contractId,
      data.amount,
      data.paymentDate ? new Date(data.paymentDate) : undefined,
      data.paymentMethod,
      data.referenceNumber,
      data.notes
    );

    logger.info(`Payment created: ${payment.id} for contract ${contractId}`);

    return this.mapPaymentToResponse(payment);
  }

  /**
   * Get all payments for a contract
   */
  async getPaymentsByContract(
    contractId: string,
    companyId: string
  ): Promise<PaymentResponse[]> {
    // Verify contract exists
    const contract = await this.repository.findContractById(contractId, companyId);

    if (!contract) {
      throw new NotFoundError('Contract not found');
    }

    const payments = await this.repository.findPaymentsByContract(contractId);
    return payments.map(this.mapPaymentToResponse);
  }

  /**
   * Delete a payment
   */
  async deletePayment(
    contractId: string,
    paymentId: string,
    companyId: string
  ): Promise<void> {
    // Verify contract exists and belongs to company
    const contract = await this.repository.findContractById(contractId, companyId);
    if (!contract) {
      throw new NotFoundError('Contract not found');
    }

    // Verify payment exists and belongs to contract
    const payment = await this.repository.findPaymentById(paymentId);
    if (!payment || payment.contract_id !== contractId) {
      throw new NotFoundError('Payment not found');
    }

    const deleted = await this.repository.deletePayment(paymentId);

    if (!deleted) {
      throw new NotFoundError('Payment not found');
    }

    logger.info(`Payment deleted: ${paymentId}`);
  }

  // ============================================
  // MAPPING HELPERS
  // ============================================

  private mapSubcontractorToResponse(
    subcontractor: Subcontractor
  ): SubcontractorResponse {
    return {
      id: subcontractor.id,
      companyId: subcontractor.company_id,
      name: subcontractor.name,
      businessName: subcontractor.business_name,
      abn: subcontractor.abn,
      email: subcontractor.email,
      phone: subcontractor.phone,
      address: subcontractor.address,
      trade: subcontractor.trade,
      description: subcontractor.description,
      isActive: subcontractor.is_active,
      createdAt: subcontractor.created_at,
      updatedAt: subcontractor.updated_at,
    };
  }

  private mapContractToResponse(
    contract: SubcontractorContract,
    details?: any
  ): ContractResponse {
    return {
      id: contract.id,
      companyId: contract.company_id,
      subcontractorId: contract.subcontractor_id,
      subcontractorName: details?.subcontractor_name,
      jobId: contract.job_id,
      jobName: details?.job_name,
      contractNumber: contract.contract_number,
      title: contract.title,
      description: contract.description,
      contractValue: contract.contract_value,
      startDate: contract.start_date ? contract.start_date.toISOString().split('T')[0] : null,
      endDate: contract.end_date ? contract.end_date.toISOString().split('T')[0] : null,
      completionDate: contract.completion_date
        ? contract.completion_date.toISOString().split('T')[0]
        : null,
      status: contract.status,
      progressPercentage: contract.progress_percentage,
      paymentTerms: contract.payment_terms,
      notes: contract.notes,
      createdAt: contract.created_at,
      updatedAt: contract.updated_at,
    };
  }

  private mapPaymentToResponse(payment: ContractPayment): PaymentResponse {
    return {
      id: payment.id,
      contractId: payment.contract_id,
      amount: payment.amount,
      paymentDate: payment.payment_date
        ? payment.payment_date.toISOString().split('T')[0]
        : null,
      paymentMethod: payment.payment_method,
      referenceNumber: payment.reference_number,
      notes: payment.notes,
      createdAt: payment.created_at,
    };
  }
}
