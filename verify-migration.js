require('dotenv').config();
const { Client } = require('pg');

async function verify() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'check_in_logs' 
      ORDER BY ordinal_position
    `);

    console.log('✅ check_in_logs table structure:');
    console.table(result.rows);

    // Check indexes
    const indexes = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'check_in_logs'
    `);

    console.log('\n✅ Indexes created:');
    console.table(indexes.rows);

  } catch (err) {
    console.error('❌ Verification failed:', err.message);
  } finally {
    await client.end();
  }
}

verify();
