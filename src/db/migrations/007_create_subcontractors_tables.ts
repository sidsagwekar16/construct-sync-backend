/**
 * Migration: Create subcontractors tables
 * Date: 2024-01-21
 * Description: Creates subcontractors, subcontractor_contracts, and contract_payments tables
 */

import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating subcontractors tables...\n');
    
    // ============================================
    // STEP 1: Create contract_status enum if not exists
    // ============================================
    
    console.log('📋 Creating contract_status enum...');
    
    const contractStatusExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = 'contract_status'
      );
    `);

    if (!contractStatusExists.rows[0].exists) {
      await client.query(`
        CREATE TYPE contract_status AS ENUM (
          'draft',
          'active',
          'completed',
          'terminated',
          'expired'
        );
      `);
      console.log('  ✅ contract_status enum created');
    } else {
      console.log('  ℹ️  contract_status enum already exists');
    }

    // ============================================
    // STEP 2: Create payment_method enum if not exists
    // ============================================
    
    console.log('\n📋 Creating payment_method enum...');
    
    const paymentMethodExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = 'payment_method'
      );
    `);

    if (!paymentMethodExists.rows[0].exists) {
      await client.query(`
        CREATE TYPE payment_method AS ENUM (
          'cash',
          'check',
          'bank_transfer',
          'credit_card',
          'eft',
          'other'
        );
      `);
      console.log('  ✅ payment_method enum created');
    } else {
      console.log('  ℹ️  payment_method enum already exists');
    }
    
    // ============================================
    // STEP 3: Create subcontractors table
    // ============================================
    
    console.log('\n📋 Creating subcontractors table...');
    
    const subcontractorsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'subcontractors'
      );
    `);

    if (!subcontractorsExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE subcontractors (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          business_name VARCHAR(255),
          abn VARCHAR(50),
          email VARCHAR(255),
          phone VARCHAR(50),
          address TEXT,
          trade VARCHAR(100),
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          deleted_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('  ✅ subcontractors table created');
      
      // Create indexes
      await client.query(`
        CREATE INDEX idx_subcontractors_company_id ON subcontractors(company_id);
      `);
      await client.query(`
        CREATE INDEX idx_subcontractors_name ON subcontractors(name);
      `);
      await client.query(`
        CREATE INDEX idx_subcontractors_trade ON subcontractors(trade);
      `);
      await client.query(`
        CREATE INDEX idx_subcontractors_is_active ON subcontractors(is_active);
      `);
      await client.query(`
        CREATE INDEX idx_subcontractors_deleted_at ON subcontractors(deleted_at);
      `);
      console.log('  ✅ subcontractors indexes created');
    } else {
      console.log('  ℹ️  subcontractors table already exists');
    }

    // ============================================
    // STEP 4: Create subcontractor_contracts table
    // ============================================
    
    console.log('\n📋 Creating subcontractor_contracts table...');
    
    const contractsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'subcontractor_contracts'
      );
    `);

    if (!contractsExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE subcontractor_contracts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          subcontractor_id UUID NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
          job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
          contract_number VARCHAR(100),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          contract_value DECIMAL(15, 2),
          start_date DATE,
          end_date DATE,
          completion_date DATE,
          status contract_status DEFAULT 'draft',
          progress_percentage DECIMAL(5, 2) DEFAULT 0,
          payment_terms TEXT,
          notes TEXT,
          deleted_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('  ✅ subcontractor_contracts table created');
      
      // Create indexes
      await client.query(`
        CREATE INDEX idx_subcontractor_contracts_company_id ON subcontractor_contracts(company_id);
      `);
      await client.query(`
        CREATE INDEX idx_subcontractor_contracts_subcontractor_id ON subcontractor_contracts(subcontractor_id);
      `);
      await client.query(`
        CREATE INDEX idx_subcontractor_contracts_job_id ON subcontractor_contracts(job_id);
      `);
      await client.query(`
        CREATE INDEX idx_subcontractor_contracts_status ON subcontractor_contracts(status);
      `);
      await client.query(`
        CREATE INDEX idx_subcontractor_contracts_contract_number ON subcontractor_contracts(contract_number);
      `);
      await client.query(`
        CREATE INDEX idx_subcontractor_contracts_deleted_at ON subcontractor_contracts(deleted_at);
      `);
      console.log('  ✅ subcontractor_contracts indexes created');
    } else {
      console.log('  ℹ️  subcontractor_contracts table already exists');
    }

    // ============================================
    // STEP 5: Create contract_payments table
    // ============================================
    
    console.log('\n📋 Creating contract_payments table...');
    
    const paymentsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'contract_payments'
      );
    `);

    if (!paymentsExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE contract_payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          contract_id UUID NOT NULL REFERENCES subcontractor_contracts(id) ON DELETE CASCADE,
          amount DECIMAL(15, 2) NOT NULL,
          payment_date DATE,
          payment_method payment_method,
          reference_number VARCHAR(255),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('  ✅ contract_payments table created');
      
      // Create indexes
      await client.query(`
        CREATE INDEX idx_contract_payments_contract_id ON contract_payments(contract_id);
      `);
      await client.query(`
        CREATE INDEX idx_contract_payments_payment_date ON contract_payments(payment_date);
      `);
      console.log('  ✅ contract_payments indexes created');
    } else {
      console.log('  ℹ️  contract_payments table already exists');
    }

    console.log('\n✅ All subcontractors migration completed successfully');
    
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
    
    console.log('Rolling back subcontractors tables...\n');
    
    // Drop tables in reverse order (respecting foreign key constraints)
    await client.query('DROP TABLE IF EXISTS contract_payments CASCADE');
    console.log('  ✅ Dropped contract_payments table');
    
    await client.query('DROP TABLE IF EXISTS subcontractor_contracts CASCADE');
    console.log('  ✅ Dropped subcontractor_contracts table');
    
    await client.query('DROP TABLE IF EXISTS subcontractors CASCADE');
    console.log('  ✅ Dropped subcontractors table');
    
    await client.query('DROP TYPE IF EXISTS payment_method CASCADE');
    console.log('  ✅ Dropped payment_method enum');
    
    await client.query('DROP TYPE IF EXISTS contract_status CASCADE');
    console.log('  ✅ Dropped contract_status enum');
    
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



