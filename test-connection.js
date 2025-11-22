const { Client } = require('pg');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter your PostgreSQL password: ', async (password) => {
  const client = new Client({
    user: 'postgres',
    password: password,
    host: 'localhost',
    port: 5433,
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('✓ Connection successful!');
    console.log('Testing query...');
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    await client.end();
    
    console.log('\nYour password is correct. Update setup-db.js with this password.');
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    console.log('\nPlease check:');
    console.log('1. PostgreSQL is running on port 5433');
    console.log('2. Username is correct (postgres)');
    console.log('3. Password is correct');
  }
  
  rl.close();
});
