const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgresql://webet_user:webet_pass@localhost:5432/webet_db'
});

async function testLogin() {
  const email = 'admin@example.com';
  const password = 'ChangeMe123!';
  
  const { rows } = await pool.query(
    'SELECT id, email, display_name, avatar_url, role, is_suspended, password_hash FROM users WHERE email = $1',
    [email]
  );
  
  const admin = rows[0];
  
  console.log('\n=== Admin object from DB ===');
  console.log(JSON.stringify(admin, null, 2));
  
  if (admin) {
    console.log('\n=== Field checks ===');
    console.log('admin.role:', admin.role);
    console.log('admin.is_suspended:', admin.is_suspended);
    console.log('admin.isSuspended:', admin.isSuspended);
    console.log('admin.display_name:', admin.display_name);
    console.log('admin.displayName:', admin.displayName);
    console.log('admin.password_hash exists:', !!admin.password_hash);
    
    if (admin.password_hash) {
      const matches = await bcrypt.compare(password, admin.password_hash);
      console.log('\n=== Password check ===');
      console.log('Password matches:', matches);
    }
  }
  
  await pool.end();
}

testLogin().catch(console.error);
