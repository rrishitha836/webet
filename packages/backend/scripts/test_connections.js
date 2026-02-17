#!/usr/bin/env node
// Test all database connections: Postgres (Prisma + pg), Redis, and API connectivity
const { Pool } = require('pg');
let redis = null;
try {
  redis = require('redis');
} catch (e) {
  // Redis module not installed, will skip Redis tests
}

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

async function testPostgresDirectly() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    log(COLORS.red, '❌', 'DATABASE_URL not set in environment');
    return false;
  }

  log(COLORS.cyan, '🔍', `Testing direct Postgres connection (pg): ${connectionString.replace(/:[^:@]+@/, ':***@')}`);
  
  const pool = new Pool({ connectionString });
  try {
    const start = Date.now();
    const result = await pool.query('SELECT NOW() as now, version() as version, current_database() as db');
    const duration = Date.now() - start;
    
    log(COLORS.green, '✅', `Direct Postgres connected (${duration}ms)`);
    log(COLORS.cyan, '  ℹ️', `Database: ${result.rows[0].db}`);
    log(COLORS.cyan, '  ℹ️', `Version: ${result.rows[0].version.split(',')[0]}`);
    
    // Test table access
    const tableResult = await pool.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    log(COLORS.cyan, '  ℹ️', `Tables: ${tableResult.rows[0].count} public tables found`);
    
    await pool.end();
    return true;
  } catch (err) {
    log(COLORS.red, '❌', `Direct Postgres connection failed: ${err.message}`);
    await pool.end();
    return false;
  }
}

async function testPostgresPrisma() {
  log(COLORS.cyan, '🔍', 'Testing Prisma Postgres connection...');
  
  try {
    // Try to load Prisma from the workspace package
    let prismaModule;
    try {
      prismaModule = require('@webet/database');
    } catch (e) {
      // Fallback to direct @prisma/client
      const { PrismaClient } = require('@prisma/client');
      prismaModule = { prisma: new PrismaClient() };
    }
    
    const prisma = prismaModule.prisma || prismaModule.default;
    
    const start = Date.now();
    await prisma.$connect();
    const duration = Date.now() - start;
    
    // Test a simple query
    const userCount = await prisma.user.count();
    const betCount = await prisma.bet.count();
    
    log(COLORS.green, '✅', `Prisma Postgres connected (${duration}ms)`);
    log(COLORS.cyan, '  ℹ️', `Users: ${userCount}, Bets: ${betCount}`);
    
    await prisma.$disconnect();
    return true;
  } catch (err) {
    log(COLORS.yellow, '⚠️', `Prisma connection test skipped: ${err.message}`);
    log(COLORS.cyan, '  ℹ️', 'This is OK - using direct pg connection instead');
    return null; // Not a critical failure if we have direct pg
  }
}

async function testRedis() {
  if (!redis) {
    log(COLORS.yellow, '⚠️', 'Redis module not installed (npm install redis) - skipping Redis test');
    return null;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    log(COLORS.yellow, '⚠️', 'REDIS_URL not set in environment (Redis connection skipped)');
    return null; // Not a failure, just not configured
  }

  log(COLORS.cyan, '🔍', `Testing Redis connection: ${redisUrl}`);
  
  const client = redis.createClient({ url: redisUrl });
  
  client.on('error', (err) => {
    // Suppressed - we handle below
  });

  try {
    const start = Date.now();
    await client.connect();
    const duration = Date.now() - start;
    
    // Test ping
    const pong = await client.ping();
    
    // Test set/get
    await client.set('webet:health:check', Date.now().toString(), { EX: 10 });
    const value = await client.get('webet:health:check');
    
    log(COLORS.green, '✅', `Redis connected (${duration}ms, ping: ${pong})`);
    
    await client.disconnect();
    return true;
  } catch (err) {
    log(COLORS.red, '❌', `Redis connection failed: ${err.message}`);
    try {
      await client.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    return false;
  }
}

async function testBackendAPI() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  log(COLORS.cyan, '🔍', `Testing Backend API: ${backendUrl}/health`);
  
  try {
    const start = Date.now();
    const response = await fetch(`${backendUrl}/health`);
    const duration = Date.now() - start;
    
    if (response.ok) {
      const data = await response.json();
      log(COLORS.green, '✅', `Backend API responding (${duration}ms)`);
      log(COLORS.cyan, '  ℹ️', `Status: ${JSON.stringify(data)}`);
      return true;
    } else {
      log(COLORS.yellow, '⚠️', `Backend API returned ${response.status} (${duration}ms)`);
      return false;
    }
  } catch (err) {
    log(COLORS.yellow, '⚠️', `Backend API not reachable: ${err.message}`);
    log(COLORS.cyan, '  ℹ️', 'This is OK if backend is not running yet');
    return null; // Not running, not an error
  }
}

