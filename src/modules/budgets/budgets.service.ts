// Budgets service - Business logic

import { BudgetsRepository } from './budgets.repository';
import {
  SiteBudget,
  SiteBudgetCategory,
  SiteBudgetExpense,
  BudgetSummary,
  BudgetAnalytics,
  CreateBudgetRequest,
  CreateCategoryRequest,
  UpdateBudgetRequest,
  UpdateCategoryRequest,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  BudgetFilters,
  ExpenseWithCategory,
} from './budgets.types';

export class BudgetsService {
  private repository: BudgetsRepository;

  constructor() {
    this.repository = new BudgetsRepository();
  }

  // ============================================
  // BUDGET OPERATIONS
  // ============================================

  /**
   * Get budget for a site
   */
  async getBudgetBySiteId(siteId: string, companyId: string): Promise<SiteBudget | null> {
    return await this.repository.findBudgetBySiteId(siteId, companyId);
  }

  /**
   * Get budget summary with categories
   */
  async getBudgetSummary(siteId: string, companyId: string): Promise<BudgetSummary | null> {
    const budget = await this.repository.findBudgetBySiteId(siteId, companyId);
    
    if (!budget) {
      return null;
    }

    const categories = await this.repository.findCategoriesByBudgetId(budget.id);
    const totalExpenses = await this.repository.getTotalExpenses(budget.id);
    const remainingBudget = budget.total_budget - totalExpenses;
    const budgetUtilizationPercentage = budget.total_budget > 0 
      ? (totalExpenses / budget.total_budget) * 100 
      : 0;

    return {
      budget,
      categories,
      total_expenses: totalExpenses,
      remaining_budget: remainingBudget,
      budget_utilization_percentage: budgetUtilizationPercentage,
    };
  }

  /**
   * Create a new budget for a site
   */
  async createBudget(
    data: CreateBudgetRequest,
    companyId: string,
    userId: string
  ): Promise<{ budget: SiteBudget; categories: SiteBudgetCategory[] }> {
    // Check if budget already exists for this site
    const existingBudget = await this.repository.findBudgetBySiteId(data.site_id, companyId);
    
    if (existingBudget) {
      throw new Error('Budget already exists for this site');
    }

    // Create the budget
    const budget = await this.repository.createBudget(
      data.site_id,
      companyId,
      data.total_budget,
      userId
    );

    let categories: SiteBudgetCategory[] = [];

    // Create custom categories if provided
    if (data.categories && data.categories.length > 0) {
      for (const categoryData of data.categories) {
        const category = await this.repository.createCategory(
          budget.id,
          categoryData.category_name,
          categoryData.allocated_amount,
          categoryData.description,
          categoryData.is_custom || false
        );
        categories.push(category);
      }
    } else {
      // Create default categories
      categories = await this.repository.createDefaultCategories(budget.id);
    }

    // Update budget totals
    await this.repository.updateBudgetTotals(budget.id);

    return { budget, categories };
  }

  /**
   * Update budget
   */
  async updateBudget(
    budgetId: string,
    data: UpdateBudgetRequest,
    companyId: string
  ): Promise<SiteBudget> {
    const budget = await this.repository.findBudgetById(budgetId, companyId);
    
    if (!budget) {
      throw new Error('Budget not found');
    }

    if (data.total_budget === undefined) {
      throw new Error('No update data provided');
    }

    const updatedBudget = await this.repository.updateBudget(
      budgetId,
      companyId,
      data.total_budget
    );

    if (!updatedBudget) {
      throw new Error('Failed to update budget');
    }

    return updatedBudget;
  }

  /**
   * Delete budget
   */
  async deleteBudget(budgetId: string, companyId: string): Promise<void> {
    const budget = await this.repository.findBudgetById(budgetId, companyId);
    
    if (!budget) {
      throw new Error('Budget not found');
    }

    const deleted = await this.repository.deleteBudget(budgetId, companyId);
    
    if (!deleted) {
      throw new Error('Failed to delete budget');
    }
  }

