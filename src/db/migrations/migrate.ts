/**
 * Database Migration and Schema Verification Script
 * 
 * This script:
 * 1. Runs all pending migrations
 * 2. Verifies critical tables exist
 * 3. Reports schema status
 * 
 * Usage:
 *   npm run migrate        - Run all pending migrations
 *   npm run migrate:verify - Verify schema without running migrations
 */

import MigrationRunner from './run';
import { db } from '../connection';
import { logger } from '../../utils/logger';

interface TableCheck {
  name: string;
  exists: boolean;
  description: string;
}

class SchemaVerifier {
  /**
   * Check if a table exists
   */
  private async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [tableName]);
      return result.rows[0].exists;
    } catch (error) {
      logger.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
  }

  /**
   * Check if an ENUM type exists
   */
  private async enumExists(enumName: string): Promise<boolean> {
    try {
      const result = await db.query(`
        SELECT EXISTS (
          SELECT FROM pg_type 
          WHERE typname = $1
        );
      `, [enumName]);
      return result.rows[0].exists;
    } catch (error) {
      logger.error(`Error checking if ENUM ${enumName} exists:`, error);
      return false;
    }
  }

  /**
   * Verify critical database schema
   */
  async verifySchema(): Promise<void> {
    console.log('\n🔍 Verifying database schema...\n');

    // Critical tables to check
    const criticalTables: TableCheck[] = [
      { name: 'companies', exists: false, description: 'Core companies table' },
      { name: 'users', exists: false, description: 'Core users table' },
      { name: 'jobs', exists: false, description: 'Core jobs table' },
      { name: 'job_workers', exists: false, description: 'Job workers junction table' },
      { name: 'job_managers', exists: false, description: 'Job managers junction table' },
      { name: 'teams', exists: false, description: 'Teams table' },
      { name: 'team_members', exists: false, description: 'Team members junction table' },
      { name: 'sites', exists: false, description: 'Sites table' },
      { name: 'migrations', exists: false, description: 'Migration tracking table' },
    ];

    // Check each table
    for (const table of criticalTables) {
      table.exists = await this.tableExists(table.name);
      const status = table.exists ? '✅' : '❌';
      console.log(`  ${status} ${table.name.padEnd(20)} - ${table.description}`);
    }

    // Critical ENUMs to check
    const criticalEnums = [
      'user_role',
      'job_status',
      'priority_level',
      'site_status',
      'team_member_role',
      'task_status',
    ];

    console.log('\n🔍 Checking ENUMs...\n');
    for (const enumName of criticalEnums) {
      const exists = await this.enumExists(enumName);
      const status = exists ? '✅' : '❌';
      console.log(`  ${status} ${enumName}`);
    }

    // Check for missing critical tables
    const missingTables = criticalTables.filter(t => !t.exists);
    
    if (missingTables.length > 0) {
      console.log('\n⚠️  MISSING TABLES:');
      missingTables.forEach(t => console.log(`  - ${t.name}: ${t.description}`));
      console.log('\n💡 Run migrations to create missing tables: npm run migrate\n');
    } else {
      console.log('\n✅ All critical tables exist!\n');
    }

    // Get migration status
    try {
      const result = await db.query(`
        SELECT COUNT(*) as count 
        FROM migrations
      `);
      const count = parseInt(result.rows[0].count);
      console.log(`📊 Migrations executed: ${count}\n`);
      
      if (count > 0) {
        const lastMigration = await db.query(`
          SELECT name, executed_at 
          FROM migrations 
          ORDER BY id DESC 
          LIMIT 1
        `);
        console.log(`📝 Last migration: ${lastMigration.rows[0].name}`);
        console.log(`📅 Executed at: ${lastMigration.rows[0].executed_at}\n`);
      }
    } catch (error) {
      console.log('ℹ️  Migration tracking not initialized yet\n');
    }
  }

  /**
   * Get detailed job_workers table info
   */
  async checkJobWorkersTable(): Promise<void> {
    console.log('\n🔍 Detailed job_workers table check...\n');
    
    try {
      const exists = await this.tableExists('job_workers');
      
      if (!exists) {
        console.log('❌ job_workers table does NOT exist');
        console.log('💡 This is the table causing the error you\'re seeing');
        console.log('💡 Run: npm run migrate\n');
        return;
      }

      console.log('✅ job_workers table exists');

      // Get column info
      const columns = await db.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'job_workers'
        ORDER BY ordinal_position
      `);

      console.log('\n📋 Columns:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name.padEnd(15)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });

      // Get constraints
      const constraints = await db.query(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'job_workers'
      `);

      console.log('\n🔗 Constraints:');
      constraints.rows.forEach(con => {
        console.log(`  - ${con.constraint_name}: ${con.constraint_type}`);
      });

      // Get row count
      const count = await db.query(`SELECT COUNT(*) as count FROM job_workers`);
      console.log(`\n📊 Rows: ${count.rows[0].count}\n`);

    } catch (error: any) {
      console.error('❌ Error checking job_workers table:', error.message);
    }
  }
}

// Main execution
async function main() {
  const command = process.argv[2];

  try {
    if (command === 'verify' || command === '--verify' || command === '-v') {
      // Just verify schema without running migrations
      const verifier = new SchemaVerifier();
      await verifier.verifySchema();
      await verifier.checkJobWorkersTable();
      await db.close();
      process.exit(0);
    } else if (command === 'check-workers') {
      // Check job_workers table specifically
      const verifier = new SchemaVerifier();
      await verifier.checkJobWorkersTable();
      await db.close();
      process.exit(0);
    } else {
      // Run migrations
      console.log('🚀 Starting database migration process...\n');
      
      const runner = new MigrationRunner();
      await runner.runMigrations();
      
      // Verify after migration
      console.log('\n🔍 Verifying schema after migration...\n');
      const verifier = new SchemaVerifier();
      await verifier.verifySchema();
      await verifier.checkJobWorkersTable();
      
      await db.close();
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    await db.close();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { SchemaVerifier };

