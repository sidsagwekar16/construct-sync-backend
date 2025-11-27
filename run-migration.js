const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sql = fs.readFileSync(path.join(__dirname, 'migrations', 'add_job_diaries_table.sql'), 'utf8');
    console.log('📄 Running migration: add_job_diaries_table.sql');
    
    await client.query(sql);
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Created table: job_diaries');
    console.log('Created indexes for performance');
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
