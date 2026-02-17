// Test Google OAuth and user endpoints
const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  console.log('🧪 Testing user endpoints...\n');

  try {
    // 1. Test GET /api/auth/google (should redirect)
    console.log('1. Testing Google OAuth init endpoint...');
    const googleRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/auth/google',
      method: 'GET'
    });
    console.log(`   Status: ${googleRes.status} (${googleRes.status === 302 ? 'Redirect OK' : 'Unexpected'})`);
    if (googleRes.headers.location) {
      console.log(`   Redirects to: ${googleRes.headers.location.substring(0, 80)}...`);
    }

    // 2. Test user profile endpoint (should be 401 without auth)
    console.log('\n2. Testing user profile endpoint (unauthenticated)...');
    const profileRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/users/profile',
      method: 'GET'
    });
    console.log(`   Status: ${profileRes.status} (${profileRes.status === 401 ? 'Correctly protected' : 'Issue'})`);

    // 3. Test user bets endpoint (should be 401 without auth)
    console.log('\n3. Testing user bets endpoint (unauthenticated)...');
    const betsRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/users/bets',
      method: 'GET'
    });
    console.log(`   Status: ${betsRes.status} (${betsRes.status === 401 ? 'Correctly protected' : 'Issue'})`);

    // 4. Test public bets endpoint (should work)
    console.log('\n4. Testing public bets endpoint...');
    const publicBetsRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/bets',
      method: 'GET'
    });
    console.log(`   Status: ${publicBetsRes.status}`);
    if (publicBetsRes.status === 200) {
      const data = JSON.parse(publicBetsRes.body);
      console.log(`   Found ${data.data?.length || 0} public bets`);
      if (data.data && data.data.length > 0) {
        console.log(`   First bet: "${data.data[0].title}"`);
      }
    }

    // 5. Test auth/me endpoint
    console.log('\n5. Testing auth/me endpoint...');
    const meRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/auth/me',
      method: 'GET'
    });
    console.log(`   Status: ${meRes.status} (${meRes.status === 401 ? 'Correctly returns 401' : 'Issue'})`);

    console.log('\n✅ User endpoint testing complete!');
    console.log('\n📝 Next steps to test full user flow:');
    console.log('   1. Visit http://localhost:3000 in browser');
    console.log('   2. Click Google login button');
    console.log('   3. Complete OAuth flow');
    console.log('   4. Check dashboard and profile pages');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

main().catch(e => console.error(e));