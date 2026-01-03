// Variations validator
import Joi from 'joi';

export const createVariationSchema = Joi.object({
  jobId: Joi.string().uuid().optional(),
  contractId: Joi.string().uuid().optional(),
  variationNumber: Joi.string().max(100).optional(),
  title: Joi.string().max(255).optional(),
  description: Joi.string().optional(),
  amount: Joi.number().min(0).optional(),
  status: Joi.string().valid('draft', 'submitted', 'approved', 'rejected', 'completed').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  assignedTo: Joi.string().uuid().optional(),
  pricingModel: Joi.string().max(100).optional(),
  subcontractorAmount: Joi.number().min(0).optional(),
  laborCost: Joi.number().min(0).optional(),
  materialsClientCharge: Joi.number().min(0).optional(),
  materialsActualCost: Joi.number().min(0).optional(),
  isChargeable: Joi.boolean().optional(),
  requiresSubcontractor: Joi.boolean().optional(),
  clientApprovalRequired: Joi.boolean().optional()
}).or('jobId', 'contractId'); // At least one must be provided

export const updateVariationSchema = Joi.object({
  variationNumber: Joi.string().max(100).optional(),
  title: Joi.string().max(255).optional(),
  description: Joi.string().optional(),
  amount: Joi.number().min(0).optional(),
  status: Joi.string().valid('draft', 'submitted', 'approved', 'rejected', 'completed').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  assignedTo: Joi.string().uuid().optional(),
  pricingModel: Joi.string().max(100).optional(),
  subcontractorAmount: Joi.number().min(0).optional(),
  laborCost: Joi.number().min(0).optional(),
  materialsClientCharge: Joi.number().min(0).optional(),
  materialsActualCost: Joi.number().min(0).optional(),
  isChargeable: Joi.boolean().optional(),
  requiresSubcontractor: Joi.boolean().optional(),
  clientApprovalRequired: Joi.boolean().optional()
}).min(1);








