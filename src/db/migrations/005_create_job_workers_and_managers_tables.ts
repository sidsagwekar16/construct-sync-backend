/**
 * Migration: Create job_workers and job_managers tables
 * Date: 2024-01-19
 * Description: Creates many-to-many relationship tables for jobs and workers/managers
 *              Ensures all required ENUMs and indexes exist
 */

import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating job_workers and job_managers tables...\n');
    
    // ============================================
    // STEP 1: Create ENUMs if they don't exist
    // ============================================
    
    console.log('📋 Checking/creating ENUMs...');
    
    // User Roles
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM (
          'super_admin',
          'company_admin',
          'project_manager',
          'site_supervisor',
          'foreman',
          'worker',
          'subcontractor',
          'viewer'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('  ✅ user_role ENUM');

    // Team Member Roles
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE team_member_role AS ENUM (
          'lead',
          'member',
          'viewer'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('  ✅ team_member_role ENUM');

    // Site Status
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE site_status AS ENUM (
          'planning',
          'active',
          'on_hold',
          'completed',
          'archived'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('  ✅ site_status ENUM');

    // Job Status
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE job_status AS ENUM (
          'draft',
          'planned',
          'in_progress',
          'on_hold',
          'completed',
          'cancelled',
          'archived'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('  ✅ job_status ENUM');

    // Priority Level
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE priority_level AS ENUM (
          'low',
          'medium',
          'high',
          'urgent',
          'critical'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('  ✅ priority_level ENUM');

    // Task Status
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE task_status AS ENUM (
          'pending',
          'in_progress',
          'completed',
          'cancelled',
          'blocked'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('  ✅ task_status ENUM');

    // ============================================
    // STEP 2: Create job_workers table
    // ============================================
    
    console.log('\n📋 Creating job_workers table...');
    
    const jobWorkersExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'job_workers'
      );
    `);

    if (!jobWorkersExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE job_workers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(job_id, user_id)
        );
      `);
      console.log('  ✅ job_workers table created');
      
      // Create indexes
      await client.query(`
        CREATE INDEX idx_job_workers_job_id ON job_workers(job_id);
      `);
      await client.query(`
        CREATE INDEX idx_job_workers_user_id ON job_workers(user_id);
      `);
      console.log('  ✅ job_workers indexes created');
    } else {
      console.log('  ℹ️  job_workers table already exists');
    }

    // ============================================
    // STEP 3: Create job_managers table
    // ============================================
    
    console.log('\n📋 Creating job_managers table...');
    
    const jobManagersExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'job_managers'
      );
    `);

    if (!jobManagersExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE job_managers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(job_id, user_id)
        );
      `);
      console.log('  ✅ job_managers table created');
      
      // Create indexes
      await client.query(`
        CREATE INDEX idx_job_managers_job_id ON job_managers(job_id);
      `);
      await client.query(`
        CREATE INDEX idx_job_managers_user_id ON job_managers(user_id);
      `);
      console.log('  ✅ job_managers indexes created');
    } else {
      console.log('  ℹ️  job_managers table already exists');
    }

    // ============================================
    // STEP 4: Create teams and team_members tables if missing
    // ============================================
    
    console.log('\n📋 Checking teams table...');
    
    const teamsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'teams'
      );
    `);

    if (!teamsExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE teams (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          deleted_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('  ✅ teams table created');
      
      await client.query(`
        CREATE INDEX idx_teams_company_id ON teams(company_id);
      `);
      await client.query(`
        CREATE INDEX idx_teams_deleted_at ON teams(deleted_at);
      `);
      console.log('  ✅ teams indexes created');
    } else {
      console.log('  ℹ️  teams table already exists');
    }

    console.log('\n📋 Checking team_members table...');
    
    const teamMembersExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'team_members'
      );
    `);

    if (!teamMembersExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE team_members (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role team_member_role,
          deleted_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(team_id, user_id)
        );
      `);
      console.log('  ✅ team_members table created');
      
      await client.query(`
        CREATE INDEX idx_team_members_team_id ON team_members(team_id);
      `);
      await client.query(`
        CREATE INDEX idx_team_members_user_id ON team_members(user_id);
      `);
      await client.query(`
        CREATE INDEX idx_team_members_deleted_at ON team_members(deleted_at);
      `);
      console.log('  ✅ team_members indexes created');
    } else {
      console.log('  ℹ️  team_members table already exists');
    }

    // ============================================
    // STEP 5: Ensure job-related indexes exist
    // ============================================
    
    console.log('\n📋 Ensuring job indexes exist...');
    
    const jobIndexes = [
      { name: 'idx_jobs_company_id', sql: 'CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id)' },
      { name: 'idx_jobs_site_id', sql: 'CREATE INDEX IF NOT EXISTS idx_jobs_site_id ON jobs(site_id)' },
      { name: 'idx_jobs_assigned_to', sql: 'CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to ON jobs(assigned_to)' },
      { name: 'idx_jobs_created_by', sql: 'CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by)' },
      { name: 'idx_jobs_status', sql: 'CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)' },
      { name: 'idx_jobs_priority', sql: 'CREATE INDEX IF NOT EXISTS idx_jobs_priority ON jobs(priority)' },
      { name: 'idx_jobs_job_type', sql: 'CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type)' },
      { name: 'idx_jobs_job_number', sql: 'CREATE INDEX IF NOT EXISTS idx_jobs_job_number ON jobs(job_number)' },
      { name: 'idx_jobs_deleted_at', sql: 'CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at ON jobs(deleted_at)' },
    ];

    for (const index of jobIndexes) {
      try {
        await client.query(index.sql);
        console.log(`  ✅ ${index.name}`);
      } catch (error: any) {
        if (error.code === '42P07') { // duplicate_table (index already exists)
          console.log(`  ℹ️  ${index.name} already exists`);
        } else {
          console.warn(`  ⚠️  Could not create ${index.name}:`, error.message);
        }
      }
    }

    console.log('\n✅ All job_workers and job_managers migration completed successfully');
    
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
    
    console.log('Rolling back job_workers and job_managers tables...\n');
    
    // Drop tables in reverse order (respecting foreign key constraints)
    await client.query('DROP TABLE IF EXISTS job_managers CASCADE');
    console.log('  ✅ Dropped job_managers table');
    
    await client.query('DROP TABLE IF EXISTS job_workers CASCADE');
    console.log('  ✅ Dropped job_workers table');
    
    await client.query('DROP TABLE IF EXISTS team_members CASCADE');
    console.log('  ✅ Dropped team_members table');
    
    await client.query('DROP TABLE IF EXISTS teams CASCADE');
    console.log('  ✅ Dropped teams table');
    
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



