import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      UPDATE outcomes o
      SET current_price = 1.0 / GREATEST(
        (SELECT COUNT(*) FROM outcomes WHERE bet_id = o.bet_id), 1
      )
      WHERE EXISTS (
        SELECT 1 FROM bets b WHERE b.id = o.bet_id AND b.status IN ('OPEN','DRAFT')
      )
      RETURNING o.id, o.label, o.bet_id, o.current_price
    `);

    console.log(`Updated ${result.rows.length} outcomes`);

    const byBet: Record<string, { labels: string[]; price: number }> = {};
    for (const r of result.rows) {
      if (!byBet[r.bet_id]) byBet[r.bet_id] = { labels: [], price: parseFloat(r.current_price) };
      byBet[r.bet_id].labels.push(r.label);
    }
    for (const [bid, info] of Object.entries(byBet)) {
      console.log(`  ${info.labels.length} outcomes @ ${(info.price * 100).toFixed(1)}c each`);
    }

    // Also fix the admin bet creation default — update the column default
    await client.query(`
      ALTER TABLE outcomes ALTER COLUMN current_price SET DEFAULT 0;
    `);
    console.log('Set outcomes.current_price default to 0 (will be set properly on insert)');

  } finally {
    client.release();
    await pool.end();
  }
}

fix();