  // ============================================
  // CATEGORY OPERATIONS
  // ============================================

  /**
   * Get all categories for a budget
   */
  async getCategories(budgetId: string, companyId: string): Promise<SiteBudgetCategory[]> {
    const budget = await this.repository.findBudgetById(budgetId, companyId);
    
    if (!budget) {
      throw new Error('Budget not found');
    }

    return await this.repository.findCategoriesByBudgetId(budgetId);
  }

  /**
   * Create a new category
   */
  async createCategory(
    budgetId: string,
    data: CreateCategoryRequest,
    companyId: string
  ): Promise<SiteBudgetCategory> {
    const budget = await this.repository.findBudgetById(budgetId, companyId);
    
    if (!budget) {
      throw new Error('Budget not found');
    }

    const category = await this.repository.createCategory(
      budgetId,
      data.category_name,
      data.allocated_amount,
      data.description,
      data.is_custom || true // New categories are custom by default
    );

    // Update budget totals
    await this.repository.updateBudgetTotals(budgetId);

    return category;
  }

  /**
   * Update category
   */
  async updateCategory(
    budgetId: string,
    categoryId: string,
    data: UpdateCategoryRequest,
    companyId: string
  ): Promise<SiteBudgetCategory> {
    const budget = await this.repository.findBudgetById(budgetId, companyId);
    
    if (!budget) {
      throw new Error('Budget not found');
    }

    const category = await this.repository.findCategoryById(categoryId, budgetId);
    
    if (!category) {
      throw new Error('Category not found');
    }

    const updatedCategory = await this.repository.updateCategory(categoryId, budgetId, data);

    if (!updatedCategory) {
      throw new Error('Failed to update category');
    }

    // Update budget totals if allocated amount changed
    if (data.allocated_amount !== undefined) {
      await this.repository.updateBudgetTotals(budgetId);
    }

    return updatedCategory;
  }

  /**
   * Delete category
   */
  async deleteCategory(budgetId: string, categoryId: string, companyId: string): Promise<void> {
    const budget = await this.repository.findBudgetById(budgetId, companyId);
    
    if (!budget) {
      throw new Error('Budget not found');
    }

    const category = await this.repository.findCategoryById(categoryId, budgetId);
    
    if (!category) {
      throw new Error('Category not found');
    }

    const deleted = await this.repository.deleteCategory(categoryId, budgetId);
    
    if (!deleted) {
      throw new Error('Failed to delete category');
    }

    // Update budget totals
    await this.repository.updateBudgetTotals(budgetId);
  }

  // ============================================
  // EXPENSE OPERATIONS
  // ============================================

