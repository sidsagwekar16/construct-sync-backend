// Variations repository
import { db } from '../../db/connection';
import { JobVariation, CreateVariationDTO, UpdateVariationDTO } from './variations.types';

export class VariationsRepository {
  async findAll(userId: string): Promise<JobVariation[]> {
    const query = `
      SELECT 
        jv.*,
        j.name as "jobName",
        s.address as "jobAddress",
        sc.title as "contractTitle",
        sub.name as "subcontractorName",
        CONCAT(u.first_name, ' ', u.last_name) as "createdByName",
        CONCAT(assigned_user.first_name, ' ', assigned_user.last_name) as "assignedToName"
      FROM job_variations jv
      LEFT JOIN jobs j ON jv.job_id = j.id
      LEFT JOIN sites s ON j.site_id = s.id
      LEFT JOIN subcontractor_contracts sc ON jv.contract_id = sc.id
      LEFT JOIN subcontractors sub ON sc.subcontractor_id = sub.id
      LEFT JOIN users u ON jv.created_by = u.id
      LEFT JOIN users assigned_user ON jv.assigned_to = assigned_user.id
      WHERE jv.deleted_at IS NULL
        AND (
          j.company_id = (SELECT company_id FROM users WHERE id = $1)
          OR sc.company_id = (SELECT company_id FROM users WHERE id = $1)
        )
      ORDER BY jv.created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  async findById(id: string, userId: string): Promise<JobVariation | null> {
    const query = `
      SELECT 
        jv.*,
        j.name as "jobName",
        s.address as "jobAddress",
        sc.title as "contractTitle",
        sub.name as "subcontractorName",
        CONCAT(u.first_name, ' ', u.last_name) as "createdByName",
        CONCAT(assigned_user.first_name, ' ', assigned_user.last_name) as "assignedToName"
      FROM job_variations jv
      LEFT JOIN jobs j ON jv.job_id = j.id
      LEFT JOIN sites s ON j.site_id = s.id
      LEFT JOIN subcontractor_contracts sc ON jv.contract_id = sc.id
      LEFT JOIN subcontractors sub ON sc.subcontractor_id = sub.id
      LEFT JOIN users u ON jv.created_by = u.id
      LEFT JOIN users assigned_user ON jv.assigned_to = assigned_user.id
      WHERE jv.id = $1 
        AND jv.deleted_at IS NULL
        AND (
          j.company_id = (SELECT company_id FROM users WHERE id = $2)
          OR sc.company_id = (SELECT company_id FROM users WHERE id = $2)
        )
    `;
    const result = await db.query(query, [id, userId]);
    return result.rows[0] || null;
  }

  async create(data: CreateVariationDTO, userId: string): Promise<JobVariation> {
    const query = `
      INSERT INTO job_variations (
        job_id, contract_id, created_by, variation_number, title, description, 
        amount, status, priority, assigned_to, pricing_model,
        subcontractor_amount, labor_cost, materials_client_charge, materials_actual_cost,
        is_chargeable, requires_subcontractor, client_approval_required
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;
    const result = await db.query(query, [
      data.jobId || null,
      data.contractId || null,
      userId,
      data.variationNumber,
      data.title,
      data.description,
      data.amount,
      data.status || 'draft',
      data.priority || 'medium',
      data.assignedTo || null,
      data.pricingModel,
      data.subcontractorAmount,
      data.laborCost,
      data.materialsClientCharge,
      data.materialsActualCost,
      data.isChargeable !== undefined ? data.isChargeable : true,
      data.requiresSubcontractor || false,
      data.clientApprovalRequired || false
    ]);
    return result.rows[0];
  }

  async update(id: string, data: UpdateVariationDTO, userId: string): Promise<JobVariation | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.variationNumber !== undefined) {
      fields.push(`variation_number = $${paramCount++}`);
      values.push(data.variationNumber);
    }
    if (data.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.amount !== undefined) {
      fields.push(`amount = $${paramCount++}`);
      values.push(data.amount);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    if (data.priority !== undefined) {
      fields.push(`priority = $${paramCount++}`);
      values.push(data.priority);
    }
    if (data.assignedTo !== undefined) {
      fields.push(`assigned_to = $${paramCount++}`);
      values.push(data.assignedTo);
    }
    if (data.pricingModel !== undefined) {
      fields.push(`pricing_model = $${paramCount++}`);
      values.push(data.pricingModel);
    }
    if (data.subcontractorAmount !== undefined) {
      fields.push(`subcontractor_amount = $${paramCount++}`);
      values.push(data.subcontractorAmount);
    }
    if (data.laborCost !== undefined) {
      fields.push(`labor_cost = $${paramCount++}`);
      values.push(data.laborCost);
    }
    if (data.materialsClientCharge !== undefined) {
      fields.push(`materials_client_charge = $${paramCount++}`);
      values.push(data.materialsClientCharge);
    }
    if (data.materialsActualCost !== undefined) {
      fields.push(`materials_actual_cost = $${paramCount++}`);
      values.push(data.materialsActualCost);
    }
    if (data.isChargeable !== undefined) {
      fields.push(`is_chargeable = $${paramCount++}`);
      values.push(data.isChargeable);
    }
    if (data.requiresSubcontractor !== undefined) {
      fields.push(`requires_subcontractor = $${paramCount++}`);
      values.push(data.requiresSubcontractor);
    }
    if (data.clientApprovalRequired !== undefined) {
      fields.push(`client_approval_required = $${paramCount++}`);
      values.push(data.clientApprovalRequired);
    }

    if (fields.length === 0) {
      return this.findById(id, userId);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, userId);

    const query = `
      UPDATE job_variations jv
      SET ${fields.join(', ')}
      WHERE jv.id = $${paramCount++}
        AND jv.deleted_at IS NULL
        AND (
          (
            jv.job_id IS NOT NULL AND
            (SELECT company_id FROM jobs j WHERE j.id = jv.job_id) = (SELECT company_id FROM users WHERE id = $${paramCount++})
          )
          OR
          (
            jv.contract_id IS NOT NULL AND
            (SELECT company_id FROM subcontractor_contracts sc WHERE sc.id = jv.contract_id) = (SELECT company_id FROM users WHERE id = $${paramCount++})
          )
        )
      RETURNING jv.*
    `;
    values.push(userId); // Add third userId for contract ownership check
    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE job_variations jv
      SET deleted_at = CURRENT_TIMESTAMP
      FROM jobs j, subcontractor_contracts sc
      WHERE jv.id = $1
        AND (
          (jv.job_id = j.id AND j.company_id = (SELECT company_id FROM users WHERE id = $2))
          OR (jv.contract_id = sc.id AND sc.company_id = (SELECT company_id FROM users WHERE id = $2))
        )
        AND jv.deleted_at IS NULL
    `;
    const result = await db.query(query, [id, userId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}