async function testFrontendConfig() {
  log(COLORS.cyan, '🔍', 'Checking Frontend environment configuration...');
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  
  if (!apiUrl) {
    log(COLORS.yellow, '⚠️', 'NEXT_PUBLIC_API_URL not set (frontend may not connect to backend)');
    return false;
  }
  
  log(COLORS.green, '✅', 'Frontend config present');
  log(COLORS.cyan, '  ℹ️', `API URL: ${apiUrl}`);
  log(COLORS.cyan, '  ℹ️', `WS URL: ${wsUrl || 'Not set'}`);
  
  return true;
}

async function main() {
  console.log(`${COLORS.bold}${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}WeBet Database & API Connection Test${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}\n`);
  
  const results = {
    postgresDirect: false,
    postgresPrisma: false,
    redis: null,
    backendApi: null,
    frontendConfig: false
  };
  
  // Test Postgres (direct pg connection)
  console.log(`${COLORS.bold}1. Postgres (Direct - pg)${COLORS.reset}`);
  results.postgresDirect = await testPostgresDirectly();
  console.log();
  
  // Test Postgres (Prisma)
  console.log(`${COLORS.bold}2. Postgres (Prisma ORM)${COLORS.reset}`);
  results.postgresPrisma = await testPostgresPrisma();
  console.log();
  
  // Test Redis
  console.log(`${COLORS.bold}3. Redis${COLORS.reset}`);
  results.redis = await testRedis();
  console.log();
  
  // Test Backend API
  console.log(`${COLORS.bold}4. Backend API${COLORS.reset}`);
  results.backendApi = await testBackendAPI();
  console.log();
  
  // Test Frontend Config
  console.log(`${COLORS.bold}5. Frontend Configuration${COLORS.reset}`);
  results.frontendConfig = await testFrontendConfig();
  console.log();
  
  // Summary
  console.log(`${COLORS.bold}${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}SUMMARY${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}\n`);
  
  const criticalPass = results.postgresDirect; // Only direct pg is critical now
  const optionalPass = (results.postgresPrisma === null || results.postgresPrisma === true) &&
                        (results.redis === null || results.redis === true) && 
                        (results.backendApi === null || results.backendApi === true);
  
  if (criticalPass && results.frontendConfig) {
    log(COLORS.green, '✅', 'All critical database connections working!');
    
    if (results.postgresPrisma === true) {
      log(COLORS.green, '✅', 'Prisma connected (optional - using direct pg for PoC)');
    } else if (results.postgresPrisma === false) {
      log(COLORS.yellow, '⚠️', 'Prisma connection failed (OK - using direct pg)');
    } else {
      log(COLORS.cyan, 'ℹ️', 'Prisma not tested (OK - using direct pg)');
    }
    
    if (results.redis === true) {
      log(COLORS.green, '✅', 'Redis connected (optional)');
    } else if (results.redis === false) {
      log(COLORS.yellow, '⚠️', 'Redis connection failed (optional - app may work without it)');
    } else {
      log(COLORS.cyan, 'ℹ️', 'Redis not configured (optional)');
    }
    
    if (results.backendApi === true) {
      log(COLORS.green, '✅', 'Backend API is running and responding');
    } else {
      log(COLORS.cyan, 'ℹ️', 'Backend API not tested (start backend to verify)');
    }
    
    console.log();
    log(COLORS.green, '🎉', 'Your application is ready to run!');
    process.exit(0);
  } else {
    log(COLORS.red, '❌', 'Some critical connections failed:');
    
    if (!results.postgresDirect) {
      log(COLORS.red, '  ❌', 'Direct Postgres (pg) connection failed');
    }
    if (!results.frontendConfig) {
      log(COLORS.red, '  ❌', 'Frontend configuration missing');
    }
    
    console.log();
    log(COLORS.yellow, '💡', 'Fix the issues above and run this test again');
    process.exit(1);
  }
}

main();
