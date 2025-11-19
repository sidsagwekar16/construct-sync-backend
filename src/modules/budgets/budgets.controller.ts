// Budgets controller - Request handlers

import { Request, Response, NextFunction } from 'express';
import { BudgetsService } from './budgets.service';
import { successResponse } from '../../utils/response';
import {
  CreateBudgetRequest,
  UpdateBudgetRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  BudgetFilters,
} from './budgets.types';

export class BudgetsController {
  private service: BudgetsService;

  constructor() {
    this.service = new BudgetsService();
  }

  // ============================================
  // BUDGET ENDPOINTS
  // ============================================

  /**
   * GET /api/budgets/site/:siteId
   * Get budget for a site
   */
  getBudgetBySiteId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.siteId;
      const companyId = req.user!.companyId;

      const budget = await this.service.getBudgetBySiteId(siteId, companyId);
      
      if (!budget) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }

      successResponse(res, budget);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/budgets/site/:siteId/summary
   * Get budget summary with categories
   */
  getBudgetSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const siteId = req.params.siteId;
      const companyId = req.user!.companyId;

      const summary = await this.service.getBudgetSummary(siteId, companyId);
      
      if (!summary) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }

      successResponse(res, summary);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/budgets
   * Create a new budget
   */
  createBudget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const data: CreateBudgetRequest = req.body;

      const result = await this.service.createBudget(data, companyId, userId);
      successResponse(res, result, 'Budget created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/budgets/:id
   * Update a budget
   */
  updateBudget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budgetId = req.params.id;
      const companyId = req.user!.companyId;
      const data: UpdateBudgetRequest = req.body;

      const budget = await this.service.updateBudget(budgetId, data, companyId);
      successResponse(res, budget, 'Budget updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/budgets/:id
   * Delete a budget
   */
  deleteBudget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budgetId = req.params.id;
      const companyId = req.user!.companyId;

      await this.service.deleteBudget(budgetId, companyId);
      successResponse(res, null, 'Budget deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // CATEGORY ENDPOINTS
  // ============================================

  /**
   * GET /api/budgets/:budgetId/categories
   * Get all categories for a budget
   */
  getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budgetId = req.params.budgetId;
      const companyId = req.user!.companyId;

      const categories = await this.service.getCategories(budgetId, companyId);
      successResponse(res, categories);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/budgets/:budgetId/categories
   * Create a new category
   */
  createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budgetId = req.params.budgetId;
      const companyId = req.user!.companyId;
      const data: CreateCategoryRequest = req.body;

      const category = await this.service.createCategory(budgetId, data, companyId);
      successResponse(res, category, 'Category created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/budgets/:budgetId/categories/:categoryId
   * Update a category
   */
  updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budgetId = req.params.budgetId;
      const categoryId = req.params.categoryId;
      const companyId = req.user!.companyId;
      const data: UpdateCategoryRequest = req.body;

      const category = await this.service.updateCategory(budgetId, categoryId, data, companyId);
      successResponse(res, category, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/budgets/:budgetId/categories/:categoryId
   * Delete a category
   */
  deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budgetId = req.params.budgetId;
      const categoryId = req.params.categoryId;
      const companyId = req.user!.companyId;

      await this.service.deleteCategory(budgetId, categoryId, companyId);
      successResponse(res, null, 'Category deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // EXPENSE ENDPOINTS
  // ============================================

  /**
   * GET /api/budgets/:budgetId/expenses
   * Get all expenses for a budget
   */
  getExpenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budgetId = req.params.budgetId;
      const companyId = req.user!.companyId;

      // Parse query parameters
      const filters: BudgetFilters = {
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        category_id: req.query.category_id as string,
        vendor: req.query.vendor as string,
        min_amount: req.query.min_amount ? parseFloat(req.query.min_amount as string) : undefined,
        max_amount: req.query.max_amount ? parseFloat(req.query.max_amount as string) : undefined,
      };

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await this.service.getExpenses(budgetId, companyId, filters, page, limit);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/budgets/:budgetId/expenses
   * Create a new expense
   */
  createExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budgetId = req.params.budgetId;
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const data: CreateExpenseRequest = req.body;

      const expense = await this.service.createExpense(budgetId, data, companyId, userId);
      successResponse(res, expense, 'Expense created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/budgets/:budgetId/expenses/:expenseId
   * Update an expense
   */
  updateExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budgetId = req.params.budgetId;
      const expenseId = req.params.expenseId;
      const companyId = req.user!.companyId;
      const data: UpdateExpenseRequest = req.body;

      const expense = await this.service.updateExpense(budgetId, expenseId, data, companyId);
      successResponse(res, expense, 'Expense updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/budgets/:budgetId/expenses/:expenseId
   * Delete an expense
   */
  deleteExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budgetId = req.params.budgetId;
      const expenseId = req.params.expenseId;
      const companyId = req.user!.companyId;

      await this.service.deleteExpense(budgetId, expenseId, companyId);
      successResponse(res, null, 'Expense deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // ANALYTICS ENDPOINTS
  // ============================================

  /**
   * GET /api/budgets/:budgetId/analytics
   * Get budget analytics
   */
  getBudgetAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budgetId = req.params.budgetId;
      const companyId = req.user!.companyId;

      const analytics = await this.service.getBudgetAnalytics(budgetId, companyId);
      successResponse(res, analytics);
    } catch (error) {
      next(error);
    }
  };
}
