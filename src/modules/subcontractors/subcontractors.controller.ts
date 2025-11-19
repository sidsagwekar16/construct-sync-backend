// Subcontractors controller - Request handlers

import { Request, Response, NextFunction } from 'express';
import { SubcontractorsService } from './subcontractors.service';
import { successResponse } from '../../utils/response';
import {
  CreateSubcontractorRequest,
  UpdateSubcontractorRequest,
  ListSubcontractorsQuery,
  CreateContractRequest,
  UpdateContractRequest,
  ListContractsQuery,
  CreatePaymentRequest,
} from './subcontractors.types';
import { ContractStatus } from '../../types/enums';

export class SubcontractorsController {
  private service: SubcontractorsService;

  constructor() {
    this.service = new SubcontractorsService();
  }

  // ============================================
  // SUBCONTRACTORS ENDPOINTS
  // ============================================

  /**
   * GET /api/subcontractors
   * List all subcontractors for the authenticated user's company
   */
  listSubcontractors = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const query: ListSubcontractorsQuery = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        search: req.query.search as string,
        trade: req.query.trade as string,
        isActive: req.query.isActive
          ? req.query.isActive === 'true'
          : undefined,
      };

      const result = await this.service.listSubcontractors(companyId, query);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/subcontractors/:id
   * Get a single subcontractor by ID
   */
  getSubcontractorById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const subcontractorId = req.params.id;
      const companyId = req.user!.companyId;

      const subcontractor = await this.service.getSubcontractorById(
        subcontractorId,
        companyId
      );
      successResponse(res, subcontractor);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/subcontractors/:id/stats
   * Get a subcontractor with statistics
   */
  getSubcontractorWithStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const subcontractorId = req.params.id;
      const companyId = req.user!.companyId;

      const subcontractor = await this.service.getSubcontractorWithStats(
        subcontractorId,
        companyId
      );
      successResponse(res, subcontractor);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/subcontractors
   * Create a new subcontractor
   */
  createSubcontractor = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const data: CreateSubcontractorRequest = req.body;

      const subcontractor = await this.service.createSubcontractor(companyId, data);
      successResponse(res, subcontractor, 'Subcontractor created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/subcontractors/:id
   * Update a subcontractor
   */
  updateSubcontractor = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const subcontractorId = req.params.id;
      const companyId = req.user!.companyId;
      const data: UpdateSubcontractorRequest = req.body;

      const subcontractor = await this.service.updateSubcontractor(
        subcontractorId,
        companyId,
        data
      );
      successResponse(res, subcontractor, 'Subcontractor updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/subcontractors/:id
   * Delete a subcontractor (soft delete)
   */
  deleteSubcontractor = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const subcontractorId = req.params.id;
      const companyId = req.user!.companyId;

      await this.service.deleteSubcontractor(subcontractorId, companyId);
      successResponse(res, null, 'Subcontractor deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // CONTRACTS ENDPOINTS
  // ============================================

  /**
   * GET /api/subcontractors/contracts
   * List all contracts for the authenticated user's company
   */
  listContracts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const query: ListContractsQuery = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        search: req.query.search as string,
        subcontractorId: req.query.subcontractorId as string,
        jobId: req.query.jobId as string,
        status: req.query.status as ContractStatus,
      };

      const result = await this.service.listContracts(companyId, query);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/subcontractors/contracts/:id
   * Get a single contract by ID
   */
  getContractById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const contractId = req.params.id;
      const companyId = req.user!.companyId;

      const contract = await this.service.getContractById(contractId, companyId);
      successResponse(res, contract);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/subcontractors/contracts/:id/with-payments
   * Get a contract with payment details
   */
  getContractWithPayments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const contractId = req.params.id;
      const companyId = req.user!.companyId;

      const contract = await this.service.getContractWithPayments(contractId, companyId);
      successResponse(res, contract);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/subcontractors/contracts
   * Create a new contract
   */
  createContract = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const data: CreateContractRequest = req.body;

      const contract = await this.service.createContract(companyId, data);
      successResponse(res, contract, 'Contract created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/subcontractors/contracts/:id
   * Update a contract
   */
  updateContract = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const contractId = req.params.id;
      const companyId = req.user!.companyId;
      const data: UpdateContractRequest = req.body;

      const contract = await this.service.updateContract(contractId, companyId, data);
      successResponse(res, contract, 'Contract updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/subcontractors/contracts/:id
   * Delete a contract (soft delete)
   */
  deleteContract = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const contractId = req.params.id;
      const companyId = req.user!.companyId;

      await this.service.deleteContract(contractId, companyId);
      successResponse(res, null, 'Contract deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // PAYMENTS ENDPOINTS
  // ============================================

  /**
   * GET /api/subcontractors/contracts/:contractId/payments
   * Get all payments for a contract
   */
  getPaymentsByContract = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const contractId = req.params.contractId;
      const companyId = req.user!.companyId;

      const payments = await this.service.getPaymentsByContract(contractId, companyId);
      successResponse(res, payments);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/subcontractors/contracts/:contractId/payments
   * Create a payment for a contract
   */
  createPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const contractId = req.params.contractId;
      const companyId = req.user!.companyId;
      const data: CreatePaymentRequest = req.body;

      const payment = await this.service.createPayment(contractId, companyId, data);
      successResponse(res, payment, 'Payment created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/subcontractors/contracts/:contractId/payments/:paymentId
   * Delete a payment
   */
  deletePayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { contractId, paymentId } = req.params;
      const companyId = req.user!.companyId;

      await this.service.deletePayment(contractId, paymentId, companyId);
      successResponse(res, null, 'Payment deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
