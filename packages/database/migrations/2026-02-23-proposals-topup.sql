-- Market Proposals: Users can suggest new markets for admin review
CREATE TABLE IF NOT EXISTS market_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'OTHER',
  suggested_close_time TIMESTAMPTZ,
  outcomes TEXT[] NOT NULL DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proposals_user ON market_proposals(user_id);
CREATE INDEX idx_proposals_status ON market_proposals(status);

-- Daily Coin Top-up tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_topup_at TIMESTAMPTZ;
