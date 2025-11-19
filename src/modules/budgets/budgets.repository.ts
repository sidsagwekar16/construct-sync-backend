// Budgets repository - Database operations

import { db } from '../../db/connection';
import {
  SiteBudget,
  SiteBudgetCategory,
  SiteBudgetExpense,
  ExpenseWithCategory,
  BudgetFilters,
  CategoryBreakdown,
  MonthlyExpense,
  VendorSpend,
  DEFAULT_BUDGET_CATEGORIES,
} from './budgets.types';

export class BudgetsRepository {
  // ============================================
  // SITE BUDGET OPERATIONS
  // ============================================

  /**
   * Find site budget by site ID
   */
  async findBudgetBySiteId(siteId: string, companyId: string): Promise<SiteBudget | null> {
    const query = `
      SELECT * FROM site_budgets 
      WHERE site_id = $1 AND company_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query<SiteBudget>(query, [siteId, companyId]);
    return result.rows[0] || null;
  }

  /**
   * Find site budget by ID
   */
  async findBudgetById(budgetId: string, companyId: string): Promise<SiteBudget | null> {
    const query = `
      SELECT * FROM site_budgets 
      WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query<SiteBudget>(query, [budgetId, companyId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new site budget
   */
  async createBudget(
    siteId: string,
    companyId: string,
    totalBudget: number,
    createdBy: string
  ): Promise<SiteBudget> {
    const query = `
      INSERT INTO site_budgets (site_id, company_id, total_budget, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query<SiteBudget>(query, [siteId, companyId, totalBudget, createdBy]);
    return result.rows[0];
  }

  /**
   * Update site budget
   */
  async updateBudget(
    budgetId: string,
    companyId: string,
    totalBudget: number
  ): Promise<SiteBudget | null> {
    const query = `
      UPDATE site_budgets 
      SET total_budget = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND company_id = $3 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await db.query<SiteBudget>(query, [totalBudget, budgetId, companyId]);
    return result.rows[0] || null;
  }

  /**
   * Update budget totals (allocated and spent)
   */
  async updateBudgetTotals(budgetId: string): Promise<void> {
    // Calculate allocated budget from categories
    const allocatedQuery = `
      UPDATE site_budgets
      SET allocated_budget = (
        SELECT COALESCE(SUM(allocated_amount), 0)
        FROM site_budget_categories
        WHERE site_budget_id = $1 AND deleted_at IS NULL
      )
      WHERE id = $1
    `;
    await db.query(allocatedQuery, [budgetId]);

    // Calculate spent budget from expenses
    const spentQuery = `
      UPDATE site_budgets
      SET spent_budget = (
        SELECT COALESCE(SUM(amount), 0)
        FROM site_budget_expenses
        WHERE site_budget_id = $1 AND deleted_at IS NULL
      )
      WHERE id = $1
    `;
    await db.query(spentQuery, [budgetId]);
  }

  /**
   * Delete site budget (soft delete)
   */
  async deleteBudget(budgetId: string, companyId: string): Promise<boolean> {
    const query = `
      UPDATE site_budgets 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
      RETURNING id
    `;
    const result = await db.query(query, [budgetId, companyId]);
    return result.rows.length > 0;
  }

  // ============================================
  // CATEGORY OPERATIONS
  // ============================================

  /**
   * Find all categories for a budget
   */
  async findCategoriesByBudgetId(budgetId: string): Promise<SiteBudgetCategory[]> {
    const query = `
      SELECT * FROM site_budget_categories 
      WHERE site_budget_id = $1 AND deleted_at IS NULL
      ORDER BY created_at ASC
    `;
    const result = await db.query<SiteBudgetCategory>(query, [budgetId]);
    return result.rows;
  }

  /**
   * Find category by ID
   */
  async findCategoryById(categoryId: string, budgetId: string): Promise<SiteBudgetCategory | null> {
    const query = `
      SELECT * FROM site_budget_categories 
      WHERE id = $1 AND site_budget_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query<SiteBudgetCategory>(query, [categoryId, budgetId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new budget category
   */
  async createCategory(
    budgetId: string,
    categoryName: string,
    allocatedAmount: number,
    description?: string,
    isCustom: boolean = false
  ): Promise<SiteBudgetCategory> {
    const query = `
      INSERT INTO site_budget_categories 
        (site_budget_id, category_name, description, allocated_amount, is_custom)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await db.query<SiteBudgetCategory>(query, [
      budgetId,
      categoryName,
      description || null,
      allocatedAmount,
      isCustom,
    ]);
    return result.rows[0];
  }

  /**
   * Create default categories for a budget
   */
  async createDefaultCategories(budgetId: string): Promise<SiteBudgetCategory[]> {
    const categories: SiteBudgetCategory[] = [];
    
    for (const defaultCategory of DEFAULT_BUDGET_CATEGORIES) {
      const category = await this.createCategory(
        budgetId,
        defaultCategory.name,
        0,
        defaultCategory.description,
        false
      );
      categories.push(category);
    }
    
    return categories;
  }

  /**
   * Update budget category
   */
  async updateCategory(
    categoryId: string,
    budgetId: string,
    data: {
      category_name?: string;
      description?: string;
      allocated_amount?: number;
    }
  ): Promise<SiteBudgetCategory | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.category_name !== undefined) {
      updates.push(`category_name = $${paramIndex}`);
      params.push(data.category_name);
      paramIndex++;
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(data.description);
      paramIndex++;
    }

    if (data.allocated_amount !== undefined) {
      updates.push(`allocated_amount = $${paramIndex}`);
      params.push(data.allocated_amount);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.findCategoryById(categoryId, budgetId);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE site_budget_categories 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND site_budget_id = $${paramIndex + 1} AND deleted_at IS NULL
      RETURNING *
    `;
    params.push(categoryId, budgetId);

    const result = await db.query<SiteBudgetCategory>(query, params);
    return result.rows[0] || null;
  }

  /**
   * Update category spent amount
   */
  async updateCategorySpent(categoryId: string): Promise<void> {
    const query = `
      UPDATE site_budget_categories
      SET spent_amount = (
        SELECT COALESCE(SUM(amount), 0)
        FROM site_budget_expenses
        WHERE category_id = $1 AND deleted_at IS NULL
      )
      WHERE id = $1
    `;
    await db.query(query, [categoryId]);
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(categoryId: string, budgetId: string): Promise<boolean> {
    const query = `
      UPDATE site_budget_categories 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND site_budget_id = $2 AND deleted_at IS NULL
      RETURNING id
    `;
    const result = await db.query(query, [categoryId, budgetId]);
    return result.rows.length > 0;
  }

  // ============================================
  // EXPENSE OPERATIONS
  // ============================================

  /**
   * Find all expenses for a budget with filters
   */
  async findExpensesByBudgetId(
    budgetId: string,
    filters?: BudgetFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ expenses: ExpenseWithCategory[]; total: number }> {
    let query = `
      SELECT 
        e.*,
        c.category_name
      FROM site_budget_expenses e
      LEFT JOIN site_budget_categories c ON e.category_id = c.id
      WHERE e.site_budget_id = $1 AND e.deleted_at IS NULL
    `;
    const params: any[] = [budgetId];
    let paramIndex = 2;

    // Apply filters
    if (filters?.start_date) {
      query += ` AND e.expense_date >= $${paramIndex}`;
      params.push(filters.start_date);
      paramIndex++;
    }

    if (filters?.end_date) {
      query += ` AND e.expense_date <= $${paramIndex}`;
      params.push(filters.end_date);
      paramIndex++;
    }

    if (filters?.category_id) {
      query += ` AND e.category_id = $${paramIndex}`;
      params.push(filters.category_id);
      paramIndex++;
    }

    if (filters?.vendor) {
      query += ` AND e.vendor ILIKE $${paramIndex}`;
      params.push(`%${filters.vendor}%`);
      paramIndex++;
    }

    if (filters?.min_amount !== undefined) {
      query += ` AND e.amount >= $${paramIndex}`;
      params.push(filters.min_amount);
      paramIndex++;
    }

    if (filters?.max_amount !== undefined) {
      query += ` AND e.amount <= $${paramIndex}`;
      params.push(filters.max_amount);
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM (${query}) as count_query`;
    const countResult = await db.query<{ count: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Add sorting and pagination
    query += ` ORDER BY e.expense_date DESC, e.created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query<ExpenseWithCategory>(query, params);
    return { expenses: result.rows, total };
  }

  /**
   * Find expense by ID
   */
  async findExpenseById(expenseId: string, budgetId: string): Promise<SiteBudgetExpense | null> {
    const query = `
      SELECT * FROM site_budget_expenses 
      WHERE id = $1 AND site_budget_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query<SiteBudgetExpense>(query, [expenseId, budgetId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new expense
   */
  async createExpense(
    budgetId: string,
    expenseName: string,
    amount: number,
    expenseDate: Date,
    createdBy: string,
    categoryId?: string,
    description?: string,
    vendor?: string,
    receiptUrl?: string
  ): Promise<SiteBudgetExpense> {
    const query = `
      INSERT INTO site_budget_expenses 
        (site_budget_id, category_id, expense_name, description, amount, 
         expense_date, vendor, receipt_url, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await db.query<SiteBudgetExpense>(query, [
      budgetId,
      categoryId || null,
      expenseName,
      description || null,
      amount,
      expenseDate,
      vendor || null,
      receiptUrl || null,
      createdBy,
    ]);
    return result.rows[0];
  }

  /**
   * Update expense
   */
  async updateExpense(
    expenseId: string,
    budgetId: string,
    data: {
      category_id?: string;
      expense_name?: string;
      description?: string;
      amount?: number;
      expense_date?: Date;
      vendor?: string;
      receipt_url?: string;
    }
  ): Promise<SiteBudgetExpense | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.category_id !== undefined) {
      updates.push(`category_id = $${paramIndex}`);
      params.push(data.category_id || null);
      paramIndex++;
    }

    if (data.expense_name !== undefined) {
      updates.push(`expense_name = $${paramIndex}`);
      params.push(data.expense_name);
      paramIndex++;
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(data.description);
      paramIndex++;
    }

    if (data.amount !== undefined) {
      updates.push(`amount = $${paramIndex}`);
      params.push(data.amount);
      paramIndex++;
    }

    if (data.expense_date !== undefined) {
      updates.push(`expense_date = $${paramIndex}`);
      params.push(data.expense_date);
      paramIndex++;
    }

    if (data.vendor !== undefined) {
      updates.push(`vendor = $${paramIndex}`);
      params.push(data.vendor || null);
      paramIndex++;
    }

    if (data.receipt_url !== undefined) {
      updates.push(`receipt_url = $${paramIndex}`);
      params.push(data.receipt_url || null);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.findExpenseById(expenseId, budgetId);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE site_budget_expenses 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND site_budget_id = $${paramIndex + 1} AND deleted_at IS NULL
      RETURNING *
    `;
    params.push(expenseId, budgetId);

    const result = await db.query<SiteBudgetExpense>(query, params);
    return result.rows[0] || null;
  }

  /**
   * Delete expense (soft delete)
   */
  async deleteExpense(expenseId: string, budgetId: string): Promise<boolean> {
    const query = `
      UPDATE site_budget_expenses 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND site_budget_id = $2 AND deleted_at IS NULL
      RETURNING id
    `;
    const result = await db.query(query, [expenseId, budgetId]);
    return result.rows.length > 0;
  }

  // ============================================
  // ANALYTICS & REPORTING
  // ============================================

  /**
   * Get category breakdown with utilization
   */
  async getCategoryBreakdown(budgetId: string): Promise<CategoryBreakdown[]> {
    const query = `
      SELECT 
        category_name,
        allocated_amount,
        spent_amount,
        (allocated_amount - spent_amount) as remaining_amount,
        CASE 
          WHEN allocated_amount > 0 
          THEN (spent_amount / allocated_amount * 100)
          ELSE 0 
        END as utilization_percentage,
        is_custom
      FROM site_budget_categories
      WHERE site_budget_id = $1 AND deleted_at IS NULL
      ORDER BY allocated_amount DESC
    `;
    const result = await db.query<CategoryBreakdown>(query, [budgetId]);
    return result.rows;
  }

  /**
   * Get monthly expense summary
   */
  async getMonthlyExpenses(budgetId: string): Promise<MonthlyExpense[]> {
    const query = `
      SELECT 
        TO_CHAR(expense_date, 'Mon') as month,
        EXTRACT(YEAR FROM expense_date)::integer as year,
        SUM(amount) as total_spent,
        COUNT(*)::integer as expense_count
      FROM site_budget_expenses
      WHERE site_budget_id = $1 AND deleted_at IS NULL
      GROUP BY TO_CHAR(expense_date, 'Mon'), EXTRACT(YEAR FROM expense_date), EXTRACT(MONTH FROM expense_date)
      ORDER BY EXTRACT(YEAR FROM expense_date), EXTRACT(MONTH FROM expense_date)
    `;
    const result = await db.query<MonthlyExpense>(query, [budgetId]);
    return result.rows;
  }

  /**
   * Get top vendors by spend
   */
  async getTopVendors(budgetId: string, limit: number = 10): Promise<VendorSpend[]> {
    const query = `
      SELECT 
        vendor,
        SUM(amount) as total_spent,
        COUNT(*)::integer as expense_count
      FROM site_budget_expenses
      WHERE site_budget_id = $1 AND deleted_at IS NULL AND vendor IS NOT NULL
      GROUP BY vendor
      ORDER BY total_spent DESC
      LIMIT $2
    `;
    const result = await db.query<VendorSpend>(query, [budgetId, limit]);
    return result.rows;
  }

  /**
   * Get total expenses for a budget
   */
  async getTotalExpenses(budgetId: string): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM site_budget_expenses
      WHERE site_budget_id = $1 AND deleted_at IS NULL
    `;
    const result = await db.query<{ total: number }>(query, [budgetId]);
    return result.rows[0].total;
  }
}
