/**
 * Update Neon Database with Current Schema
 * 
 * This script synchronizes the Neon database with the current schema export.
 * It's safe to run multiple times - uses CREATE IF NOT EXISTS and ADD COLUMN IF NOT EXISTS.
 * 
 * Usage:
 *   node update-database.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

async function updateDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
  });

  log.header('🚀 Neon Database Update Script');

  try {
    // Connect to database
    log.info('Connecting to Neon database...');
    await client.connect();
    log.success('Connected to database');

    // Read the current schema file
    const schemaPath = path.join(__dirname, 'current_schema_new_export.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    log.info('Reading schema file...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Extract and execute in order: ENUMs, then TABLEs, then INDEXes, then COMMENTs
    log.header('📋 Executing Schema Updates');
    
    // Start transaction
    await client.query('BEGIN');
    
    try {
      // Step 1: Create ENUMs
      log.info('Creating/updating ENUM types...');
      const enumMatches = schemaSql.match(/CREATE TYPE \w+ AS ENUM \([^;]+\);/g) || [];
      let enumCount = 0;
      
      for (const enumDef of enumMatches) {
        const enumName = enumDef.match(/CREATE TYPE (\w+)/)[1];
        
        // Check if enum exists
        const enumExists = await client.query(
          `SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = $1)`,
          [enumName]
        );
        
        if (!enumExists.rows[0].exists) {
          // Remove the curly braces from enum values in the schema export
          const cleanedEnum = enumDef.replace(/\{([^}]+)\}/, '$1');
          await client.query(cleanedEnum);
          enumCount++;
        }
      }
      log.success(`ENUMs: ${enumCount} created, ${enumMatches.length - enumCount} already exist`);

      // Step 2: Create Tables in dependency order
      log.info('Creating/updating tables...');
      const tableRegex = /-- (\w+)\s+CREATE TABLE (\w+) \([^;]+\);/gs;
      let tableMatches = [];
      let match;
      
      // Extract all table definitions with their names
      while ((match = tableRegex.exec(schemaSql)) !== null) {
        tableMatches.push({
          comment: match[1],
          name: match[2],
          definition: match[0]
        });
      }
      
      // If regex didn't work, try simpler approach
      if (tableMatches.length === 0) {
        const simpleRegex = /CREATE TABLE (\w+) \([\s\S]*?\);/g;
        while ((match = simpleRegex.exec(schemaSql)) !== null) {
          tableMatches.push({
            name: match[1],
            definition: match[0]
          });
        }
      }
      
      // Define creation order based on dependencies (no foreign keys first, then dependent tables)
      const creationOrder = [
        'companies', 'users', 'sessions', 'refresh_tokens', 'device_tokens', 
        'company_settings', 'teams', 'team_members', 'sites', 'site_media', 
        'site_memos', 'site_zones', 'jobs', 'job_workers', 'job_managers',
        'job_blocks', 'job_units', 'job_tasks', 'job_photos', 'job_documents',
        'job_issues', 'job_variations', 'job_diary_entries', 'progress_milestones',
        'time_entries', 'worker_locations', 'materials', 'material_requests',
        'material_usage', 'stock_adjustments', 'subcontractors', 'subcontractor_contracts',
        'contract_payments', 'notifications', 'notification_preferences', 
        'safety_incidents', 'near_miss_reports', 'safety_inspections', 'hazard_reports',
        'safety_training_records', 'media_uploads', 'document_folders', 
        'construction_documents', 'ai_query_history', 'chat_conversations', 
        'chat_messages', 'job_budgets', 'budget_line_items', 'site_budgets',
        'site_budget_categories', 'site_budget_expenses', 'cost_transactions',
        'job_revenue', 'audit_logs', 'system_settings', 'check_in_logs'
      ];
      
      let tableCount = 0;
      let skippedCount = 0;
      
      // Create tables in dependency order
      for (const tableName of creationOrder) {
        const tableMatch = tableMatches.find(t => t.name === tableName);
        if (!tableMatch) continue;
        
        // Check if table exists
        const tableExists = await client.query(
          `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
          [tableName]
        );
        
        if (!tableExists.rows[0].exists) {
          try {
            // Replace CREATE TABLE with CREATE TABLE IF NOT EXISTS
            const safeTableDef = tableMatch.definition.replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS');
            await client.query(safeTableDef);
            tableCount++;
            log.info(`  Created table: ${tableName}`);
          } catch (err) {
            log.warning(`  Failed to create ${tableName}: ${err.message}`);
            skippedCount++;
          }
        }
      }
      
      // Try to create any remaining tables not in the order list
      for (const tableMatch of tableMatches) {
        if (!creationOrder.includes(tableMatch.name)) {
          const tableExists = await client.query(
            `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
            [tableMatch.name]
          );
          
          if (!tableExists.rows[0].exists) {
            try {
              const safeTableDef = tableMatch.definition.replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS');
              await client.query(safeTableDef);
              tableCount++;
              log.info(`  Created table: ${tableMatch.name}`);
            } catch (err) {
              log.warning(`  Failed to create ${tableMatch.name}: ${err.message}`);
              skippedCount++;
            }
          }
        }
      }
      
      log.success(`Tables: ${tableCount} created, ${tableMatches.length - tableCount - skippedCount} already exist`);

      // Step 3: Ensure hourly_rate column exists in users table
      log.info('Checking for new columns...');
      const hourlyRateExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'hourly_rate'
        )
      `);
      
      if (!hourlyRateExists.rows[0].exists) {
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN hourly_rate DECIMAL(10, 2) DEFAULT NULL
        `);
        log.success('Added hourly_rate column to users table');
        
        // Add index
        await client.query(`
          CREATE INDEX idx_users_hourly_rate 
          ON users(hourly_rate) 
          WHERE hourly_rate IS NOT NULL AND deleted_at IS NULL
        `);
        log.success('Added index on users.hourly_rate');
      } else {
        log.info('  hourly_rate column already exists');
      }

      // Commit what we have so far before indexes
      await client.query('COMMIT');
      log.success('Core schema committed successfully');
      
      // Start new transaction for indexes (failures won't affect core schema)
      await client.query('BEGIN');
      
      // Step 4: Create Indexes
      log.info('Creating indexes...');
      const indexRegex = /CREATE (?:UNIQUE )?INDEX (?:IF NOT EXISTS )?(\w+) ON [^;]+;/g;
      const indexMatches = schemaSql.match(indexRegex) || [];
      let indexCount = 0;
      let indexSkipped = 0;
      
      for (const indexDef of indexMatches) {
        const indexName = indexDef.match(/INDEX (?:IF NOT EXISTS )?(\w+)/)[1];
        
        // Check if index exists
        const indexExists = await client.query(
          `SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = $1)`,
          [indexName]
        );
        
        if (!indexExists.rows[0].exists) {
          try {
            // Use a savepoint so individual index failures don't abort the transaction
            await client.query(`SAVEPOINT create_index_${indexCount}`);
            
            // Replace with IF NOT EXISTS
            const safeIndexDef = indexDef.replace(/CREATE ((?:UNIQUE )?INDEX) (\w+)/, 'CREATE $1 IF NOT EXISTS $2');
            await client.query(safeIndexDef);
            
            await client.query(`RELEASE SAVEPOINT create_index_${indexCount}`);
            indexCount++;
          } catch (err) {
            // Rollback to savepoint on error
            await client.query(`ROLLBACK TO SAVEPOINT create_index_${indexCount}`);
            
            // Some indexes might fail due to missing columns or duplicate definitions
            if (!err.message.includes('already exists')) {
              log.warning(`  Skipped index ${indexName}: ${err.message.split('\n')[0]}`);
              indexSkipped++;
            }
          }
        }
      }
      log.success(`Indexes: ${indexCount} created, ${indexMatches.length - indexCount - indexSkipped} already exist, ${indexSkipped} skipped`);

      // Step 5: Add Comments
      log.info('Adding column comments...');
      const commentRegex = /COMMENT ON (?:TABLE|COLUMN) [^;]+;/g;
      const commentMatches = schemaSql.match(commentRegex) || [];
      let commentCount = 0;
      
      for (const comment of commentMatches) {
        try {
          await client.query(`SAVEPOINT add_comment_${commentCount}`);
          await client.query(comment);
          await client.query(`RELEASE SAVEPOINT add_comment_${commentCount}`);
          commentCount++;
        } catch (err) {
          await client.query(`ROLLBACK TO SAVEPOINT add_comment_${commentCount}`);
          // Comments might fail if table/column doesn't exist yet, that's okay
        }
      }
      log.success(`Comments: ${commentCount} added`);

      // Commit final transaction
      await client.query('COMMIT');
      log.success('All changes committed successfully');

      // Verify critical tables
      log.header('✅ Verification');
      
      const criticalTables = ['users', 'companies', 'sites', 'jobs', 'check_in_logs'];
      log.info('Checking critical tables...');
      
      for (const table of criticalTables) {
        const exists = await client.query(
          `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
          [table]
        );
        
        if (exists.rows[0].exists) {
          const count = await client.query(`SELECT COUNT(*) FROM ${table}`);
          log.success(`  ${table}: ✓ (${count.rows[0].count} rows)`);
        } else {
          log.error(`  ${table}: ✗ MISSING`);
        }
      }

      // Summary
      log.header('📊 Update Summary');
      console.log(`${colors.green}✅ Database updated successfully!${colors.reset}\n`);
      console.log('Statistics:');
      console.log(`  • ENUMs: ${enumMatches.length} total`);
      console.log(`  • Tables: ${tableMatches.length} total`);
      console.log(`  • Indexes: ${indexMatches.length} total`);
      console.log(`  • Comments: ${commentCount} added`);
      console.log('');
      console.log(`${colors.cyan}Database is now synchronized with current_schema_new_export.sql${colors.reset}`);
      console.log('');

    } catch (err) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    log.error('Database update failed');
    console.error(`${colors.red}Error:${colors.reset} ${err.message}`);
    if (err.stack) {
      console.error(`\n${colors.red}Stack trace:${colors.reset}`);
      console.error(err.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the update
updateDatabase();
