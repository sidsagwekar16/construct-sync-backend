/**
 * Migration: Add job_type column to jobs table
 * Date: 2024-01-15
 * Description: Adds the job_type column to categorize jobs
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
      AND column_name = 'job_type'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('Adding job_type column to jobs table...');
      
      // Add the column as nullable VARCHAR(100)
      await client.query(`
        ALTER TABLE jobs 
        ADD COLUMN job_type VARCHAR(100)
      `);
      
      console.log('✅ Successfully added job_type column to jobs table');
    } else {
      console.log('ℹ️  Column job_type already exists in jobs table');
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
    
    console.log('Removing job_type column from jobs table...');
    
    await client.query(`
      ALTER TABLE jobs 
      DROP COLUMN IF EXISTS job_type
    `);
    
    console.log('✅ Successfully removed job_type column from jobs table');
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

