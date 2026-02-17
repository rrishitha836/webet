-- WeBet initial schema generated from Prisma schema (2026-02-16)

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
CREATE TYPE user_role AS ENUM ('USER','ADMIN');
CREATE TYPE bet_status AS ENUM ('DRAFT','OPEN','PAUSED','CLOSED','RESOLVED','CANCELLED');
CREATE TYPE bet_source AS ENUM ('AI_GENERATED','MANUAL');
CREATE TYPE bet_category AS ENUM ('SPORTS','POLITICS','ENTERTAINMENT','TECHNOLOGY','CULTURE','OTHER');
CREATE TYPE wager_status AS ENUM ('ACTIVE','WON','LOST','REFUNDED');
CREATE TYPE suggestion_status AS ENUM ('PENDING','APPROVED','REJECTED');
CREATE TYPE report_reason_type AS ENUM ('INAPPROPRIATE','MISLEADING','DUPLICATE','OTHER');
CREATE TYPE report_status AS ENUM ('PENDING','RESOLVED','DISMISSED');
CREATE TYPE notification_type AS ENUM ('BET_RESOLVED','BET_CLOSING_SOON','BET_CANCELLED','WELCOME','DAILY_BONUS','ACHIEVEMENT');
CREATE TYPE rejection_reason AS ENUM ('DUPLICATE','INAPPROPRIATE','AMBIGUOUS','LOW_QUALITY','OTHER');

-- USERS
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id varchar(255) NOT NULL UNIQUE,
  email varchar(255) NOT NULL UNIQUE,
  display_name varchar(100) NOT NULL,
  avatar_url text,
  balance integer NOT NULL DEFAULT 1000,
  role user_role NOT NULL DEFAULT 'USER',
  is_suspended boolean NOT NULL DEFAULT false,
  total_bets integer NOT NULL DEFAULT 0,
  total_wins integer NOT NULL DEFAULT 0,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- BETS (winning_outcome_id FK added later)
CREATE TABLE bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(200) NOT NULL UNIQUE,
  short_id varchar(8) NOT NULL UNIQUE,
  title varchar(120) NOT NULL,
  description text NOT NULL,
  resolution_criteria text NOT NULL,
  category bet_category NOT NULL,
  status bet_status NOT NULL DEFAULT 'DRAFT',
  source bet_source NOT NULL,
  created_by uuid NOT NULL,
  close_time timestamptz NOT NULL,
  resolved_at timestamptz,
  winning_outcome_id uuid,
  cancel_reason text,
  total_pool integer NOT NULL DEFAULT 0,
  participant_count integer NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  reference_links text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_bets_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_bets_status_category ON bets (status, category);
CREATE INDEX idx_bets_close_time ON bets (close_time);
CREATE INDEX idx_bets_created_at ON bets (created_at);

-- OUTCOMES
CREATE TABLE outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id uuid NOT NULL,
  label varchar(60) NOT NULL,
  sort_order integer NOT NULL,
  total_wagers integer NOT NULL DEFAULT 0,
  total_coins integer NOT NULL DEFAULT 0,
  CONSTRAINT fk_outcomes_bet FOREIGN KEY (bet_id) REFERENCES bets(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX uq_outcomes_bet_label ON outcomes (bet_id, label);
CREATE INDEX idx_outcomes_bet_id ON outcomes (bet_id);

-- Add circular FK after outcomes exists
ALTER TABLE bets
  ADD CONSTRAINT fk_bets_winning_outcome
  FOREIGN KEY (winning_outcome_id) REFERENCES outcomes(id);

-- WAGERS
CREATE TABLE wagers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bet_id uuid NOT NULL,
  outcome_id uuid NOT NULL,
  amount integer NOT NULL,
  payout integer,
  status wager_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_wagers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wagers_bet FOREIGN KEY (bet_id) REFERENCES bets(id) ON DELETE CASCADE,
  CONSTRAINT fk_wagers_outcome FOREIGN KEY (outcome_id) REFERENCES outcomes(id)
);

CREATE UNIQUE INDEX uq_wagers_user_bet ON wagers (user_id, bet_id);
CREATE INDEX idx_wagers_bet_id ON wagers (bet_id);
CREATE INDEX idx_wagers_outcome_id ON wagers (outcome_id);

-- AI SUGGESTIONS
CREATE TABLE ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(120) NOT NULL,
  description text NOT NULL,
  outcomes jsonb NOT NULL,
  resolution_criteria text NOT NULL,
  suggested_deadline timestamptz NOT NULL,
  category bet_category NOT NULL,
  confidence_score real NOT NULL,
  source_links text[] NOT NULL DEFAULT ARRAY[]::text[],
  status suggestion_status NOT NULL DEFAULT 'PENDING',
  reviewed_by uuid,
  rejection_reason rejection_reason,
  published_bet_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  CONSTRAINT fk_ai_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id),
  CONSTRAINT fk_ai_published_bet FOREIGN KEY (published_bet_id) REFERENCES bets(id)
);

CREATE INDEX idx_ai_suggestions_status_created_at ON ai_suggestions (status, created_at);
CREATE INDEX idx_ai_suggestions_confidence_score ON ai_suggestions (confidence_score);

-- COMMENTS
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id uuid NOT NULL,
  user_id uuid NOT NULL,
  parent_id uuid,
  content varchar(500) NOT NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_comments_bet FOREIGN KEY (bet_id) REFERENCES bets(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id)
);

CREATE INDEX idx_comments_bet_id ON comments (bet_id);
CREATE INDEX idx_comments_user_id ON comments (user_id);

-- REPORTS
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  bet_id uuid,
  comment_id uuid,
  reason_type report_reason_type NOT NULL,
  description text,
  status report_status NOT NULL DEFAULT 'PENDING',
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_bet FOREIGN KEY (bet_id) REFERENCES bets(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_comment FOREIGN KEY (comment_id) REFERENCES comments(id),
  CONSTRAINT fk_reports_resolved_by FOREIGN KEY (resolved_by) REFERENCES users(id)
);

CREATE INDEX idx_reports_status ON reports (status);
CREATE INDEX idx_reports_bet_id ON reports (bet_id);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type notification_type NOT NULL,
  title varchar(100) NOT NULL,
  message text NOT NULL,
  bet_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_bet FOREIGN KEY (bet_id) REFERENCES bets(id)
);

CREATE INDEX idx_notifications_user_is_read ON notifications (user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications (created_at);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action varchar(50) NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id uuid NOT NULL,
  metadata jsonb,
  ip_address varchar(45),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_audit_admin FOREIGN KEY (admin_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_admin_created_at ON audit_logs (admin_id, created_at);
CREATE INDEX idx_audit_entity ON audit_logs (entity_type, entity_id);

-- TRIGGER TO SET updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_bets_set_updated_at
BEFORE UPDATE ON bets
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();
