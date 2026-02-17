const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://webet_user:webet_pass@localhost:5432/webet_db' });

async function main() {
  const queries = {
    totalBets: "SELECT count(*) FROM bets",
    openBets: "SELECT count(*) FROM bets WHERE status = 'OPEN'",
    pendingAI: "SELECT count(*) FROM ai_suggestions WHERE status = 'PENDING'",
    approvedAI: "SELECT count(*) FROM ai_suggestions WHERE status = 'APPROVED'",
    rejectedAI: "SELECT count(*) FROM ai_suggestions WHERE status = 'REJECTED'",
    expiredBets: "SELECT count(*) FROM bets WHERE status = 'OPEN' AND close_time < NOW()",
    aiGenBets: "SELECT count(*) FROM bets WHERE source = 'AI_GENERATED'",
    manualBets: "SELECT count(*) FROM bets WHERE source = 'MANUAL'",
    totalUsers: "SELECT count(*) FROM users",
    closedBets: "SELECT count(*) FROM bets WHERE status = 'CLOSED'",
    resolvedBets: "SELECT count(*) FROM bets WHERE status = 'RESOLVED'",
  };

  const results = {};
  for (const [key, sql] of Object.entries(queries)) {
    const { rows } = await pool.query(sql);
    results[key] = parseInt(rows[0].count, 10);
  }

  console.log(JSON.stringify(results, null, 2));
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
