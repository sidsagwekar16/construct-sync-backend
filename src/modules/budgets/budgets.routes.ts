// Budgets routes

import { Router } from 'express';
import { BudgetsController } from './budgets.controller';
import { validateRequest } from '../../middlewares/validate-request';
import { authenticateToken } from '../../middlewares/auth';
import {
  createBudgetSchema,
  updateBudgetSchema,
  createCategorySchema,
  updateCategorySchema,
  createExpenseSchema,
  updateExpenseSchema,
  budgetFiltersSchema,
} from './budgets.validator';

const router = Router();
const budgetsController = new BudgetsController();

// All routes require authentication
router.use(authenticateToken);

// ============================================
// BUDGET ROUTES
// ============================================

/**
 * @swagger
 * /api/budgets/site/{siteId}:
 *   get:
 *     tags:
 *       - Budgets
 *     summary: Get budget by site ID
 *     description: Get the budget for a specific site
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Budget retrieved successfully
 *       404:
 *         description: Budget not found
 *       401:
 *         description: Unauthorized
 */
router.get('/site/:siteId', budgetsController.getBudgetBySiteId);

/**
 * @swagger
 * /api/budgets/site/{siteId}/summary:
 *   get:
 *     tags:
 *       - Budgets
 *     summary: Get budget summary
 *     description: Get budget summary with categories and utilization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Budget summary retrieved successfully
 *       404:
 *         description: Budget not found
 *       401:
 *         description: Unauthorized
 */
router.get('/site/:siteId/summary', budgetsController.getBudgetSummary);

/**
 * @swagger
 * /api/budgets:
 *   post:
 *     tags:
 *       - Budgets
 *     summary: Create a new budget
 *     description: Create a budget for a site with optional categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - site_id
 *               - total_budget
 *             properties:
 *               site_id:
 *                 type: string
 *                 format: uuid
 *               total_budget:
 *                 type: number
 *                 minimum: 0
 *               categories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     category_name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     allocated_amount:
 *                       type: number
 *                     is_custom:
 *                       type: boolean
 *     responses:
 *       201:
 *         description: Budget created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  validateRequest(createBudgetSchema),
  budgetsController.createBudget
);

/**
 * @swagger
 * /api/budgets/{id}:
 *   patch:
 *     tags:
 *       - Budgets
 *     summary: Update a budget
 *     description: Update budget total amount
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               total_budget:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Budget updated successfully
 *       404:
 *         description: Budget not found
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/:id',
  validateRequest(updateBudgetSchema),
  budgetsController.updateBudget
);

/**
 * @swagger
 * /api/budgets/{id}:
 *   delete:
 *     tags:
 *       - Budgets
 *     summary: Delete a budget
 *     description: Soft delete a budget
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget ID
 *     responses:
 *       200:
 *         description: Budget deleted successfully
 *       404:
 *         description: Budget not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', budgetsController.deleteBudget);

// ============================================
// CATEGORY ROUTES
// ============================================

/**
 * @swagger
 * /api/budgets/{budgetId}/categories:
 *   get:
 *     tags:
 *       - Budgets
 *     summary: Get all categories
 *     description: Get all budget categories for a budget
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget ID
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *       404:
 *         description: Budget not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:budgetId/categories', budgetsController.getCategories);

/**
 * @swagger
 * /api/budgets/{budgetId}/categories:
 *   post:
 *     tags:
 *       - Budgets
 *     summary: Create a category
 *     description: Create a new budget category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category_name
 *               - allocated_amount
 *             properties:
 *               category_name:
 *                 type: string
 *               description:
 *                 type: string
 *               allocated_amount:
 *                 type: number
 *                 minimum: 0
 *               is_custom:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:budgetId/categories',
  validateRequest(createCategorySchema),
  budgetsController.createCategory
);

/**
 * @swagger
 * /api/budgets/{budgetId}/categories/{categoryId}:
 *   patch:
 *     tags:
 *       - Budgets
 *     summary: Update a category
 *     description: Update budget category details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget ID
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category_name:
 *                 type: string
 *               description:
 *                 type: string
 *               allocated_amount:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/:budgetId/categories/:categoryId',
  validateRequest(updateCategorySchema),
  budgetsController.updateCategory
);

/**
 * @swagger
 * /api/budgets/{budgetId}/categories/{categoryId}:
 *   delete:
 *     tags:
 *       - Budgets
 *     summary: Delete a category
 *     description: Soft delete a budget category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget ID
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:budgetId/categories/:categoryId', budgetsController.deleteCategory);

// ============================================
// EXPENSE ROUTES
// ============================================

/**
 * @swagger
 * /api/budgets/{budgetId}/expenses:
 *   get:
 *     tags:
 *       - Budgets
 *     summary: Get all expenses
 *     description: Get all expenses for a budget with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: vendor
 *         schema:
 *           type: string
 *       - in: query
 *         name: min_amount
 *         schema:
 *           type: number
 *       - in: query
 *         name: max_amount
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Expenses retrieved successfully
 *       404:
 *         description: Budget not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:budgetId/expenses', budgetsController.getExpenses);

/**
 * @swagger
 * /api/budgets/{budgetId}/expenses:
 *   post:
 *     tags:
 *       - Budgets
 *     summary: Create an expense
 *     description: Create a new expense in a budget
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expense_name
 *               - amount
 *               - expense_date
 *             properties:
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               expense_name:
 *                 type: string
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               expense_date:
 *                 type: string
 *                 format: date
 *               vendor:
 *                 type: string
 *               receipt_url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Expense created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:budgetId/expenses',
  validateRequest(createExpenseSchema),
  budgetsController.createExpense
);

/**
 * @swagger
 * /api/budgets/{budgetId}/expenses/{expenseId}:
 *   patch:
 *     tags:
 *       - Budgets
 *     summary: Update an expense
 *     description: Update expense details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget ID
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Expense ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               expense_name:
 *                 type: string
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               expense_date:
 *                 type: string
 *                 format: date
 *               vendor:
 *                 type: string
 *               receipt_url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Expense updated successfully
 *       404:
 *         description: Expense not found
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/:budgetId/expenses/:expenseId',
  validateRequest(updateExpenseSchema),
  budgetsController.updateExpense
);

/**
 * @swagger
 * /api/budgets/{budgetId}/expenses/{expenseId}:
 *   delete:
 *     tags:
 *       - Budgets
 *     summary: Delete an expense
 *     description: Soft delete an expense
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget ID
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Expense deleted successfully
 *       404:
 *         description: Expense not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:budgetId/expenses/:expenseId', budgetsController.deleteExpense);

// ============================================
// ANALYTICS ROUTES
// ============================================

/**
 * @swagger
 * /api/budgets/{budgetId}/analytics:
 *   get:
 *     tags:
 *       - Budgets
 *     summary: Get budget analytics
 *     description: Get comprehensive budget analytics including category breakdown and trends
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget ID
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *       404:
 *         description: Budget not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:budgetId/analytics', budgetsController.getBudgetAnalytics);

export default router;
