const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration(migrationFile) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sql = fs.readFileSync(path.join(__dirname, 'migrations', migrationFile), 'utf8');
    console.log(`📄 Running migration: ${migrationFile}`);
    
    await client.query(sql);
    console.log('✅ Migration completed successfully!');
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

const migrationFile = process.argv[2] || 'add_job_id_to_expenses.sql';
runMigration(migrationFile);