  /**
   * Get all expenses for a budget
   */
  async getExpenses(
    budgetId: string,
    companyId: string,
    filters?: BudgetFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<{ expenses: ExpenseWithCategory[]; total: number; page: number; limit: number }> {
    const budget = await this.repository.findBudgetById(budgetId, companyId);
    
    if (!budget) {
      throw new Error('Budget not found');
    }

    const offset = (page - 1) * limit;
    const { expenses, total } = await this.repository.findExpensesByBudgetId(
      budgetId,
      filters,
      limit,
      offset
    );

    return { expenses, total, page, limit };
  }

  /**
   * Create a new expense
   */
  async createExpense(
    budgetId: string,
    data: CreateExpenseRequest,
    companyId: string,
    userId: string
  ): Promise<SiteBudgetExpense> {
    const budget = await this.repository.findBudgetById(budgetId, companyId);
    
    if (!budget) {
      throw new Error('Budget not found');
    }

    // Verify category exists if provided
    if (data.category_id) {
      const category = await this.repository.findCategoryById(data.category_id, budgetId);
      if (!category) {
        throw new Error('Category not found');
      }
    }

    const expenseDate = new Date(data.expense_date);

    const expense = await this.repository.createExpense(
      budgetId,
      data.expense_name,
      data.amount,
      expenseDate,
      userId,
      data.category_id,
      data.description,
      data.vendor,
      data.receipt_url
    );

    // Update category spent amount if category is provided
    if (data.category_id) {
      await this.repository.updateCategorySpent(data.category_id);
    }

    // Update budget totals
    await this.repository.updateBudgetTotals(budgetId);

    return expense;
  }

  /**
   * Update expense
   */
  async updateExpense(
    budgetId: string,
    expenseId: string,
    data: UpdateExpenseRequest,
    companyId: string
  ): Promise<SiteBudgetExpense> {
    const budget = await this.repository.findBudgetById(budgetId, companyId);
    
    if (!budget) {
      throw new Error('Budget not found');
    }

    const expense = await this.repository.findExpenseById(expenseId, budgetId);
    
    if (!expense) {
      throw new Error('Expense not found');
    }

    // Verify new category exists if provided
    if (data.category_id) {
      const category = await this.repository.findCategoryById(data.category_id, budgetId);
      if (!category) {
        throw new Error('Category not found');
      }
    }

    const updateData: any = {};
    
    if (data.category_id !== undefined) updateData.category_id = data.category_id;
    if (data.expense_name !== undefined) updateData.expense_name = data.expense_name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.expense_date !== undefined) updateData.expense_date = new Date(data.expense_date);
    if (data.vendor !== undefined) updateData.vendor = data.vendor;
    if (data.receipt_url !== undefined) updateData.receipt_url = data.receipt_url;

    const updatedExpense = await this.repository.updateExpense(expenseId, budgetId, updateData);

    if (!updatedExpense) {
      throw new Error('Failed to update expense');
    }

    // Update category spent amounts for old and new categories
    if (expense.category_id) {
      await this.repository.updateCategorySpent(expense.category_id);
    }
    if (data.category_id && data.category_id !== expense.category_id) {
      await this.repository.updateCategorySpent(data.category_id);
    }

    // Update budget totals
    await this.repository.updateBudgetTotals(budgetId);

    return updatedExpense;
  }

  /**
   * Delete expense
   */
  async deleteExpense(budgetId: string, expenseId: string, companyId: string): Promise<void> {
    const budget = await this.repository.findBudgetById(budgetId, companyId);
    
    if (!budget) {
      throw new Error('Budget not found');
    }

    const expense = await this.repository.findExpenseById(expenseId, budgetId);
    
    if (!expense) {
      throw new Error('Expense not found');
    }

    const deleted = await this.repository.deleteExpense(expenseId, budgetId);
    
    if (!deleted) {
      throw new Error('Failed to delete expense');
    }

    // Update category spent amount if expense had a category
    if (expense.category_id) {
      await this.repository.updateCategorySpent(expense.category_id);
    }

    // Update budget totals
    await this.repository.updateBudgetTotals(budgetId);
  }

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Get budget analytics
   */
  async getBudgetAnalytics(budgetId: string, companyId: string): Promise<BudgetAnalytics> {
    const budget = await this.repository.findBudgetById(budgetId, companyId);
    
    if (!budget) {
      throw new Error('Budget not found');
    }

    const totalSpent = await this.repository.getTotalExpenses(budgetId);
    const totalRemaining = budget.total_budget - totalSpent;
    const utilizationPercentage = budget.total_budget > 0 
      ? (totalSpent / budget.total_budget) * 100 
      : 0;

    const categoryBreakdown = await this.repository.getCategoryBreakdown(budgetId);
    const monthlyExpenses = await this.repository.getMonthlyExpenses(budgetId);
    const topVendors = await this.repository.getTopVendors(budgetId, 10);

    return {
      total_budget: budget.total_budget,
      total_spent: totalSpent,
      total_remaining: totalRemaining,
      utilization_percentage: utilizationPercentage,
      category_breakdown: categoryBreakdown,
      monthly_expenses: monthlyExpenses,
      top_vendors: topVendors,
    };
  }
}
