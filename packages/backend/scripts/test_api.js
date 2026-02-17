// Quick test: login then fetch stats
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
  // 1. Login
  const loginRes = await request({
    hostname: 'localhost', port: 3001, path: '/api/auth/admin/login',
    method: 'POST', headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({ email: 'admin@example.com', password: 'ChangeMe123!' }));

  console.log('Login status:', loginRes.status);
  const loginData = JSON.parse(loginRes.body);
  console.log('Login success:', loginData.success);

  // Extract cookie
  const cookies = loginRes.headers['set-cookie'];
  if (!cookies) { console.log('No cookies returned!'); return; }
  const cookieStr = cookies.map(c => c.split(';')[0]).join('; ');
  console.log('Cookies:', cookieStr.substring(0, 80) + '...');

  // 2. Fetch stats
  const statsRes = await request({
    hostname: 'localhost', port: 3001, path: '/api/admin/stats',
    method: 'GET', headers: { 'Cookie': cookieStr },
  });

  console.log('\nStats status:', statsRes.status);
  const stats = JSON.parse(statsRes.body);
  console.log('Stats response:', JSON.stringify(stats, null, 2));

  // 3. Fetch AI suggestions
  const sugRes = await request({
    hostname: 'localhost', port: 3001, path: '/api/admin/ai-suggestions?status=ALL&limit=3',
    method: 'GET', headers: { 'Cookie': cookieStr },
  });
  console.log('\nAI Suggestions status:', sugRes.status);
  const sugData = JSON.parse(sugRes.body);
  console.log('Total suggestions:', sugData.pagination?.total);
  if (sugData.data && sugData.data.length > 0) {
    console.log('First suggestion fields:', Object.keys(sugData.data[0]).join(', '));
    console.log('First suggestion outcomes type:', typeof sugData.data[0].outcomes, Array.isArray(sugData.data[0].outcomes) ? '(array)' : '');
    console.log('First suggestion outcomes:', JSON.stringify(sugData.data[0].outcomes));
  }
}

main().catch(e => console.error(e));
