#!/usr/bin/env node
// Check if all required tables and columns from the PRD schema exist in the database
const { Pool } = require('pg');

const REQUIRED_TABLES = {
  users: [
    'id', 'google_id', 'email', 'display_name', 'avatar_url', 'balance',
    'role', 'is_suspended', 'total_bets', 'total_wins', 'last_login_at',
    'created_at', 'updated_at', 'password_hash' // added for admin auth
  ],
  bets: [
    'id', 'slug', 'short_id', 'title', 'description', 'resolution_criteria',
    'category', 'status', 'source', 'created_by', 'close_time', 'resolved_at',
    'winning_outcome_id', 'cancel_reason', 'total_pool', 'participant_count',
    'tags', 'reference_links', 'created_at', 'updated_at'
  ],
  outcomes: [
    'id', 'bet_id', 'label', 'sort_order', 'total_wagers', 'total_coins'
  ],
  wagers: [
    'id', 'user_id', 'bet_id', 'outcome_id', 'amount', 'payout', 'status', 'created_at'
  ],
  ai_suggestions: [
    'id', 'title', 'description', 'outcomes', 'resolution_criteria',
    'suggested_deadline', 'category', 'confidence_score', 'source_links',
    'status', 'reviewed_by', 'rejection_reason', 'published_bet_id',
    'created_at', 'reviewed_at'
  ],
  comments: [
    'id', 'bet_id', 'user_id', 'parent_id', 'content', 'is_deleted', 'created_at'
  ],
  reports: [
    'id', 'reporter_id', 'bet_id', 'comment_id', 'reason_type', 'description',
    'status', 'resolved_by', 'created_at', 'resolved_at'
  ],
  notifications: [
    'id', 'user_id', 'type', 'title', 'message', 'bet_id', 'is_read', 'created_at'
  ],
  audit_logs: [
    'id', 'admin_id', 'action', 'entity_type', 'entity_id', 'metadata',
    'ip_address', 'created_at'
  ]
};

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Please set DATABASE_URL environment variable');
    process.exit(2);
  }

  const pool = new Pool({ connectionString });
  
  try {
    console.log('Checking database schema...\n');
    
    // Get all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const existingTables = tablesResult.rows.map(r => r.table_name);
    console.log('📋 Existing tables:', existingTables.join(', '), '\n');
    
    const missingTables = [];
    const tablesWithMissingColumns = {};
    const tablesWithExtraColumns = {};
    
    // Check each required table
    for (const [tableName, requiredColumns] of Object.entries(REQUIRED_TABLES)) {
      if (!existingTables.includes(tableName)) {
        missingTables.push(tableName);
        console.log(`❌ Table missing: ${tableName}`);
        continue;
      }
      
      // Get columns for this table
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      const existingColumns = columnsResult.rows.map(r => r.column_name);
      const missing = requiredColumns.filter(col => !existingColumns.includes(col));
      const extra = existingColumns.filter(col => !requiredColumns.includes(col));
      
      if (missing.length > 0) {
        tablesWithMissingColumns[tableName] = missing;
        console.log(`⚠️  Table "${tableName}" missing columns:`, missing.join(', '));
      }
      
      if (extra.length > 0) {
        tablesWithExtraColumns[tableName] = extra;
        console.log(`ℹ️  Table "${tableName}" has extra columns:`, extra.join(', '));
      }
      
      if (missing.length === 0 && extra.length === 0) {
        console.log(`✅ Table "${tableName}" - all required columns present`);
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    
    if (missingTables.length === 0 && Object.keys(tablesWithMissingColumns).length === 0) {
      console.log('✅ All required tables and columns are present!');
    } else {
      if (missingTables.length > 0) {
        console.log(`\n❌ Missing tables (${missingTables.length}):`, missingTables.join(', '));
      }
      
      if (Object.keys(tablesWithMissingColumns).length > 0) {
        console.log(`\n⚠️  Tables with missing columns (${Object.keys(tablesWithMissingColumns).length}):`);
        for (const [table, cols] of Object.entries(tablesWithMissingColumns)) {
          console.log(`  - ${table}: ${cols.join(', ')}`);
        }
      }
    }
    
    if (Object.keys(tablesWithExtraColumns).length > 0) {
      console.log(`\nℹ️  Tables with extra columns (${Object.keys(tablesWithExtraColumns).length}):`);
      for (const [table, cols] of Object.entries(tablesWithExtraColumns)) {
        console.log(`  - ${table}: ${cols.join(', ')}`);
      }
    }
    
    // Check enums
    console.log('\n' + '='.repeat(60));
    console.log('ENUM TYPES');
    console.log('='.repeat(60));
    
    const enumsResult = await pool.query(`
      SELECT t.typname as enum_name, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname
    `);
    
    if (enumsResult.rows.length > 0) {
      enumsResult.rows.forEach(row => {
        console.log(`✅ ${row.enum_name}: ${row.values}`);
      });
    } else {
      console.log('⚠️  No enum types found');
    }
    
    // Check indexes
    console.log('\n' + '='.repeat(60));
    console.log('INDEXES (sample)');
    console.log('='.repeat(60));
    
    const indexResult = await pool.query(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
      LIMIT 20
    `);
    
    indexResult.rows.forEach(row => {
      console.log(`  ${row.tablename}.${row.indexname}`);
    });
    
    if (indexResult.rowCount > 20) {
      console.log(`  ... and ${indexResult.rowCount - 20} more indexes`);
    }
    
  } catch (err) {
    console.error('Error checking schema:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
