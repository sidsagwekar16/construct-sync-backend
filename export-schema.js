const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'Aniruddh@1',
  database: 'constructsync'
});

async function exportCurrentSchema() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    console.log('📄 Generating current schema...\n');

    let schema = `-- ============================================
-- CONSTRUCTSYNC DATABASE - CURRENT SCHEMA
-- ============================================
-- Exported on: ${new Date().toISOString()}
-- Database: constructsync
-- ============================================

`;

    // Get all ENUMs
    console.log('Exporting ENUMs...');
    const enums = await client.query(`
      SELECT t.typname as enum_name, 
             array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname;
    `);

    schema += `-- ============================================
-- ENUM TYPES
-- ============================================

`;
    for (const enumType of enums.rows) {
      schema += `CREATE TYPE ${enumType.enum_name} AS ENUM (\n`;
      const values = Array.isArray(enumType.enum_values) ? enumType.enum_values : [enumType.enum_values];
      schema += values.map(v => `  '${v}'`).join(',\n');
      schema += '\n);\n\n';
    }

    // Get all tables
    console.log('Exporting tables...');
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);

    schema += `-- ============================================
-- TABLES
-- ============================================

`;

    for (const table of tables.rows) {
      const tableName = table.tablename;
      console.log(`  - ${tableName}`);

      // Get columns
      const columns = await client.query(`
        SELECT 
          column_name,
          data_type,
          udt_name,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position;
      `, [tableName]);

      // Get primary key
      const pk = await client.query(`
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass AND i.indisprimary;
      `, [tableName]);

      // Get foreign keys
      const fks = await client.query(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = $1;
      `, [tableName]);

      // Get unique constraints
      const uniques = await client.query(`
        SELECT
          tc.constraint_name,
          string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'UNIQUE' 
          AND tc.table_name = $1
        GROUP BY tc.constraint_name;
      `, [tableName]);

      schema += `-- ${tableName}\n`;
      schema += `CREATE TABLE ${tableName} (\n`;

      // Add columns
      const columnDefs = columns.rows.map((col, idx) => {
        let def = `  ${col.column_name} `;
        
        // Data type
        if (col.data_type === 'USER-DEFINED') {
          def += col.udt_name;
        } else if (col.data_type === 'character varying') {
          def += col.character_maximum_length ? `VARCHAR(${col.character_maximum_length})` : 'VARCHAR';
        } else if (col.data_type === 'numeric') {
          if (col.numeric_precision && col.numeric_scale) {
            def += `DECIMAL(${col.numeric_precision}, ${col.numeric_scale})`;
          } else {
            def += 'NUMERIC';
          }
        } else {
          def += col.data_type.toUpperCase();
        }

        // Primary key
        if (pk.rows.some(p => p.attname === col.column_name)) {
          def += ' PRIMARY KEY';
        }

        // Nullable
        if (col.is_nullable === 'NO' && !pk.rows.some(p => p.attname === col.column_name)) {
          def += ' NOT NULL';
        }

        // Default
        if (col.column_default) {
          let defaultVal = col.column_default;
          // Clean up default values
          if (defaultVal.includes('gen_random_uuid()')) {
            def += ' DEFAULT gen_random_uuid()';
          } else if (defaultVal.includes('CURRENT_TIMESTAMP')) {
            def += ' DEFAULT CURRENT_TIMESTAMP';
          } else if (defaultVal.includes('true')) {
            def += ' DEFAULT true';
          } else if (defaultVal.includes('false')) {
            def += ' DEFAULT false';
          } else if (!defaultVal.includes('nextval')) {
            def += ` DEFAULT ${defaultVal}`;
          }
        }

        return def;
      });

      schema += columnDefs.join(',\n');

      // Add foreign keys
      if (fks.rows.length > 0) {
        for (const fk of fks.rows) {
          schema += `,\n  FOREIGN KEY (${fk.column_name}) REFERENCES ${fk.foreign_table_name}(${fk.foreign_column_name})`;
          if (fk.delete_rule && fk.delete_rule !== 'NO ACTION') {
            schema += ` ON DELETE ${fk.delete_rule}`;
          }
        }
      }

      // Add unique constraints
      if (uniques.rows.length > 0) {
        for (const unique of uniques.rows) {
          if (!unique.constraint_name.includes('_pkey')) {
            schema += `,\n  UNIQUE(${unique.columns})`;
          }
        }
      }

      schema += '\n);\n\n';
    }

    // Get all indexes
    console.log('Exporting indexes...');
    const indexes = await client.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey'
      ORDER BY tablename, indexname;
    `);

    if (indexes.rows.length > 0) {
      schema += `-- ============================================
-- INDEXES
-- ============================================

`;
      for (const idx of indexes.rows) {
        schema += `${idx.indexdef};\n`;
      }
      schema += '\n';
    }

    // Get comments
    console.log('Exporting column comments...');
    const comments = await client.query(`
      SELECT
        c.table_name,
        c.column_name,
        pgd.description
      FROM pg_catalog.pg_statio_all_tables as st
      INNER JOIN pg_catalog.pg_description pgd on (pgd.objoid = st.relid)
      INNER JOIN information_schema.columns c on (
        pgd.objsubid = c.ordinal_position and
        c.table_schema = st.schemaname and
        c.table_name = st.relname
      )
      WHERE st.schemaname = 'public'
      ORDER BY c.table_name, c.ordinal_position;
    `);

    if (comments.rows.length > 0) {
      schema += `-- ============================================
-- COLUMN COMMENTS
-- ============================================

`;
      for (const comment of comments.rows) {
        schema += `COMMENT ON COLUMN ${comment.table_name}.${comment.column_name} IS '${comment.description}';\n`;
      }
      schema += '\n';
    }

    // Write to file
    const filename = 'current_schema_export.sql';
    fs.writeFileSync(filename, schema);
    
    console.log(`\n✅ Schema exported successfully!`);
    console.log(`📄 File: ${filename}`);
    console.log(`📊 Stats:`);
    console.log(`   - ENUMs: ${enums.rows.length}`);
    console.log(`   - Tables: ${tables.rows.length}`);
    console.log(`   - Indexes: ${indexes.rows.length}`);
    console.log(`   - Comments: ${comments.rows.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

exportCurrentSchema();
