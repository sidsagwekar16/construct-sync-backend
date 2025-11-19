/**
 * Migration: Create site_budgets tables
 * Date: 2024-01-20
 * Description: Creates site budgets, categories, and expenses tables
 *              Allows sites to track budgets, expenses, and custom categories
 */

import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating site budgets tables...\n');
    
    // ============================================
    // STEP 1: Create site_budgets table
    // ============================================
    
    console.log('📋 Creating site_budgets table...');
    
    const siteBudgetsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'site_budgets'
      );
    `);

    if (!siteBudgetsExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE site_budgets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          site_id UUID UNIQUE NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
          company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          total_budget DECIMAL(15, 2) NOT NULL DEFAULT 0,
          allocated_budget DECIMAL(15, 2) DEFAULT 0,
          spent_budget DECIMAL(15, 2) DEFAULT 0,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          deleted_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('  ✅ site_budgets table created');
      
      // Create indexes
      await client.query(`
        CREATE INDEX idx_site_budgets_site_id ON site_budgets(site_id);
      `);
      await client.query(`
        CREATE INDEX idx_site_budgets_company_id ON site_budgets(company_id);
      `);
      await client.query(`
        CREATE INDEX idx_site_budgets_deleted_at ON site_budgets(deleted_at);
      `);
      console.log('  ✅ site_budgets indexes created');
    } else {
      console.log('  ℹ️  site_budgets table already exists');
    }

    // ============================================
    // STEP 2: Create site_budget_categories table
    // ============================================
    
    console.log('\n📋 Creating site_budget_categories table...');
    
    const siteBudgetCategoriesExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'site_budget_categories'
      );
    `);

    if (!siteBudgetCategoriesExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE site_budget_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          site_budget_id UUID NOT NULL REFERENCES site_budgets(id) ON DELETE CASCADE,
          category_name VARCHAR(255) NOT NULL,
          description TEXT,
          allocated_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
          spent_amount DECIMAL(15, 2) DEFAULT 0,
          is_custom BOOLEAN DEFAULT false,
          deleted_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('  ✅ site_budget_categories table created');
      
      // Create indexes
      await client.query(`
        CREATE INDEX idx_site_budget_categories_site_budget_id ON site_budget_categories(site_budget_id);
      `);
      await client.query(`
        CREATE INDEX idx_site_budget_categories_deleted_at ON site_budget_categories(deleted_at);
      `);
      console.log('  ✅ site_budget_categories indexes created');
    } else {
      console.log('  ℹ️  site_budget_categories table already exists');
    }

    // ============================================
    // STEP 3: Create site_budget_expenses table
    // ============================================
    
    console.log('\n📋 Creating site_budget_expenses table...');
    
    const siteBudgetExpensesExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'site_budget_expenses'
      );
    `);

    if (!siteBudgetExpensesExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE site_budget_expenses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          site_budget_id UUID NOT NULL REFERENCES site_budgets(id) ON DELETE CASCADE,
          category_id UUID REFERENCES site_budget_categories(id) ON DELETE SET NULL,
          expense_name VARCHAR(255) NOT NULL,
          description TEXT,
          amount DECIMAL(15, 2) NOT NULL,
          expense_date DATE NOT NULL,
          vendor VARCHAR(255),
          receipt_url TEXT,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          deleted_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('  ✅ site_budget_expenses table created');
      
      // Create indexes
      await client.query(`
        CREATE INDEX idx_site_budget_expenses_site_budget_id ON site_budget_expenses(site_budget_id);
      `);
      await client.query(`
        CREATE INDEX idx_site_budget_expenses_category_id ON site_budget_expenses(category_id);
      `);
      await client.query(`
        CREATE INDEX idx_site_budget_expenses_expense_date ON site_budget_expenses(expense_date);
      `);
      await client.query(`
        CREATE INDEX idx_site_budget_expenses_deleted_at ON site_budget_expenses(deleted_at);
      `);
      console.log('  ✅ site_budget_expenses indexes created');
    } else {
      console.log('  ℹ️  site_budget_expenses table already exists');
    }

    console.log('\n✅ All site budgets migration completed successfully');
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const down = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Rolling back site budgets tables...\n');
    
    // Drop tables in reverse order (respecting foreign key constraints)
    await client.query('DROP TABLE IF EXISTS site_budget_expenses CASCADE');
    console.log('  ✅ Dropped site_budget_expenses table');
    
    await client.query('DROP TABLE IF EXISTS site_budget_categories CASCADE');
    console.log('  ✅ Dropped site_budget_categories table');
    
    await client.query('DROP TABLE IF EXISTS site_budgets CASCADE');
    console.log('  ✅ Dropped site_budgets table');
    
    console.log('\n✅ Rollback completed successfully');
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

