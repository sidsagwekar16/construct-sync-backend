/**
 * Migration: Add company_id to subcontractor_contracts
 * Date: 2024-01-22
 * Description: Adds company_id column to existing subcontractor_contracts table
 */

import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Adding company_id to subcontractor_contracts table...\n');
    
    // First, check what columns exist in the table
    console.log('📋 Checking existing columns in subcontractor_contracts...');
    const existingColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'subcontractor_contracts'
      ORDER BY ordinal_position;
    `);
    console.log('  Existing columns:', existingColumns.rows.map(r => r.column_name).join(', '));
    
    // Check if column exists
    const columnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'subcontractor_contracts' 
        AND column_name = 'company_id'
      );
    `);

    if (!columnExists.rows[0].exists) {
      // Add company_id column
      console.log('📋 Adding company_id column...');
      await client.query(`
        ALTER TABLE subcontractor_contracts 
        ADD COLUMN company_id UUID;
      `);
      console.log('  ✅ company_id column added');
      
      // Check if subcontractor_id exists
      const subcontractorIdExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'subcontractor_contracts' 
          AND column_name = 'subcontractor_id'
        );
      `);
      
      // Only populate if subcontractor_id column exists
      if (subcontractorIdExists.rows[0].exists) {
        // Set company_id from subcontractor's company_id for existing records
        console.log('📋 Populating company_id from subcontractors...');
        await client.query(`
          UPDATE subcontractor_contracts sc
          SET company_id = s.company_id
          FROM subcontractors s
          WHERE sc.subcontractor_id = s.id
          AND sc.company_id IS NULL;
        `);
        console.log('  ✅ company_id populated for existing records');
      } else {
        console.log('  ⚠️  subcontractor_id column not found, skipping population');
        console.log('  ℹ️  Existing records will need company_id set manually or will be deleted');
        
        // Delete any existing records since we can't populate company_id
        const deleteResult = await client.query(`
          DELETE FROM subcontractor_contracts WHERE company_id IS NULL;
        `);
        console.log(`  ✅ Deleted ${deleteResult.rowCount} orphaned records`);
      }
      
      // Make column NOT NULL
      console.log('📋 Making company_id NOT NULL...');
      await client.query(`
        ALTER TABLE subcontractor_contracts 
        ALTER COLUMN company_id SET NOT NULL;
      `);
      console.log('  ✅ company_id set to NOT NULL');
      
      // Add foreign key constraint
      console.log('📋 Adding foreign key constraint...');
      await client.query(`
        ALTER TABLE subcontractor_contracts 
        ADD CONSTRAINT subcontractor_contracts_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
      `);
      console.log('  ✅ Foreign key constraint added');
      
      // Create index if it doesn't exist
      console.log('📋 Creating index on company_id...');
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_subcontractor_contracts_company_id 
        ON subcontractor_contracts(company_id);
      `);
      console.log('  ✅ Index created');
      
      console.log('\n✅ Migration completed successfully');
    } else {
      console.log('  ℹ️  company_id column already exists');
    }
    
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
    
    console.log('Removing company_id from subcontractor_contracts table...\n');
    
    // Drop foreign key constraint
    await client.query(`
      ALTER TABLE subcontractor_contracts 
      DROP CONSTRAINT IF EXISTS subcontractor_contracts_company_id_fkey;
    `);
    console.log('  ✅ Foreign key constraint dropped');
    
    // Drop index
    await client.query(`
      DROP INDEX IF EXISTS idx_subcontractor_contracts_company_id;
    `);
    console.log('  ✅ Index dropped');
    
    // Drop column
    await client.query(`
      ALTER TABLE subcontractor_contracts 
      DROP COLUMN IF EXISTS company_id;
    `);
    console.log('  ✅ company_id column dropped');
    
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

