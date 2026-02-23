const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('trades','user_shares','price_history') ORDER BY table_name");
  console.log('New tables:', tables.rows.map(r => r.table_name).join(', '));

  const betCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='bets' AND column_name IN ('liquidity_b','total_volume','outcome_shares','market_type')");
  console.log('bets new cols:', betCols.rows.map(r => r.column_name).join(', '));

  const outCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='outcomes' AND column_name IN ('shares_qty','current_price')");
  console.log('outcomes new cols:', outCols.rows.map(r => r.column_name).join(', '));

  pool.end();
}
check();
