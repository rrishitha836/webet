const { Pool } = require('pg');
const { randomUUID } = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://webet_user:webet_pass@localhost:5432/webet_db',
});

function slug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 50);
}
function shortId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function main() {
  // Get admin user id
  const { rows: admins } = await pool.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
  if (!admins.length) { console.error('No admin found'); process.exit(1); }
  const adminId = admins[0].id;

  console.log('Using admin:', adminId);

  // ============ MORE BETS ============
  const now = new Date();
  const betsToInsert = [
    // SPORTS
    { title: 'Will Manchester City win the 2025-26 Premier League?', desc: 'Prediction on whether Manchester City will win the Premier League title for the 2025-26 season.', criteria: 'Official Premier League final standings.', cat: 'SPORTS', close: addDays(now, 60), tags: ['football','premier-league','man-city'], status: 'OPEN', source: 'AI_GENERATED' },
    { title: 'Will Virat Kohli score 1000 runs in IPL 2026?', desc: 'Whether Virat Kohli will accumulate 1000+ runs in IPL 2026 season.', criteria: 'Official IPL statistics for the 2026 season.', cat: 'SPORTS', close: addDays(now, 90), tags: ['cricket','ipl','kohli'], status: 'OPEN', source: 'AI_GENERATED' },
    { title: 'NBA Finals 2026: Will the Celtics repeat?', desc: 'Will the Boston Celtics win back-to-back NBA championships in 2026?', criteria: 'Official NBA Finals result declaration.', cat: 'SPORTS', close: addDays(now, 120), tags: ['nba','basketball','celtics'], status: 'OPEN', source: 'MANUAL' },

    // TECHNOLOGY
    { title: 'Will Apple release a foldable iPhone in 2026?', desc: 'Prediction on whether Apple will officially announce and release a foldable iPhone model in 2026.', criteria: 'Official Apple announcement and product availability.', cat: 'TECHNOLOGY', close: addDays(now, 180), tags: ['apple','iphone','foldable'], status: 'OPEN', source: 'AI_GENERATED' },
    { title: 'Will Tesla achieve full self-driving (Level 5) approval in the US?', desc: 'Whether Tesla receives Level 5 autonomous driving approval from US regulators by end of 2026.', criteria: 'Official NHTSA or DOT approval documentation.', cat: 'TECHNOLOGY', close: addDays(now, 200), tags: ['tesla','self-driving','autonomous'], status: 'OPEN', source: 'AI_GENERATED' },
    { title: 'Will Starship successfully reach orbit and return by July 2026?', desc: 'SpaceX Starship completing a full orbital flight and controlled return.', criteria: 'SpaceX official confirmation of successful orbital flight and landing.', cat: 'TECHNOLOGY', close: addDays(now, 150), tags: ['spacex','starship','space'], status: 'OPEN', source: 'MANUAL' },

    // POLITICS
    { title: 'Will the UK rejoin the EU single market by 2027?', desc: 'Whether the UK government will initiate or complete rejoining the EU single market.', criteria: 'Official UK government announcement or EU agreement.', cat: 'POLITICS', close: addDays(now, 365), tags: ['uk','eu','brexit'], status: 'OPEN', source: 'AI_GENERATED' },
    { title: 'Will India hold a national census in 2026?', desc: 'Whether the Government of India will conduct the postponed national census in 2026.', criteria: 'Official Government of India gazette notification.', cat: 'POLITICS', close: addDays(now, 270), tags: ['india','census','government'], status: 'OPEN', source: 'MANUAL' },

    // ENTERTAINMENT
    { title: 'Will GTA 6 be released before December 2026?', desc: 'Whether Rockstar Games will release Grand Theft Auto VI before December 31, 2026.', criteria: 'Official Rockstar Games release on any platform.', cat: 'ENTERTAINMENT', close: addDays(now, 250), tags: ['gaming','gta6','rockstar'], status: 'OPEN', source: 'AI_GENERATED' },
    { title: 'Will a streaming service surpass Netflix in global subscribers?', desc: 'Whether any streaming platform (Disney+, Amazon Prime, etc.) will surpass Netflix in paid subscribers.', criteria: 'Verified quarterly earnings reports showing subscriber counts.', cat: 'ENTERTAINMENT', close: addDays(now, 180), tags: ['streaming','netflix','disney'], status: 'OPEN', source: 'MANUAL' },
    { title: 'Will BTS reunite for a world tour in 2026?', desc: 'Whether all BTS members will announce and begin a group world tour in 2026.', criteria: 'Official BTS/HYBE announcement of group tour dates.', cat: 'ENTERTAINMENT', close: addDays(now, 200), tags: ['bts','kpop','music'], status: 'OPEN', source: 'AI_GENERATED' },

    // CULTURE
    { title: 'Will the global population reach 8.1 billion in 2026?', desc: 'UN projections indicate the world population may cross 8.1 billion.', criteria: 'UN World Population Prospects official estimate.', cat: 'CULTURE', close: addDays(now, 300), tags: ['population','global','demographics'], status: 'OPEN', source: 'AI_GENERATED' },
    { title: 'Will "AI" be named Oxford Word of the Year 2026?', desc: 'Whether Oxford Dictionaries will select AI-related terminology as their Word of the Year.', criteria: 'Official Oxford Dictionaries announcement.', cat: 'CULTURE', close: addDays(now, 280), tags: ['language','oxford','ai'], status: 'OPEN', source: 'MANUAL' },

    // EXPIRED bets (close time in the past)
    { title: 'Will it snow in New York on January 1, 2026?', desc: 'Whether measurable snowfall occurred in New York City on New Year\'s Day 2026.', criteria: 'Official NOAA weather station data for Central Park.', cat: 'CULTURE', close: addDays(now, -45), tags: ['weather','nyc','snow'], status: 'OPEN', source: 'MANUAL' },
    { title: 'Super Bowl LX: Over or Under 50 total points?', desc: 'Whether the total combined score of Super Bowl LX exceeds 50 points.', criteria: 'Official NFL box score for Super Bowl LX.', cat: 'SPORTS', close: addDays(now, -8), tags: ['nfl','super-bowl','points'], status: 'OPEN', source: 'AI_GENERATED' },

    // CLOSED / RESOLVED bets
    { title: 'Did Google release Gemini 2.0 before February 2026?', desc: 'Whether Google officially released Gemini 2.0 AI model.', criteria: 'Official Google AI blog announcement.', cat: 'TECHNOLOGY', close: addDays(now, -30), tags: ['google','gemini','ai'], status: 'CLOSED', source: 'AI_GENERATED' },
    { title: 'Did the Australian Open 2026 have a first-time winner?', desc: 'Whether a player who has never won a Grand Slam won the 2026 Australian Open.', criteria: 'Official Australian Open results.', cat: 'SPORTS', close: addDays(now, -20), tags: ['tennis','grand-slam','aus-open'], status: 'RESOLVED', source: 'MANUAL' },
  ];

  const outcomeMap = {
    'Will Manchester City win the 2025-26 Premier League?': ['Yes - City win', 'No - another team'],
    'Will Virat Kohli score 1000 runs in IPL 2026?': ['Yes - 1000+ runs', 'No - under 1000'],
    'NBA Finals 2026: Will the Celtics repeat?': ['Yes - Celtics repeat', 'No - new champion', 'Celtics miss Finals'],
    'Will Apple release a foldable iPhone in 2026?': ['Yes - foldable iPhone released', 'No - not in 2026'],
    'Will Tesla achieve full self-driving (Level 5) approval in the US?': ['Yes - approved', 'No - not approved'],
    'Will Starship successfully reach orbit and return by July 2026?': ['Yes - success', 'No - not achieved'],
    'Will the UK rejoin the EU single market by 2027?': ['Yes', 'No'],
    'Will India hold a national census in 2026?': ['Yes - census held', 'No - postponed again'],
    'Will GTA 6 be released before December 2026?': ['Yes - released', 'No - delayed further'],
    'Will a streaming service surpass Netflix in global subscribers?': ['Yes - surpassed', 'No - Netflix stays #1'],
    'Will BTS reunite for a world tour in 2026?': ['Yes - tour announced', 'No - no group tour'],
    'Will the global population reach 8.1 billion in 2026?': ['Yes', 'No'],
    'Will "AI" be named Oxford Word of the Year 2026?': ['Yes - AI/related word', 'No - different word'],
    'Will it snow in New York on January 1, 2026?': ['Yes - snow', 'No - no snow'],
    'Super Bowl LX: Over or Under 50 total points?': ['Over 50', 'Under 50'],
    'Did Google release Gemini 2.0 before February 2026?': ['Yes - released', 'No - not released'],
    'Did the Australian Open 2026 have a first-time winner?': ['Yes - first-time winner', 'No - past champion won'],
  };

  let insertedBets = 0;
  for (const b of betsToInsert) {
    const betId = randomUUID();
    const s = slug(b.title);
    const sid = shortId();
    const { rowCount } = await pool.query(
      `INSERT INTO bets (id, slug, short_id, title, description, resolution_criteria, category, status, source, created_by, close_time, tags, reference_links, total_pool, participant_count, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW())
       ON CONFLICT (slug) DO NOTHING`,
      [betId, s, sid, b.title, b.desc, b.criteria, b.cat, b.status, b.source, adminId, b.close, b.tags, [], 0, 0]
    );

    if (rowCount > 0) {
      const outcomes = outcomeMap[b.title] || ['Yes', 'No'];
      for (let i = 0; i < outcomes.length; i++) {
        await pool.query(
          `INSERT INTO outcomes (id, bet_id, label, sort_order, total_wagers, total_coins)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [randomUUID(), betId, outcomes[i], i, 0, 0]
        );
      }
      insertedBets++;
    } else {
      console.log(`   ⏭️  Skipped (already exists): ${b.title}`);
    }
  }
  console.log(`✅ Inserted ${insertedBets} new bets with outcomes (${betsToInsert.length - insertedBets} skipped)`);

  // ============ AI SUGGESTIONS ============
  const suggestionsToInsert = [
    // PENDING suggestions
    { title: 'Will SpaceX land humans on Mars before 2030?', desc: 'SpaceX has ambitious plans for Mars colonization. Will they succeed in landing humans before the decade ends?', criteria: 'Official SpaceX/NASA confirmation of crewed Mars landing.', cat: 'TECHNOLOGY', confidence: 0.82, outcomes: ['Yes - before 2030', 'No - not by 2030'], status: 'PENDING', deadline: addDays(now, 365) },
    { title: 'Will the next James Bond be announced in 2026?', desc: 'The next actor to play James Bond in the official EON Productions franchise.', criteria: 'Official EON Productions announcement of the new Bond actor.', cat: 'ENTERTAINMENT', confidence: 0.65, outcomes: ['Yes - announced', 'No - not yet'], status: 'PENDING', deadline: addDays(now, 300) },
    { title: 'Will Instagram launch a paid subscription tier?', desc: 'Meta might introduce a premium Instagram subscription similar to Twitter/X Blue.', criteria: 'Official Meta announcement of paid Instagram subscription.', cat: 'TECHNOLOGY', confidence: 0.71, outcomes: ['Yes - paid tier launched', 'No - stays free'], status: 'PENDING', deadline: addDays(now, 200) },
    { title: 'Will India become the 3rd largest economy by GDP in 2026?', desc: 'India is projected to surpass Japan and Germany in nominal GDP.', criteria: 'IMF World Economic Outlook official GDP rankings.', cat: 'POLITICS', confidence: 0.88, outcomes: ['Yes - 3rd largest', 'No - still 4th or below'], status: 'PENDING', deadline: addDays(now, 300) },
    { title: 'Will a new pandemic be declared by WHO in 2026?', desc: 'Whether the World Health Organization declares a new Public Health Emergency of International Concern.', criteria: 'Official WHO PHEIC declaration.', cat: 'CULTURE', confidence: 0.25, outcomes: ['Yes - declared', 'No - not declared'], status: 'PENDING', deadline: addDays(now, 300) },
    { title: 'Will Ethereum surpass $10,000 by end of 2026?', desc: 'Ethereum price prediction for the year. Will it hit the 5-figure milestone?', criteria: 'CoinGecko ETH/USD price reaching $10,000 for at least 1 hour.', cat: 'TECHNOLOGY', confidence: 0.55, outcomes: ['Yes - $10k+', 'No - stays below'], status: 'PENDING', deadline: addDays(now, 300) },
    { title: 'Will the 2026 FIFA World Cup have a surprise finalist?', desc: 'Whether a team outside the top 10 FIFA rankings reaches the World Cup Final.', criteria: 'Official FIFA World Cup 2026 bracket results.', cat: 'SPORTS', confidence: 0.45, outcomes: ['Yes - underdog finalist', 'No - top teams dominate'], status: 'PENDING', deadline: addDays(now, 150) },
    { title: 'Will OpenAI go public (IPO) in 2026?', desc: 'Whether OpenAI will file for and complete an Initial Public Offering.', criteria: 'SEC filing and confirmed IPO date.', cat: 'TECHNOLOGY', confidence: 0.60, outcomes: ['Yes - IPO completed', 'No - stays private'], status: 'PENDING', deadline: addDays(now, 300) },

    // APPROVED suggestions (already published as bets)
    { title: 'Will ChatGPT-5 be released before summer 2026?', desc: 'OpenAI has been hinting at major AI improvements.', criteria: 'OpenAI official release of GPT-5.', cat: 'TECHNOLOGY', confidence: 0.78, outcomes: ['Yes', 'No'], status: 'APPROVED', deadline: addDays(now, 120) },
    { title: 'Will Bitcoin reach $150,000 by end of 2026?', desc: 'Bitcoin price prediction for 2026.', criteria: 'BTC price on CoinGecko.', cat: 'TECHNOLOGY', confidence: 0.62, outcomes: ['Yes', 'No'], status: 'APPROVED', deadline: addDays(now, 300) },
    { title: 'Will Taylor Swift announce a new album in Q1 2026?', desc: 'Taylor Swift album prediction.', criteria: 'Official announcement from Taylor Swift or her label.', cat: 'ENTERTAINMENT', confidence: 0.70, outcomes: ['Yes', 'No'], status: 'APPROVED', deadline: addDays(now, 30) },

    // REJECTED suggestions
    { title: 'Will aliens make contact with Earth in 2026?', desc: 'Unlikely scenario of confirmed extraterrestrial contact.', criteria: 'Official government or scientific agency confirmation.', cat: 'OTHER', confidence: 0.05, outcomes: ['Yes', 'No'], status: 'REJECTED', deadline: addDays(now, 300) },
    { title: 'Will time travel be invented by 2026?', desc: 'Purely speculative bet about time travel technology.', criteria: 'Peer-reviewed scientific demonstration.', cat: 'TECHNOLOGY', confidence: 0.02, outcomes: ['Yes', 'No'], status: 'REJECTED', deadline: addDays(now, 300) },
    { title: 'Will the Sun explode in 2026?', desc: 'Absurd suggestion about solar apocalypse.', criteria: 'N/A', cat: 'OTHER', confidence: 0.01, outcomes: ['Yes', 'No'], status: 'REJECTED', deadline: addDays(now, 300) },
    { title: 'Duplicate: Will Bitcoin hit 60k?', desc: 'Duplicate of existing bet about Bitcoin price.', criteria: 'CoinGecko data.', cat: 'TECHNOLOGY', confidence: 0.75, outcomes: ['Yes', 'No'], status: 'REJECTED', deadline: addDays(now, 45) },
  ];

  for (const s of suggestionsToInsert) {
    const reviewedBy = (s.status !== 'PENDING') ? adminId : null;
    const reviewedAt = (s.status !== 'PENDING') ? new Date() : null;
    const rejection = s.status === 'REJECTED' ? 'LOW_QUALITY' : null;

    await pool.query(
      `INSERT INTO ai_suggestions (id, title, description, outcomes, resolution_criteria, suggested_deadline, category, confidence_score, source_links, status, reviewed_by, rejection_reason, reviewed_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
       ON CONFLICT DO NOTHING`,
      [randomUUID(), s.title, s.desc, JSON.stringify(s.outcomes), s.criteria, s.deadline, s.cat, s.confidence, [], s.status, reviewedBy, rejection, reviewedAt]
    );
  }
  console.log(`✅ Inserted ${suggestionsToInsert.length} AI suggestions`);

  // ============ SUMMARY ============
  const { rows: betCount } = await pool.query('SELECT count(*) FROM bets');
  const { rows: sugCount } = await pool.query('SELECT count(*) FROM ai_suggestions');
  const { rows: sugPending } = await pool.query("SELECT count(*) FROM ai_suggestions WHERE status = 'PENDING'");
  const { rows: sugApproved } = await pool.query("SELECT count(*) FROM ai_suggestions WHERE status = 'APPROVED'");
  const { rows: sugRejected } = await pool.query("SELECT count(*) FROM ai_suggestions WHERE status = 'REJECTED'");
  const { rows: openBets } = await pool.query("SELECT count(*) FROM bets WHERE status = 'OPEN'");
  const { rows: expBets } = await pool.query("SELECT count(*) FROM bets WHERE status = 'OPEN' AND close_time < NOW()");

  console.log('\n📊 Database Summary:');
  console.log(`   Total Bets: ${betCount[0].count}`);
  console.log(`   Open Bets: ${openBets[0].count}`);
  console.log(`   Expired (open past close): ${expBets[0].count}`);
  console.log(`   AI Suggestions: ${sugCount[0].count}`);
  console.log(`   - Pending: ${sugPending[0].count}`);
  console.log(`   - Approved: ${sugApproved[0].count}`);
  console.log(`   - Rejected: ${sugRejected[0].count}`);

  await pool.end();
  console.log('\n✅ Done!');
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

main().catch(e => { console.error(e); process.exit(1); });
