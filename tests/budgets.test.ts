import request from 'supertest';
import { createApp } from '../src/app';
import { mockDbQuery } from './setup';
import { UserRole } from '../src/types/enums';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

describe('Budgets API Tests', () => {
  let app: any;
  let authToken: string;
  const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
  const mockCompanyId = '123e4567-e89b-12d3-a456-426614174000';
  const mockSiteId = '123e4567-e89b-12d3-a456-426614174030';
  const mockBudgetId = '123e4567-e89b-12d3-a456-426614174040';
  const mockCategoryId = '123e4567-e89b-12d3-a456-426614174041';
  const mockExpenseId = '123e4567-e89b-12d3-a456-426614174042';

  beforeAll(() => {
    app = createApp();
    
    // Generate a valid JWT token for testing
    authToken = jwt.sign(
      {
        userId: mockUserId,
        email: 'test@example.com',
        role: UserRole.COMPANY_ADMIN,
        companyId: mockCompanyId,
      },
      env.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  // ============================================
  // BUDGET TESTS
  // ============================================

  describe('POST /api/budgets', () => {
    it('should create a new budget successfully', async () => {
      const budgetData = {
        site_id: mockSiteId,
        total_budget: 500000.00,
        categories: [
          {
            category_name: 'Labor',
            description: 'Labor costs',
            allocated_amount: 200000.00,
          },
          {
            category_name: 'Materials',
            description: 'Building materials',
            allocated_amount: 150000.00,
          },
        ],
      };

      const mockBudget = {
        id: mockBudgetId,
        site_id: mockSiteId,
        company_id: mockCompanyId,
        total_budget: budgetData.total_budget,
        allocated_budget: 0,
        spent_budget: 0,
        created_by: mockUserId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockCategories = budgetData.categories.map((cat, i) => ({
        id: `${mockCategoryId}-${i}`,
        site_budget_id: mockBudgetId,
        category_name: cat.category_name,
        description: cat.description,
        allocated_amount: cat.allocated_amount,
        spent_amount: 0,
        is_custom: false,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      // Mock: Check if budget exists
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);
      // Mock: Create budget
      mockDbQuery.mockResolvedValueOnce({ rows: [mockBudget] } as any);
      // Mock: Create categories
      budgetData.categories.forEach((_, i) => {
        mockDbQuery.mockResolvedValueOnce({ rows: [mockCategories[i]] } as any);
      });
      // Mock: Update budget totals (allocated)
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);
      // Mock: Update budget totals (spent)
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(budgetData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Budget created successfully');
      expect(response.body.data.budget).toHaveProperty('id', mockBudgetId);
      expect(response.body.data.budget.total_budget).toBe(budgetData.total_budget);
      expect(response.body.data.categories).toHaveLength(budgetData.categories.length);
    });

    it('should create a budget with default categories', async () => {
      const budgetData = {
        site_id: mockSiteId,
        total_budget: 1000000.00,
      };

      const mockBudget = {
        id: mockBudgetId,
        site_id: mockSiteId,
        company_id: mockCompanyId,
        total_budget: budgetData.total_budget,
        allocated_budget: 0,
        spent_budget: 0,
        created_by: mockUserId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock: Check if budget exists
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);
      // Mock: Create budget
      mockDbQuery.mockResolvedValueOnce({ rows: [mockBudget] } as any);
      // Mock: Create 8 default categories
      for (let i = 0; i < 8; i++) {
        mockDbQuery.mockResolvedValueOnce({
          rows: [{
            id: `${mockCategoryId}-${i}`,
            site_budget_id: mockBudgetId,
            category_name: 'Category',
            allocated_amount: 0,
            spent_amount: 0,
            is_custom: false,
          }],
        } as any);
      }
      // Mock: Update budget totals (allocated)
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);
      // Mock: Update budget totals (spent)
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(budgetData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories.length).toBeGreaterThan(0);
    });

    it('should fail with invalid total_budget', async () => {
      const budgetData = {
        site_id: mockSiteId,
        total_budget: -1000, // Negative value
      };

      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(budgetData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const budgetData = {
        site_id: mockSiteId,
        total_budget: 500000.00,
      };

      const response = await request(app)
        .post('/api/budgets')
        .send(budgetData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/budgets/site/:siteId', () => {
    it('should get budget by site ID', async () => {
      const mockBudget = {
        id: mockBudgetId,
        site_id: mockSiteId,
        company_id: mockCompanyId,
        total_budget: 500000.00,
        allocated_budget: 350000.00,
        spent_budget: 150000.00,
        created_by: mockUserId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockBudget] } as any);

      const response = await request(app)
        .get(`/api/budgets/site/${mockSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', mockBudgetId);
      expect(response.body.data.total_budget).toBe(500000.00);
    });

    it('should return 404 if budget not found', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get(`/api/budgets/site/${mockSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Budget not found');
    });
  });

  describe('GET /api/budgets/site/:siteId/summary', () => {
    it('should get budget summary with categories', async () => {
      const mockBudget = {
        id: mockBudgetId,
        site_id: mockSiteId,
        company_id: mockCompanyId,
        total_budget: 500000.00,
        allocated_budget: 350000.00,
        spent_budget: 150000.00,
      };

      const mockCategories = [
        { id: '1', category_name: 'Labor', allocated_amount: 200000, spent_amount: 80000 },
        { id: '2', category_name: 'Materials', allocated_amount: 150000, spent_amount: 70000 },
      ];

      // Mock: Get budget
      mockDbQuery.mockResolvedValueOnce({ rows: [mockBudget] } as any);
      // Mock: Get categories
      mockDbQuery.mockResolvedValueOnce({ rows: mockCategories } as any);
      // Mock: Get total expenses
      mockDbQuery.mockResolvedValueOnce({ rows: [{ total: 150000 }] } as any);

      const response = await request(app)
        .get(`/api/budgets/site/${mockSiteId}/summary`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('budget');
      expect(response.body.data).toHaveProperty('categories');
      expect(response.body.data).toHaveProperty('total_expenses');
      expect(response.body.data).toHaveProperty('remaining_budget');
      expect(response.body.data.categories).toHaveLength(2);
    });
  });

  describe('PATCH /api/budgets/:id', () => {
    it('should update budget successfully', async () => {
      const updateData = {
        total_budget: 750000.00,
      };

      const mockBudget = {
        id: mockBudgetId,
        total_budget: 500000.00,
      };

      const mockUpdatedBudget = {
        ...mockBudget,
        total_budget: updateData.total_budget,
        updated_at: new Date(),
      };

      // Mock: Find budget
      mockDbQuery.mockResolvedValueOnce({ rows: [mockBudget] } as any);
      // Mock: Update budget
      mockDbQuery.mockResolvedValueOnce({ rows: [mockUpdatedBudget] } as any);

      const response = await request(app)
        .patch(`/api/budgets/${mockBudgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_budget).toBe(updateData.total_budget);
    });
  });

  describe('DELETE /api/budgets/:id', () => {
    it('should delete budget successfully', async () => {
      const mockBudget = {
        id: mockBudgetId,
        site_id: mockSiteId,
        company_id: mockCompanyId,
      };

      // Mock: Find budget
      mockDbQuery.mockResolvedValueOnce({ rows: [mockBudget] } as any);
      // Mock: Delete budget
      mockDbQuery.mockResolvedValueOnce({ rows: [{ id: mockBudgetId }] } as any);

      const response = await request(app)
        .delete(`/api/budgets/${mockBudgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Budget deleted successfully');
    });
  });

  // ============================================
  // CATEGORY TESTS
  // ============================================

  describe('POST /api/budgets/:budgetId/categories', () => {
    it('should create a new category', async () => {
      const categoryData = {
        category_name: 'Custom Equipment',
        description: 'Heavy equipment rentals',
        allocated_amount: 50000.00,
      };

      const mockBudget = {
        id: mockBudgetId,
        company_id: mockCompanyId,
      };

      const mockCategory = {
        id: mockCategoryId,
        site_budget_id: mockBudgetId,
        category_name: categoryData.category_name,
        description: categoryData.description,
        allocated_amount: categoryData.allocated_amount,
        spent_amount: 0,
        is_custom: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock: Find budget
      mockDbQuery.mockResolvedValueOnce({ rows: [mockBudget] } as any);
      // Mock: Create category
      mockDbQuery.mockResolvedValueOnce({ rows: [mockCategory] } as any);
      // Mock: Update budget totals (allocated)
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);
      // Mock: Update budget totals (spent)
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .post(`/api/budgets/${mockBudgetId}/categories`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category_name).toBe(categoryData.category_name);
      expect(response.body.data.allocated_amount).toBe(categoryData.allocated_amount);
    });
  });

  describe('GET /api/budgets/:budgetId/categories', () => {
    it('should get all categories for a budget', async () => {
      const mockBudget = {
        id: mockBudgetId,
        company_id: mockCompanyId,
      };

      const mockCategories = [
        { id: '1', category_name: 'Labor', allocated_amount: 200000 },
        { id: '2', category_name: 'Materials', allocated_amount: 150000 },
      ];

      // Mock: Find budget
      mockDbQuery.mockResolvedValueOnce({ rows: [mockBudget] } as any);
      // Mock: Get categories
      mockDbQuery.mockResolvedValueOnce({ rows: mockCategories } as any);

      const response = await request(app)
        .get(`/api/budgets/${mockBudgetId}/categories`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('PATCH /api/budgets/:budgetId/categories/:categoryId', () => {
    it('should update category successfully', async () => {
      const updateData = {
        allocated_amount: 250000.00,
      };

      const mockBudget = {
        id: mockBudgetId,
        company_id: mockCompanyId,
      };

      const mockCategory = {
        id: mockCategoryId,
        allocated_amount: 200000,
      };

      const mockUpdatedCategory = {
        ...mockCategory,
        allocated_amount: updateData.allocated_amount,
      };

      // Mock: Find budget
      mockDbQuery.mockResolvedValueOnce({ rows: [mockBudget] } as any);
      // Mock: Find category
      mockDbQuery.mockResolvedValueOnce({ rows: [mockCategory] } as any);
      // Mock: Update category
      mockDbQuery.mockResolvedValueOnce({ rows: [mockUpdatedCategory] } as any);
      // Mock: Update budget totals (allocated)
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);
      // Mock: Update budget totals (spent)
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .patch(`/api/budgets/${mockBudgetId}/categories/${mockCategoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.allocated_amount).toBe(updateData.allocated_amount);
    });
  });

  // ============================================
  // EXPENSE TESTS
  // ============================================

  describe('POST /api/budgets/:budgetId/expenses', () => {
    it('should create a new expense', async () => {
      const expenseData = {
        category_id: mockCategoryId,
        expense_name: 'Concrete Purchase',
        description: 'Concrete for foundation',
        amount: 5000.00,
        expense_date: '2024-01-15',
        vendor: 'ABC Concrete Co.',
      };

      const mockBudget = {
        id: mockBudgetId,
        company_id: mockCompanyId,
      };

      const mockCategory = {
        id: mockCategoryId,
        site_budget_id: mockBudgetId,
      };

      const mockExpense = {
        id: mockExpenseId,
        site_budget_id: mockBudgetId,
        category_id: expenseData.category_id,
        expense_name: expenseData.expense_name,
        description: expenseData.description,
        amount: expenseData.amount,
        expense_date: new Date(expenseData.expense_date),
        vendor: expenseData.vendor,
        receipt_url: null,
        created_by: mockUserId,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock: Find budget
      mockDbQuery.mockResolvedValueOnce({ rows: [mockBudget] } as any);
      // Mock: Find category
      mockDbQuery.mockResolvedValueOnce({ rows: [mockCategory] } as any);
      // Mock: Create expense
      mockDbQuery.mockResolvedValueOnce({ rows: [mockExpense] } as any);
      // Mock: Update category spent
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);
      // Mock: Update budget totals (allocated)
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);
      // Mock: Update budget totals (spent)
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .post(`/api/budgets/${mockBudgetId}/expenses`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.expense_name).toBe(expenseData.expense_name);
      expect(response.body.data.amount).toBe(expenseData.amount);
      expect(response.body.data.vendor).toBe(expenseData.vendor);
    });

    it('should fail with invalid expense date format', async () => {
      const expenseData = {
        expense_name: 'Test Expense',
        amount: 1000.00,
        expense_date: '15-01-2024', // Wrong format
      };

      const response = await request(app)
        .post(`/api/budgets/${mockBudgetId}/expenses`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/budgets/:budgetId/expenses', () => {
    it('should get all expenses with pagination', async () => {
      const mockBudget = {
        id: mockBudgetId,
        company_id: mockCompanyId,
      };

      const mockExpenses = [
        {
          id: '1',
          expense_name: 'Expense 1',
          amount: 5000,
          expense_date: new Date(),
          category_name: 'Materials',
        },
        {
          id: '2',
          expense_name: 'Expense 2',
          amount: 3000,
          expense_date: new Date(),
          category_name: 'Labor',
        },
      ];

      // Mock: Find budget
      mockDbQuery.mockResolvedValueOnce({ rows: [mockBudget] } as any);
      // Mock: Get count
      mockDbQuery.mockResolvedValueOnce({ rows: [{ count: '2' }] } as any);
      // Mock: Get expenses
      mockDbQuery.mockResolvedValueOnce({ rows: mockExpenses } as any);

      const response = await request(app)
        .get(`/api/budgets/${mockBudgetId}/expenses?page=1&limit=50`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.expenses).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should filter expenses by date range', async () => {
      const mockBudget = {
        id: mockBudgetId,
        company_id: mockCompanyId,
      };

      const mockExpenses = [
        {
          id: '1',
          expense_name: 'Expense 1',
          amount: 5000,
          expense_date: new Date('2024-01-15'),
        },
      ];

      // Mock: Find budget
      mockDbQuery.mockResolvedValueOnce({ rows: [mockBudget] } as any);
      // Mock: Get count
      mockDbQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] } as any);
      // Mock: Get expenses
      mockDbQuery.mockResolvedValueOnce({ rows: mockExpenses } as any);

      const response = await request(app)
        .get(`/api/budgets/${mockBudgetId}/expenses?start_date=2024-01-01&end_date=2024-01-31`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.expenses).toHaveLength(1);
    });
  });

  // ============================================
  // ANALYTICS TESTS
  // ============================================

  describe('GET /api/budgets/:budgetId/analytics', () => {
    it('should get budget analytics', async () => {
      const mockBudget = {
        id: mockBudgetId,
        company_id: mockCompanyId,
        total_budget: 500000,
      };

      const mockCategoryBreakdown = [
        { category_name: 'Labor', allocated_amount: 200000, spent_amount: 80000, remaining_amount: 120000, utilization_percentage: 40, is_custom: false },
        { category_name: 'Materials', allocated_amount: 150000, spent_amount: 70000, remaining_amount: 80000, utilization_percentage: 46.67, is_custom: false },
      ];

      const mockMonthlyExpenses = [
        { month: 'Jan', year: 2024, total_spent: 50000, expense_count: 10 },
        { month: 'Feb', year: 2024, total_spent: 75000, expense_count: 15 },
      ];

      const mockTopVendors = [
        { vendor: 'ABC Concrete Co.', total_spent: 25000, expense_count: 5 },
        { vendor: 'XYZ Steel Inc.', total_spent: 20000, expense_count: 3 },
      ];

      // Mock: Find budget
      mockDbQuery.mockResolvedValueOnce({ rows: [mockBudget] } as any);
      // Mock: Get total expenses
      mockDbQuery.mockResolvedValueOnce({ rows: [{ total: 150000 }] } as any);
      // Mock: Get category breakdown
      mockDbQuery.mockResolvedValueOnce({ rows: mockCategoryBreakdown } as any);
      // Mock: Get monthly expenses
      mockDbQuery.mockResolvedValueOnce({ rows: mockMonthlyExpenses } as any);
      // Mock: Get top vendors
      mockDbQuery.mockResolvedValueOnce({ rows: mockTopVendors } as any);

      const response = await request(app)
        .get(`/api/budgets/${mockBudgetId}/analytics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_budget');
      expect(response.body.data).toHaveProperty('total_spent');
      expect(response.body.data).toHaveProperty('total_remaining');
      expect(response.body.data).toHaveProperty('utilization_percentage');
      expect(response.body.data).toHaveProperty('category_breakdown');
      expect(response.body.data).toHaveProperty('monthly_expenses');
      expect(response.body.data).toHaveProperty('top_vendors');
      expect(response.body.data.category_breakdown).toHaveLength(2);
    });
  });
});



