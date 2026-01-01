// Budgets types

/**
 * Site Budget
 * Main budget table for a site
 */
export interface SiteBudget {
  id: string;
  site_id: string;
  company_id: string;
  total_budget: number;
  allocated_budget: number;
  spent_budget: number;
  created_by: string | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Site Budget Category
 * Categories within a site budget (labor, materials, equipment, etc.)
 */
export interface SiteBudgetCategory {
  id: string;
  site_budget_id: string;
  category_name: string;
  description: string | null;
  allocated_amount: number;
  spent_amount: number;
  is_custom: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Site Budget Expense
 * Individual expenses tracked against categories
 */
export interface SiteBudgetExpense {
  id: string;
  site_budget_id: string;
  category_id: string | null;
  expense_name: string;
  description: string | null;
  amount: number;
  expense_date: Date;
  vendor: string | null;
  receipt_url: string | null;
  created_by: string | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Budget Summary
 * Aggregated budget data with category breakdown
 */
export interface BudgetSummary {
  budget: SiteBudget;
  categories: SiteBudgetCategory[];
  total_expenses: number;
  remaining_budget: number;
  budget_utilization_percentage: number;
}

/**
 * Expense with Category Details
 * Expense joined with its category information
 */
export interface ExpenseWithCategory {
  id: string;
  site_budget_id: string;
  category_id: string | null;
  category_name: string | null;
  expense_name: string;
  description: string | null;
  amount: number;
  expense_date: Date;
  vendor: string | null;
  receipt_url: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Budget Analytics
 * Statistical data for budget analysis
 */
export interface BudgetAnalytics {
  total_budget: number;
  total_spent: number;
  total_remaining: number;
  utilization_percentage: number;
  category_breakdown: CategoryBreakdown[];
  monthly_expenses: MonthlyExpense[];
  top_vendors: VendorSpend[];
}

export interface CategoryBreakdown {
  category_name: string;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  utilization_percentage: number;
  is_custom: boolean;
}

export interface MonthlyExpense {
  month: string;
  year: number;
  total_spent: number;
  expense_count: number;
}

export interface VendorSpend {
  vendor: string;
  total_spent: number;
  expense_count: number;
}

// ============================================
// Request/Response DTOs
// ============================================

export interface CreateBudgetRequest {
  site_id: string;
  total_budget: number;
  categories?: CreateCategoryRequest[];
}

export interface CreateCategoryRequest {
  category_name: string;
  description?: string;
  allocated_amount: number;
  is_custom?: boolean;
}

export interface UpdateBudgetRequest {
  total_budget?: number;
}

export interface UpdateCategoryRequest {
  category_name?: string;
  description?: string;
  allocated_amount?: number;
}

export interface CreateExpenseRequest {
  category_id?: string;
  job_id?: string;
  expense_name: string;
  description?: string;
  amount: number;
  expense_date: string; // ISO date string
  vendor?: string;
  receipt_url?: string;
}

export interface UpdateExpenseRequest {
  category_id?: string;
  expense_name?: string;
  description?: string;
  amount?: number;
  expense_date?: string; // ISO date string
  vendor?: string;
  receipt_url?: string;
}

export interface BudgetFilters {
  start_date?: string;
  end_date?: string;
  category_id?: string;
  vendor?: string;
  min_amount?: number;
  max_amount?: number;
}

// Default budget categories
export const DEFAULT_BUDGET_CATEGORIES = [
  { name: 'Labor', description: 'Labor costs including wages and overtime' },
  { name: 'Materials', description: 'Building materials and supplies' },
  { name: 'Equipment', description: 'Equipment rental and purchases' },
  { name: 'Subcontractors', description: 'Subcontractor payments' },
  { name: 'Permits & Fees', description: 'Permits, licenses, and fees' },
  { name: 'Utilities', description: 'Water, electricity, and other utilities' },
  { name: 'Insurance', description: 'Insurance costs' },
  { name: 'Miscellaneous', description: 'Other expenses' },
];
