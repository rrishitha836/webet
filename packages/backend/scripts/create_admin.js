#!/usr/bin/env node
// Create or update an admin user with an email and plaintext password.
// Usage: DATABASE_URL="..." node scripts/create_admin.js admin@example.com "PlainTextPassword"

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function main() {
  const email = process.argv[2];
  const plain = process.argv[3];
  if (!email || !plain) {
    console.error('Usage: node scripts/create_admin.js <email> <password>');
    process.exit(2);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Please set DATABASE_URL environment variable');
    process.exit(2);
  }

  const pool = new Pool({ connectionString });
  try {
    const hash = bcrypt.hashSync(plain, 10);
    const sql = `INSERT INTO users (id, google_id, email, display_name, role, password_hash, created_at, updated_at)
      VALUES (gen_random_uuid(), 'admin-google-id', $1, 'Admin', 'ADMIN', $2, now(), now())
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'ADMIN';`;
    await pool.query(sql, [email, hash]);
    console.log('Admin created/updated:', email);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
