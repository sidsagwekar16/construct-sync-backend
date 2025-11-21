/**
 * Migration: Ensure all jobs table columns exist
 * Date: 2024-01-15
 * Description: Comprehensive migration to add any missing columns to jobs table
 */

import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Checking and adding missing columns to jobs table...\n');
    
    // Define all expected columns with their specifications
    const expectedColumns = [
      { name: 'job_number', type: 'VARCHAR(100)', nullable: true },
      { name: 'description', type: 'TEXT', nullable: true },
      { name: 'job_type', type: 'VARCHAR(100)', nullable: true },
      { name: 'status', type: 'job_status', nullable: true },
      { name: 'priority', type: 'priority_level', nullable: true },
      { name: 'start_date', type: 'TIMESTAMP', nullable: true },
      { name: 'end_date', type: 'TIMESTAMP', nullable: true },
      { name: 'completed_date', type: 'TIMESTAMP', nullable: true },
      { name: 'assigned_to', type: 'UUID', nullable: true, references: 'users(id) ON DELETE SET NULL' },
      { name: 'created_by', type: 'UUID', nullable: false, references: 'users(id) ON DELETE SET NULL' },
      { name: 'deleted_at', type: 'TIMESTAMP', nullable: true },
      { name: 'created_at', type: 'TIMESTAMP', nullable: false, default: 'CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'TIMESTAMP', nullable: false, default: 'CURRENT_TIMESTAMP' },
    ];
    
    // Get existing columns
    const existingColumnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'jobs'
    `);
    
    const existingColumns = new Set(existingColumnsResult.rows.map(row => row.column_name));
    
    // Check and add missing columns
    for (const col of expectedColumns) {
      if (!existingColumns.has(col.name)) {
        console.log(`  ➕ Adding missing column: ${col.name}`);
        
        let alterQuery = `ALTER TABLE jobs ADD COLUMN ${col.name} ${col.type}`;
        
        // Add references if specified
        if (col.references) {
          alterQuery += ` REFERENCES ${col.references}`;
        }
        
        // Add default if specified
        if (col.default) {
          alterQuery += ` DEFAULT ${col.default}`;
        }
        
        // Add column as nullable first
        await client.query(alterQuery);
        
        // If column should be NOT NULL and has special handling
        if (!col.nullable) {
          if (col.name === 'created_by') {
            // Set default value for created_by
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
          }
          
          // Make column NOT NULL if it doesn't have a default
          if (!col.default) {
            await client.query(`
              ALTER TABLE jobs 
              ALTER COLUMN ${col.name} SET NOT NULL
            `);
          }
        }
        
        console.log(`  ✅ Successfully added ${col.name}`);
      } else {
        console.log(`  ℹ️  Column ${col.name} already exists`);
      }
    }
    
    console.log('\n✅ All required columns verified/added to jobs table');
    
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
    
    console.log('Removing optional columns from jobs table...');
    
    // Only remove columns that were added, not core columns
    const columnsToRemove = [
      'job_number',
      'description',
      'job_type',
      'status',
      'priority',
      'start_date',
      'end_date',
      'completed_date',
      'assigned_to',
      'deleted_at',
    ];
    
    for (const col of columnsToRemove) {
      await client.query(`
        ALTER TABLE jobs 
        DROP COLUMN IF EXISTS ${col}
      `);
    }
    
    console.log('✅ Successfully removed optional columns from jobs table');
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};



