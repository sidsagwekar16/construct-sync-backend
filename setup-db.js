const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  // First connect to postgres database to create our database
  const setupClient = new Client({
    user: 'postgres',
    password: 'Aniruddh@163',
    host: 'localhost',
    port: 5433,
    database: 'postgres'
  });

  try {
    await setupClient.connect();
    console.log('Connected to PostgreSQL');

    // Check if database exists
    const dbCheck = await setupClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'constructsync'"
    );

    if (dbCheck.rows.length === 0) {
      console.log('Creating constructsync database...');
      await setupClient.query('CREATE DATABASE constructsync');
      console.log('✓ Database created successfully');
    } else {
      console.log('✓ Database already exists');
    }

    await setupClient.end();

    // Now connect to constructsync database to run schema
    const dbClient = new Client({
      user: 'postgres',
      password: 'Aniruddh@163',
      host: 'localhost',
      port: 5433,
      database: 'constructsync'
    });

    await dbClient.connect();
    console.log('Connected to constructsync database');

    // Run schema files
    const schemaFiles = [
      'enums.sql',
      'final_schema.sql'
    ];

    for (const file of schemaFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        console.log(`Running ${file}...`);
        const sql = fs.readFileSync(filePath, 'utf8');
        await dbClient.query(sql);
        console.log(`✓ ${file} executed successfully`);
      } else {
        console.log(`⚠ ${file} not found, skipping`);
      }
    }

    await dbClient.end();
    console.log('\n✓ Database setup complete!');
    console.log('You can now run: npm run dev');

  } catch (error) {
    console.error('Error setting up database:', error.message);
    process.exit(1);
  }
}

setupDatabase();
