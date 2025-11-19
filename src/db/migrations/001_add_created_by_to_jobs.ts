/**
 * Migration: Add created_by column to jobs table
 * Date: 2024-01-15
 * Description: Adds the created_by column to track who created each job
 */

import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if the column already exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'jobs' 
      AND column_name = 'created_by'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('Adding created_by column to jobs table...');
      
      // Add the column as nullable first
      await client.query(`
        ALTER TABLE jobs 
        ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL
      `);
      
      // Update existing rows with a default value (first admin/manager of the company)
      await client.query(`
        UPDATE jobs 
        SET created_by = (
          SELECT u.id 
          FROM users u 
          WHERE u.company_id = jobs.company_id 
          AND u.role IN ('company_admin', 'project_manager', 'super_admin')
          ORDER BY u.created_at ASC
          LIMIT 1
        )
        WHERE created_by IS NULL
      `);
      
      // Make the column NOT NULL
      await client.query(`
        ALTER TABLE jobs 
        ALTER COLUMN created_by SET NOT NULL
      `);
      
      console.log('✅ Successfully added created_by column to jobs table');
    } else {
      console.log('ℹ️  Column created_by already exists in jobs table');
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
    
    console.log('Removing created_by column from jobs table...');
    
    await client.query(`
      ALTER TABLE jobs 
      DROP COLUMN IF EXISTS created_by
    `);
    
    console.log('✅ Successfully removed created_by column from jobs table');
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

