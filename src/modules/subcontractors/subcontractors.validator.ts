// Subcontractors validator - Zod schemas for request validation

import { z } from 'zod';
import { ContractStatus } from '../../types/enums';

/**
 * Schema for creating a subcontractor
 */
export const createSubcontractorSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    businessName: z.string().max(255).optional(),
    abn: z.string().max(50).optional(),
    email: z.string().email().max(255).optional().or(z.literal('')),
    phone: z.string().max(50).optional(),
    address: z.string().optional(),
    trade: z.string().max(100).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional().default(true),
  }),
});

/**
 * Schema for updating a subcontractor
 */
export const updateSubcontractorSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    businessName: z.string().max(255).optional(),
    abn: z.string().max(50).optional(),
    email: z.string().email().max(255).optional().or(z.literal('')),
    phone: z.string().max(50).optional(),
    address: z.string().optional(),
    trade: z.string().max(100).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

/**
 * Schema for listing subcontractors
 */
export const listSubcontractorsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().optional(),
    trade: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
  }),
});

/**
 * Schema for subcontractor ID parameter
 */
export const subcontractorIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

/**
 * Schema for creating a contract
 */
export const createContractSchema = z.object({
  body: z.object({
    subcontractorId: z.string().uuid(),
    jobId: z.string().uuid().optional(),
    contractNumber: z.string().max(100).optional(),
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    contractValue: z.number().nonnegative().optional(),
    startDate: z.string().datetime().or(z.string().date()).optional(),
    endDate: z.string().datetime().or(z.string().date()).optional(),
    status: z.nativeEnum(ContractStatus).optional(),
    paymentTerms: z.string().optional(),
    notes: z.string().optional(),
  }),
});

/**
 * Schema for updating a contract
 */
export const updateContractSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    jobId: z.string().uuid().optional(),
    contractNumber: z.string().max(100).optional(),
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    contractValue: z.number().nonnegative().optional(),
    startDate: z.string().datetime().or(z.string().date()).optional(),
    endDate: z.string().datetime().or(z.string().date()).optional(),
    completionDate: z.string().datetime().or(z.string().date()).optional(),
    status: z.nativeEnum(ContractStatus).optional(),
    progressPercentage: z.number().min(0).max(100).optional(),
    paymentTerms: z.string().optional(),
    notes: z.string().optional(),
  }),
});

/**
 * Schema for listing contracts
 */
export const listContractsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().optional(),
    subcontractorId: z.string().uuid().optional(),
    jobId: z.string().uuid().optional(),
    status: z.nativeEnum(ContractStatus).optional(),
  }),
});

/**
 * Schema for contract ID parameter
 */
export const contractIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

/**
 * Schema for creating a payment
 */
export const createPaymentSchema = z.object({
  params: z.object({
    contractId: z.string().uuid(),
  }),
  body: z.object({
    amount: z.number().positive(),
    paymentDate: z.string().datetime().or(z.string().date()).optional(),
    paymentMethod: z.string().max(50).optional(),
    referenceNumber: z.string().max(255).optional(),
    notes: z.string().optional(),
  }),
});

/**
 * Schema for payment ID parameter
 */
export const paymentIdSchema = z.object({
  params: z.object({
    contractId: z.string().uuid(),
    paymentId: z.string().uuid(),
  }),
});
