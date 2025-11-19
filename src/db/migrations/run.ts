/**
 * Migration Runner
 * Manages database migrations with tracking
 */

import { Pool } from 'pg';
import { env } from '../../config/env';
import * as fs from 'fs';
import * as path from 'path';

interface Migration {
  id: number;
  name: string;
  executed_at: Date;
}

class MigrationRunner {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: env.database.url,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Initialize migrations table
   */
  private async initMigrationsTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Migrations table initialized');
  }

  /**
   * Get executed migrations
   */
  private async getExecutedMigrations(): Promise<string[]> {
    const result = await this.pool.query<Migration>(`
      SELECT name FROM migrations ORDER BY id ASC
    `);
    return result.rows.map(row => row.name);
  }

  /**
   * Record migration execution
   */
  private async recordMigration(name: string): Promise<void> {
    await this.pool.query(`
      INSERT INTO migrations (name) VALUES ($1)
    `, [name]);
  }

  /**
   * Get pending migrations
   */
  private async getPendingMigrations(): Promise<string[]> {
    const migrationsDir = path.join(__dirname);
    // Look for .js files in production (compiled) or .ts files in development
    const files = fs.readdirSync(migrationsDir)
      .filter(file => {
        const isTypeScript = file.endsWith('.ts') && file !== 'run.ts' && file !== 'migrate.ts';
        const isJavaScript = file.endsWith('.js') && file !== 'run.js' && file !== 'migrate.js';
        return isTypeScript || isJavaScript;
      })
      .sort();

    const executed = await this.getExecutedMigrations();
    return files.filter(file => !executed.includes(file));
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    try {
      console.log('🔄 Starting migration process...\n');
      
      // Initialize migrations table
      await this.initMigrationsTable();

      // Get pending migrations
      const pending = await this.getPendingMigrations();

      if (pending.length === 0) {
        console.log('✅ No pending migrations\n');
        return;
      }

      console.log(`Found ${pending.length} pending migration(s):\n`);

      // Run each migration
      for (const file of pending) {
        console.log(`\n📦 Running migration: ${file}`);
        
        try {
          // Fix Windows path for ESM imports
          const migrationPath = path.join(__dirname, file).replace(/\\/g, '/');
          const fileUrl = `file:///${migrationPath}`;
          const migration = await import(fileUrl);
          
          if (typeof migration.up !== 'function') {
            throw new Error(`Migration ${file} does not export an 'up' function`);
          }

          await migration.up(this.pool);
          await this.recordMigration(file);
          
          console.log(`✅ Migration ${file} completed successfully`);
        } catch (error) {
          console.error(`❌ Migration ${file} failed:`, error);
          throw error;
        }
      }

      console.log('\n✅ All migrations completed successfully\n');
    } catch (error) {
      console.error('❌ Migration process failed:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  /**
   * Rollback last migration
   */
  async rollback(): Promise<void> {
    try {
      console.log('🔄 Starting rollback process...\n');
      
      const executed = await this.getExecutedMigrations();
      
      if (executed.length === 0) {
        console.log('ℹ️  No migrations to rollback\n');
        return;
      }

      const lastMigration = executed[executed.length - 1];
      console.log(`\n📦 Rolling back migration: ${lastMigration}`);

      // Fix Windows path for ESM imports
      const migrationPath = path.join(__dirname, lastMigration).replace(/\\/g, '/');
      const fileUrl = `file:///${migrationPath}`;
      const migration = await import(fileUrl);
      
      if (typeof migration.down !== 'function') {
        throw new Error(`Migration ${lastMigration} does not export a 'down' function`);
      }

      await migration.down(this.pool);
      
      await this.pool.query(`
        DELETE FROM migrations WHERE name = $1
      `, [lastMigration]);
      
      console.log(`✅ Migration ${lastMigration} rolled back successfully\n`);
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }
}

// Run migrations if called directly
if (require.main === module) {
  const runner = new MigrationRunner();
  const command = process.argv[2];

  if (command === 'rollback') {
    runner.rollback()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    runner.runMigrations()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

export default MigrationRunner;

