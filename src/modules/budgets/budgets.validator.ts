// Budgets validator

import { z } from 'zod';

/**
 * Validation schema for creating a budget
 */
export const createBudgetSchema = z.object({
  site_id: z.string().uuid('Invalid site ID'),
  total_budget: z
    .number()
    .min(0, 'Total budget must be at least 0')
    .max(999999999999.99, 'Total budget exceeds maximum value'),
  categories: z
    .array(
      z.object({
        category_name: z
          .string()
          .min(1, 'Category name is required')
          .max(255, 'Category name must be less than 255 characters')
          .trim(),
        description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
        allocated_amount: z
          .number()
          .min(0, 'Allocated amount must be at least 0')
          .max(999999999999.99, 'Allocated amount exceeds maximum value'),
        is_custom: z.boolean().optional(),
      })
    )
    .optional(),
});

/**
 * Validation schema for updating a budget
 */
export const updateBudgetSchema = z.object({
  total_budget: z
    .number()
    .min(0, 'Total budget must be at least 0')
    .max(999999999999.99, 'Total budget exceeds maximum value'),
});

/**
 * Validation schema for creating a budget category
 */
export const createCategorySchema = z.object({
  category_name: z
    .string()
    .min(1, 'Category name is required')
    .max(255, 'Category name must be less than 255 characters')
    .trim(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  allocated_amount: z
    .number()
    .min(0, 'Allocated amount must be at least 0')
    .max(999999999999.99, 'Allocated amount exceeds maximum value'),
  is_custom: z.boolean().optional().default(true),
});

/**
 * Validation schema for updating a budget category
 */
export const updateCategorySchema = z.object({
  category_name: z
    .string()
    .min(1, 'Category name cannot be empty')
    .max(255, 'Category name must be less than 255 characters')
    .trim()
    .optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  allocated_amount: z
    .number()
    .min(0, 'Allocated amount must be at least 0')
    .max(999999999999.99, 'Allocated amount exceeds maximum value')
    .optional(),
});

/**
 * Validation schema for creating an expense
 */
export const createExpenseSchema = z.object({
  category_id: z.string().uuid('Invalid category ID').optional(),
  job_id: z.string().uuid('Invalid job ID').optional(),
  expense_name: z
    .string()
    .min(1, 'Expense name is required')
    .max(255, 'Expense name must be less than 255 characters')
    .trim(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  amount: z
    .number()
    .min(0.01, 'Amount must be greater than 0')
    .max(999999999999.99, 'Amount exceeds maximum value'),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  vendor: z.string().max(255, 'Vendor name must be less than 255 characters').optional(),
  receipt_url: z.string().url('Invalid receipt URL').optional(),
});

/**
 * Validation schema for updating an expense
 */
export const updateExpenseSchema = z.object({
  category_id: z.string().uuid('Invalid category ID').optional().nullable(),
  expense_name: z
    .string()
    .min(1, 'Expense name cannot be empty')
    .max(255, 'Expense name must be less than 255 characters')
    .trim()
    .optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  amount: z
    .number()
    .min(0.01, 'Amount must be greater than 0')
    .max(999999999999.99, 'Amount exceeds maximum value')
    .optional(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
  vendor: z.string().max(255, 'Vendor name must be less than 255 characters').optional().nullable(),
  receipt_url: z.string().url('Invalid receipt URL').optional().nullable(),
});

/**
 * Validation schema for budget filters
 */
export const budgetFiltersSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
  category_id: z.string().uuid('Invalid category ID').optional(),
  vendor: z.string().max(255, 'Vendor name must be less than 255 characters').optional(),
  min_amount: z.number().min(0, 'Minimum amount must be at least 0').optional(),
  max_amount: z.number().min(0, 'Maximum amount must be at least 0').optional(),
  page: z.number().int().min(1, 'Page must be at least 1').optional().default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional().default(50),
});

/**
 * Validation schema for pagination query params
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').optional().default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional().default(50),
});

// Export types
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type BudgetFiltersInput = z.infer<typeof budgetFiltersSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
