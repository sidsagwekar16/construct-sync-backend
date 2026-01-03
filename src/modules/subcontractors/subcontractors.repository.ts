// Subcontractors repository - Database operations

import { db } from '../../db/connection';
import {
  Subcontractor,
  SubcontractorContract,
  ContractPayment,
} from './subcontractors.types';
import { ContractStatus } from '../../types/enums';

export class SubcontractorsRepository {
  // ============================================
  // SUBCONTRACTORS CRUD
  // ============================================

  /**
   * Find all subcontractors for a company with optional filters and pagination
   * Excludes soft-deleted subcontractors
   */
  async findSubcontractorsByCompany(
    companyId: string,
    search?: string,
    trade?: string,
    isActive?: boolean,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ subcontractors: Subcontractor[]; total: number }> {
    let query = `
      SELECT * FROM subcontractors 
      WHERE company_id = $1 AND deleted_at IS NULL
    `;
    const params: any[] = [companyId];
    let paramIndex = 2;

    // Add search filter
    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR business_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add trade filter
    if (trade) {
      query += ` AND trade = $${paramIndex}`;
      params.push(trade);
      paramIndex++;
    }

    // Add active filter
    if (isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    // Get total count
    const countParams = params.slice(0, paramIndex - 1);
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await db.query<{ count: string }>(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    // Add ordering and pagination
    query += ` ORDER BY created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query<Subcontractor>(query, params);
    return { subcontractors: result.rows, total };
  }

  /**
   * Find a subcontractor by ID
   */
  async findSubcontractorById(
    subcontractorId: string,
    companyId: string
  ): Promise<Subcontractor | null> {
    const query = `
      SELECT * FROM subcontractors 
      WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query<Subcontractor>(query, [subcontractorId, companyId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new subcontractor
   */
  async createSubcontractor(
    companyId: string,
    name: string,
    businessName?: string,
    abn?: string,
    email?: string,
    phone?: string,
    address?: string,
    trade?: string,
    description?: string,
    isActive: boolean = true
  ): Promise<Subcontractor> {
    const query = `
      INSERT INTO subcontractors (
        company_id, name, business_name, abn, email, phone, 
        address, trade, description, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const result = await db.query<Subcontractor>(query, [
      companyId,
      name,
      businessName || null,
      abn || null,
      email || null,
      phone || null,
      address || null,
      trade || null,
      description || null,
      isActive,
    ]);
    return result.rows[0];
  }

  /**
   * Update a subcontractor
   */
  async updateSubcontractor(
    subcontractorId: string,
    companyId: string,
    updates: {
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
  ): Promise<Subcontractor | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbColumn = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbColumn} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      // No updates, return existing
      return this.findSubcontractorById(subcontractorId, companyId);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(subcontractorId, companyId);

    const query = `
      UPDATE subcontractors 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await db.query<Subcontractor>(query, values);
    return result.rows[0] || null;
  }

  /**
   * Soft delete a subcontractor
   */
  async deleteSubcontractor(
    subcontractorId: string,
    companyId: string
  ): Promise<boolean> {
    const query = `
      UPDATE subcontractors 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
      RETURNING id
    `;
    const result = await db.query(query, [subcontractorId, companyId]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get subcontractor statistics
   */
  async getSubcontractorStats(
    subcontractorId: string,
    companyId: string
  ): Promise<{ activeContractsCount: number; totalContractValue: number }> {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE status NOT IN ('completed', 'terminated')) as active_count,
        COALESCE(SUM(contract_value) FILTER (WHERE status NOT IN ('completed', 'terminated')), 0) as total_value
      FROM subcontractor_contracts
      WHERE subcontractor_id = $1 AND company_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query<{
      active_count: string;
      total_value: string;
    }>(query, [subcontractorId, companyId]);

    return {
      activeContractsCount: parseInt(result.rows[0]?.active_count || '0', 10),
      totalContractValue: parseFloat(result.rows[0]?.total_value || '0'),
    };
  }

  // ============================================
  // CONTRACTS CRUD
  // ============================================

  /**
   * Find all contracts with optional filters and pagination
   */
  async findContracts(
    companyId: string,
    search?: string,
    subcontractorId?: string,
    jobId?: string,
    status?: ContractStatus,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ contracts: SubcontractorContract[]; total: number }> {
    let query = `
      SELECT sc.* 
      FROM subcontractor_contracts sc
      WHERE sc.company_id = $1 AND sc.deleted_at IS NULL
    `;
    const params: any[] = [companyId];
    let paramIndex = 2;

    // Add search filter
    if (search) {
      query += ` AND (sc.title ILIKE $${paramIndex} OR sc.description ILIKE $${paramIndex} OR sc.contract_number ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add subcontractor filter
    if (subcontractorId) {
      query += ` AND sc.subcontractor_id = $${paramIndex}`;
      params.push(subcontractorId);
      paramIndex++;
    }

    // Add job filter
    if (jobId) {
      query += ` AND sc.job_id = $${paramIndex}`;
      params.push(jobId);
      paramIndex++;
    }

    // Add status filter
    if (status) {
      query += ` AND sc.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Get total count
    const countParams = params.slice(0, paramIndex - 1);
    const countQuery = query.replace('SELECT sc.*', 'SELECT COUNT(*)');
    const countResult = await db.query<{ count: string }>(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    // Add ordering and pagination
    query += ` ORDER BY sc.created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query<SubcontractorContract>(query, params);
    return { contracts: result.rows, total };
  }

  /**
   * Find a contract by ID
   */
  async findContractById(
    contractId: string,
    companyId: string
  ): Promise<SubcontractorContract | null> {
    const query = `
      SELECT * FROM subcontractor_contracts 
      WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query<SubcontractorContract>(query, [contractId, companyId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new contract
   */
  async createContract(
    companyId: string,
    subcontractorId: string,
    title: string,
    jobId?: string,
    contractNumber?: string,
    description?: string,
    contractValue?: number,
    startDate?: Date,
    endDate?: Date,
    status?: ContractStatus,
    paymentTerms?: string,
    notes?: string
  ): Promise<SubcontractorContract> {
    // Get subcontractor name for legacy column
    const subQuery = `SELECT name FROM subcontractors WHERE id = $1 AND company_id = $2`;
    const subResult = await db.query(subQuery, [subcontractorId, companyId]);
    const subcontractorName = subResult.rows[0]?.name || 'Unknown';
    
    const query = `
      INSERT INTO subcontractor_contracts (
        company_id, subcontractor_id, job_id, contract_number, title, 
        description, contract_value, start_date, end_date, status, 
        payment_terms, notes, subcontractor_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const result = await db.query<SubcontractorContract>(query, [
      companyId,
      subcontractorId,
      jobId || null,
      contractNumber || null,
      title,
      description || null,
      contractValue || null,
      startDate || null,
      endDate || null,
      status || 'draft',
      paymentTerms || null,
      notes || null,
      subcontractorName,
    ]);
    return result.rows[0];
  }

  /**
   * Update a contract
   */
  async updateContract(
    contractId: string,
    companyId: string,
    updates: {
      jobId?: string;
      contractNumber?: string;
      title?: string;
      description?: string;
      contractValue?: number;
      startDate?: Date;
      endDate?: Date;
      completionDate?: Date;
      status?: ContractStatus;
      progressPercentage?: number;
      paymentTerms?: string;
      notes?: string;
    }
  ): Promise<SubcontractorContract | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbColumn = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbColumn} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findContractById(contractId, companyId);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(contractId, companyId);

    const query = `
      UPDATE subcontractor_contracts 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await db.query<SubcontractorContract>(query, values);
    return result.rows[0] || null;
  }

  /**
   * Soft delete a contract
   */
  async deleteContract(contractId: string, companyId: string): Promise<boolean> {
    const query = `
      UPDATE subcontractor_contracts 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
      RETURNING id
    `;
    const result = await db.query(query, [contractId, companyId]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get contract with related info (subcontractor name, job name)
   */
  async findContractWithDetails(
    contractId: string,
    companyId: string
  ): Promise<any | null> {
    const query = `
      SELECT 
        sc.*,
        s.name as subcontractor_name,
        j.name as job_name
      FROM subcontractor_contracts sc
      LEFT JOIN subcontractors s ON sc.subcontractor_id = s.id
      LEFT JOIN jobs j ON sc.job_id = j.id
      WHERE sc.id = $1 AND sc.company_id = $2 AND sc.deleted_at IS NULL
    `;
    const result = await db.query(query, [contractId, companyId]);
    return result.rows[0] || null;
  }

  // ============================================
  // CONTRACT PAYMENTS
  // ============================================

  /**
   * Create a payment for a contract
   */
  async createPayment(
    contractId: string,
    amount: number,
    paymentDate?: Date,
    paymentMethod?: string,
    referenceNumber?: string,
    notes?: string
  ): Promise<ContractPayment> {
    const query = `
      INSERT INTO contract_payments (
        contract_id, amount, payment_date, payment_method, 
        reference_number, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await db.query<ContractPayment>(query, [
      contractId,
      amount,
      paymentDate || null,
      paymentMethod || null,
      referenceNumber || null,
      notes || null,
    ]);
    return result.rows[0];
  }

  /**
   * Get all payments for a contract
   */
  async findPaymentsByContract(contractId: string): Promise<ContractPayment[]> {
    const query = `
      SELECT * FROM contract_payments 
      WHERE contract_id = $1 
      ORDER BY payment_date DESC, created_at DESC
    `;
    const result = await db.query<ContractPayment>(query, [contractId]);
    return result.rows;
  }

  /**
   * Get payment by ID
   */
  async findPaymentById(paymentId: string): Promise<ContractPayment | null> {
    const query = `SELECT * FROM contract_payments WHERE id = $1`;
    const result = await db.query<ContractPayment>(query, [paymentId]);
    return result.rows[0] || null;
  }

  /**
   * Delete a payment
   */
  async deletePayment(paymentId: string): Promise<boolean> {
    const query = `DELETE FROM contract_payments WHERE id = $1 RETURNING id`;
    const result = await db.query(query, [paymentId]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get total paid amount for a contract
   */
  async getTotalPaidForContract(contractId: string): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(amount), 0) as total_paid 
      FROM contract_payments 
      WHERE contract_id = $1
    `;
    const result = await db.query<{ total_paid: string }>(query, [contractId]);
    return parseFloat(result.rows[0]?.total_paid || '0');
  }
}
