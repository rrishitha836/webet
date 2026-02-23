-- Migration: Initialize outcome_shares for existing bets
-- Populates outcome_shares with [0, 0, ...] based on number of outcomes
-- Also sets current_price = 1/num_outcomes on outcomes that are still at 0

-- 1. Update bets where outcome_shares is empty or null
UPDATE bets b
SET outcome_shares = (
  SELECT jsonb_agg(0)
  FROM generate_series(1, (SELECT COUNT(*) FROM outcomes WHERE bet_id = b.id))
)
WHERE outcome_shares IS NULL
   OR outcome_shares = '[]'::jsonb
   OR jsonb_array_length(outcome_shares) = 0;

-- 2. Set current_price for outcomes that have price = 0 or NULL
UPDATE outcomes o
SET current_price = 1.0 / GREATEST(
  (SELECT COUNT(*) FROM outcomes WHERE bet_id = o.bet_id),
  1
)
WHERE (current_price IS NULL OR current_price = 0)
  AND EXISTS (SELECT 1 FROM bets WHERE id = o.bet_id);

-- 3. Verify
SELECT b.id, b.title, b.outcome_shares, b.status,
       (SELECT COUNT(*) FROM outcomes WHERE bet_id = b.id) as num_outcomes
FROM bets b
ORDER BY b.created_at DESC
LIMIT 20;
