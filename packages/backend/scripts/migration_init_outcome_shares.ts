// Migration: Initialize outcome_shares for existing bets
// Run with: npx tsx scripts/migration_init_outcome_shares.ts

import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Find bets with empty/missing outcome_shares
    const bets = await client.query(`
      SELECT b.id, b.title, b.outcome_shares,
             (SELECT COUNT(*)::int FROM outcomes WHERE bet_id = b.id) as num_outcomes
      FROM bets b
      WHERE b.outcome_shares IS NULL
         OR b.outcome_shares = '[]'::jsonb
         OR jsonb_array_length(b.outcome_shares) = 0
    `);

    console.log(`Found ${bets.rows.length} bets with empty outcome_shares`);

    for (const bet of bets.rows) {
      const shares = Array(bet.num_outcomes).fill(0);
      await client.query(
        'UPDATE bets SET outcome_shares = $1 WHERE id = $2',
        [JSON.stringify(shares), bet.id],
      );
      console.log(`  ✓ ${bet.title} → [${shares.join(', ')}]`);
    }

    // 2. Set current_price on outcomes that are at 0 or NULL
    const outcomes = await client.query(`
      UPDATE outcomes o
      SET current_price = 1.0 / GREATEST(
        (SELECT COUNT(*) FROM outcomes WHERE bet_id = o.bet_id),
        1
      )
      WHERE (current_price IS NULL OR current_price = 0)
      RETURNING o.id, o.label, o.bet_id, o.current_price
    `);

    console.log(`Updated ${outcomes.rows.length} outcome prices`);
    for (const o of outcomes.rows) {
      console.log(`  ✓ ${o.label} → ${parseFloat(o.current_price).toFixed(4)}`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Migration complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
