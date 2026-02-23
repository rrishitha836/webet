-- =============================================================================
-- WeBet Prediction Market Migration
-- Adds LMSR dynamic pricing, share trading, and price history
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. ALTER existing tables
-- ---------------------------------------------------------------------------

-- bets: add liquidity parameter and volume tracking
ALTER TABLE bets ADD COLUMN IF NOT EXISTS liquidity_b      DECIMAL NOT NULL DEFAULT 100;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS total_volume      DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS outcome_shares    JSONB   NOT NULL DEFAULT '[]';
ALTER TABLE bets ADD COLUMN IF NOT EXISTS market_type       VARCHAR(20) NOT NULL DEFAULT 'PREDICTION';

-- outcomes: add per-outcome share quantity and current price
ALTER TABLE outcomes ADD COLUMN IF NOT EXISTS shares_qty     DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE outcomes ADD COLUMN IF NOT EXISTS current_price  DECIMAL NOT NULL DEFAULT 0.5;

-- ---------------------------------------------------------------------------
-- 2. NEW tables
-- ---------------------------------------------------------------------------

-- trades: every buy/sell execution
CREATE TABLE IF NOT EXISTS trades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users(id),
  bet_id          UUID        NOT NULL REFERENCES bets(id),
  outcome_index   INT         NOT NULL,
  side            VARCHAR(4)  NOT NULL CHECK (side IN ('BUY', 'SELL')),
  shares          DECIMAL     NOT NULL CHECK (shares > 0),
  cost            DECIMAL     NOT NULL,            -- positive = paid (buy), positive = received (sell)
  price_at_trade  DECIMAL     NOT NULL,            -- marginal price at moment of trade
  avg_price       DECIMAL     NOT NULL,            -- average price per share for this trade
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- user_shares: aggregate position per user per bet per outcome
CREATE TABLE IF NOT EXISTS user_shares (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID    NOT NULL REFERENCES users(id),
  bet_id          UUID    NOT NULL REFERENCES bets(id),
  outcome_index   INT     NOT NULL,
  shares          DECIMAL NOT NULL DEFAULT 0,
  total_cost      DECIMAL NOT NULL DEFAULT 0,      -- total coins spent acquiring these shares (for avg cost)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, bet_id, outcome_index)
);

-- price_history: snapshots for charts (one row per trade)
CREATE TABLE IF NOT EXISTS price_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id          UUID NOT NULL REFERENCES bets(id),
  prices          JSONB NOT NULL,                  -- e.g. [0.62, 0.38]
  total_volume    DECIMAL NOT NULL DEFAULT 0,
  triggered_by    UUID REFERENCES trades(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 3. Indexes for performance
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_trades_user       ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_bet        ON trades(bet_id);
CREATE INDEX IF NOT EXISTS idx_trades_created    ON trades(created_at);
CREATE INDEX IF NOT EXISTS idx_user_shares_user  ON user_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shares_bet   ON user_shares(bet_id);
CREATE INDEX IF NOT EXISTS idx_price_history_bet ON price_history(bet_id);
CREATE INDEX IF NOT EXISTS idx_price_history_ts  ON price_history(created_at);

COMMIT;
