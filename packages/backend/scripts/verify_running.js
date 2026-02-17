#!/usr/bin/env node
// Quick verification script to test if backend and frontend are running
const http = require('http');
const https = require('https');

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

async function checkEndpoint(url, name, expectedStatus = 200) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (expectedStatus === 'any' || res.statusCode === expectedStatus || (res.statusCode >= 200 && res.statusCode < 500)) {
          log(COLORS.green, '✅', `${name} - Status ${res.statusCode}`);
          if (data && data.length < 200) {
            console.log(`   Response: ${data}`);
          }
          resolve(true);
        } else {
          log(COLORS.red, '❌', `${name} - Unexpected status ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      log(COLORS.red, '❌', `${name} - ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      log(COLORS.yellow, '⚠️', `${name} - Timeout`);
      resolve(false);
    });
  });
}

async function main() {
  console.log(`${COLORS.bold}${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}Backend & Frontend Health Check${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}\n`);
  
  const tests = [
    { url: 'http://localhost:3001/api/auth/me', name: 'Backend API (/api/auth/me)', expected: 'any' },
    { url: 'http://localhost:3002/', name: 'Frontend Homepage (Next.js)', expected: 200 },
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await checkEndpoint(test.url, test.name, test.expected);
    results.push(result);
  }
  
  console.log(`\n${COLORS.bold}${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}SUMMARY${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}\n`);
  
  const allPassed = results.every(r => r === true);
  
  if (allPassed) {
    log(COLORS.green, '🎉', 'All services are running and responding!');
    console.log();
    log(COLORS.cyan, 'ℹ️', 'Frontend: http://localhost:3002');
    log(COLORS.cyan, 'ℹ️', 'Backend API: http://localhost:3001');
    console.log();
    log(COLORS.cyan, '💡', 'Next steps:');
    console.log('   1. Visit http://localhost:3002 in your browser');
    console.log('   2. Try logging in with Google OAuth');
    console.log('   3. Or test admin login:');
    console.log('      curl -X POST http://localhost:3001/api/auth/admin/login \\');
    console.log('        -H "Content-Type: application/json" \\');
    console.log('        -d \'{"email":"admin@example.com","password":"ChangeMe123!"}\' \\');
    console.log('        -c /tmp/cookies.txt');
  } else {
    log(COLORS.yellow, '⚠️', 'Some services are not responding');
    console.log();
    log(COLORS.cyan, '💡', 'Make sure both services are running:');
    console.log();
    console.log('   Terminal 1 - Backend:');
    console.log('   cd packages/backend && pnpm dev');
    console.log();
    console.log('   Terminal 2 - Frontend:');
    console.log('   cd packages/frontend && pnpm dev');
  }
  
  process.exit(allPassed ? 0 : 1);
}

main();
