// Variations types

export interface JobVariation {
  id: string;
  jobId?: string;
  contractId?: string;
  createdBy?: string;
  variationNumber?: string;
  title?: string;
  description?: string;
  amount?: number;
  status?: string;
  priority?: string;
  assignedTo?: string;
  pricingModel?: string;
  subcontractorAmount?: number;
  laborCost?: number;
  materialsClientCharge?: number;
  materialsActualCost?: number;
  isChargeable?: boolean;
  requiresSubcontractor?: boolean;
  clientApprovalRequired?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  // Joined fields
  jobName?: string;
  jobAddress?: string;
  contractTitle?: string;
  subcontractorName?: string;
  createdByName?: string;
  assignedToName?: string;
}

export interface CreateVariationDTO {
  jobId?: string;
  contractId?: string;
  variationNumber?: string;
  title?: string;
  description?: string;
  amount?: number;
  status?: string;
  priority?: string;
  assignedTo?: string;
  pricingModel?: string;
  subcontractorAmount?: number;
  laborCost?: number;
  materialsClientCharge?: number;
  materialsActualCost?: number;
  isChargeable?: boolean;
  requiresSubcontractor?: boolean;
  clientApprovalRequired?: boolean;
}

export interface UpdateVariationDTO {
  variationNumber?: string;
  title?: string;
  description?: string;
  amount?: number;
  status?: string;
  priority?: string;
  assignedTo?: string;
  pricingModel?: string;
  subcontractorAmount?: number;
  laborCost?: number;
  materialsClientCharge?: number;
  materialsActualCost?: number;
  isChargeable?: boolean;
  requiresSubcontractor?: boolean;
  clientApprovalRequired?: boolean;
}








