#!/usr/bin/env node
// Upsert an admin user with a password hash. Usage:
// DATABASE_URL="..." node scripts/upsert_admin.js '<bcrypt-hash>'

const { Pool } = require('pg');

async function main() {
  const hash = process.argv[2];
  if (!hash) {
    console.error('Usage: node scripts/upsert_admin.js <bcrypt-hash>');
    process.exit(2);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Please set DATABASE_URL environment variable');
    process.exit(2);
  }

  const pool = new Pool({ connectionString });
  try {
    const sql = `INSERT INTO users (id, google_id, email, display_name, role, password_hash, created_at, updated_at)
      VALUES (gen_random_uuid(), 'admin-google-id', 'admin@example.com', 'Admin', 'ADMIN', $1, now(), now())
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'ADMIN';`;

    await pool.query(sql, [hash]);
    console.log('Admin upserted/updated');
  } catch (err) {
    console.error('Error upserting admin:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
