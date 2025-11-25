const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'Aniruddh@1',
  database: 'constructsync'
});

async function checkSchema() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if users table has hourly_rate column
    console.log('📋 Checking users table schema...');
    const usersSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    console.log('\n👤 USERS TABLE COLUMNS:');
    usersSchema.rows.forEach(col => {
      console.log(`  - ${col.column_name.padEnd(20)} ${col.data_type.padEnd(25)} NULL: ${col.is_nullable}`);
    });

    // Check if check_in_logs table exists and has all columns
    console.log('\n📋 Checking check_in_logs table schema...');
    const checkInSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'check_in_logs'
      ORDER BY ordinal_position;
    `);
    
    if (checkInSchema.rows.length === 0) {
      console.log('❌ check_in_logs table does NOT exist!');
    } else {
      console.log('\n⏱️  CHECK_IN_LOGS TABLE COLUMNS:');
      checkInSchema.rows.forEach(col => {
        console.log(`  - ${col.column_name.padEnd(20)} ${col.data_type.padEnd(25)} NULL: ${col.is_nullable}`);
      });
    }

    // Check for indexes on check_in_logs
    console.log('\n📊 Checking check_in_logs indexes...');
    const indexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'check_in_logs';
    `);
    
    if (indexes.rows.length > 0) {
      console.log('\n🔍 CHECK_IN_LOGS INDEXES:');
      indexes.rows.forEach(idx => {
        console.log(`  - ${idx.indexname}`);
      });
    }

    // Check required columns exist
    console.log('\n\n✅ VERIFICATION:');
    const hasHourlyRate = usersSchema.rows.some(col => col.column_name === 'hourly_rate');
    const hasCheckInLogs = checkInSchema.rows.length > 0;
    const hasUserIdInCheckIns = checkInSchema.rows.some(col => col.column_name === 'user_id');
    const hasJobIdInCheckIns = checkInSchema.rows.some(col => col.column_name === 'job_id');
    const hasDurationHours = checkInSchema.rows.some(col => col.column_name === 'duration_hours');
    const hasBillableAmount = checkInSchema.rows.some(col => col.column_name === 'billable_amount');
    const hasCheckInLogsHourlyRate = checkInSchema.rows.some(col => col.column_name === 'hourly_rate');

    console.log(`  ${hasHourlyRate ? '✅' : '❌'} users.hourly_rate column`);
    console.log(`  ${hasCheckInLogs ? '✅' : '❌'} check_in_logs table exists`);
    console.log(`  ${hasUserIdInCheckIns ? '✅' : '❌'} check_in_logs.user_id column`);
    console.log(`  ${hasJobIdInCheckIns ? '✅' : '❌'} check_in_logs.job_id column`);
    console.log(`  ${hasDurationHours ? '✅' : '❌'} check_in_logs.duration_hours column`);
    console.log(`  ${hasBillableAmount ? '✅' : '❌'} check_in_logs.billable_amount column`);
    console.log(`  ${hasCheckInLogsHourlyRate ? '✅' : '❌'} check_in_logs.hourly_rate column`);

    // Summary of missing migrations
    console.log('\n\n📝 REQUIRED MIGRATIONS:');
    const migrations = [];
    
    if (!hasHourlyRate) {
      migrations.push('❌ Run: add_hourly_rate_to_users.sql');
    }
    
    if (!hasCheckInLogs) {
      migrations.push('❌ Run: check_in_logs_migration.sql');
    }

    if (migrations.length === 0) {
      console.log('  ✅ All migrations are up to date!');
    } else {
      migrations.forEach(m => console.log(`  ${m}`));
    }

    // Check sample data
    console.log('\n\n📊 SAMPLE DATA:');
    const userCount = await client.query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL');
    const checkInCount = await client.query(`
      SELECT COUNT(*) FROM check_in_logs WHERE deleted_at IS NULL
    `);
    const activeCheckIns = await client.query(`
      SELECT COUNT(*) FROM check_in_logs 
      WHERE check_out_time IS NULL AND deleted_at IS NULL
    `);

    console.log(`  Users: ${userCount.rows[0].count}`);
    if (hasCheckInLogs) {
      console.log(`  Total Check-ins: ${checkInCount.rows[0].count}`);
      console.log(`  Active Check-ins: ${activeCheckIns.rows[0].count}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
