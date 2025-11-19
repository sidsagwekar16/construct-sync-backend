/**
 * Migration: Add radius column to sites table
 * Date: 2024-01-15
 * Description: Adds geofence radius column to sites table for location-based tracking
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
      WHERE table_name = 'sites' 
      AND column_name = 'radius'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('Adding radius column to sites table...');
      
      // Add the column with default value of 100.00 meters
      await client.query(`
        ALTER TABLE sites 
        ADD COLUMN radius DECIMAL(10, 2) DEFAULT 100.00
      `);
      
      // Update any existing sites to have the default radius
      await client.query(`
        UPDATE sites 
        SET radius = 100.00 
        WHERE radius IS NULL
      `);
      
      console.log('✅ Successfully added radius column to sites table');
    } else {
      console.log('ℹ️  Column radius already exists in sites table');
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
    
    console.log('Removing radius column from sites table...');
    
    await client.query(`
      ALTER TABLE sites 
      DROP COLUMN IF EXISTS radius
    `);
    
    console.log('✅ Successfully removed radius column from sites table');
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

