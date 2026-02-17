#!/usr/bin/env node
// Diagnose admin login issues and fix them
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(color, symbol, message) {
  console.log(`${color}${symbol} ${message}${COLORS.reset}`);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    log(COLORS.red, '❌', 'DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    console.log(`${COLORS.bold}${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}`);
    console.log(`${COLORS.bold}${COLORS.cyan}Admin Login Diagnostic${COLORS.reset}`);
    console.log(`${COLORS.bold}${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}\n`);

    // Check for admin users
    log(COLORS.cyan, '🔍', 'Checking for admin users...');
    const adminResult = await pool.query(`
      SELECT id, email, display_name, role, password_hash IS NOT NULL as has_password
      FROM users
      WHERE role = 'ADMIN'
    `);

    if (adminResult.rows.length === 0) {
      log(COLORS.yellow, '⚠️', 'No admin users found in database');
      console.log();
      log(COLORS.cyan, '💡', 'Create an admin user:');
      console.log('   cd packages/backend');
      console.log('   DATABASE_URL="..." pnpm run create-admin -- admin@example.com "YourPassword"');
      console.log();
      await pool.end();
      process.exit(1);
    }

    log(COLORS.green, '✅', `Found ${adminResult.rows.length} admin user(s):\n`);
    
    let hasIssues = false;
    adminResult.rows.forEach((admin, i) => {
      console.log(`   ${i + 1}. ${admin.email} (${admin.display_name})`);
      if (!admin.has_password) {
        log(COLORS.red, '      ❌', 'NO PASSWORD SET - login will fail!');
        hasIssues = true;
      } else {
        log(COLORS.green, '      ✅', 'Password hash present');
      }
    });

    console.log();

    if (hasIssues) {
      log(COLORS.yellow, '⚠️', 'Some admin users have no password');
      console.log();
      log(COLORS.cyan, '💡', 'Fix by setting a password:');
      console.log('   DATABASE_URL="..." pnpm run create-admin -- admin@example.com "NewPassword123!"');
      console.log();
    }

    // Test admin login logic
    const testEmail = adminResult.rows[0].email;
    log(COLORS.cyan, '🔍', `Testing admin lookup for: ${testEmail}`);
    
    const lookupResult = await pool.query(`
      SELECT id, email, display_name, role, is_suspended, password_hash
      FROM users
      WHERE email = $1
    `, [testEmail]);

    if (lookupResult.rows.length === 0) {
      log(COLORS.red, '❌', 'Admin lookup failed');
    } else {
      const admin = lookupResult.rows[0];
      log(COLORS.green, '✅', 'Admin lookup works');
      console.log(`   Role: ${admin.role}`);
      console.log(`   Suspended: ${admin.is_suspended}`);
      console.log(`   Has password: ${admin.password_hash ? 'Yes' : 'No'}`);
    }

    console.log();
    console.log(`${COLORS.bold}${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}`);
    console.log(`${COLORS.bold}${COLORS.cyan}DIAGNOSIS COMPLETE${COLORS.reset}`);
    console.log(`${COLORS.bold}${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}\n`);

    if (hasIssues) {
      log(COLORS.yellow, '⚠️', 'Action required: Set passwords for admin users');
      process.exit(1);
    } else {
      log(COLORS.green, '✅', 'All admin users have passwords set');
      console.log();
      log(COLORS.cyan, '💡', 'Test login:');
      console.log(`   curl -X POST http://localhost:3001/api/auth/admin/login \\`);
      console.log(`     -H "Content-Type: application/json" \\`);
      console.log(`     -d '{"email":"${testEmail}","password":"YourPassword"}' \\`);
      console.log(`     -c /tmp/cookies.txt`);
      process.exit(0);
    }

  } catch (err) {
    log(COLORS.red, '❌', `Error: ${err.message}`);
    await pool.end();
    process.exit(1);
  }
}

main();
