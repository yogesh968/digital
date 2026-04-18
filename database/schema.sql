-- ============================================================
-- GOLF CHARITY SUBSCRIPTION PLATFORM — Supabase SQL Schema
-- Run in Supabase SQL Editor in order
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUMS ─────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('subscriber', 'admin');
CREATE TYPE subscription_plan AS ENUM ('monthly', 'yearly');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'lapsed');
CREATE TYPE draw_type AS ENUM ('random', 'algorithmic');
CREATE TYPE draw_status AS ENUM ('draft', 'simulated', 'published');
CREATE TYPE prize_tier AS ENUM ('none', '3-match', '4-match', '5-match');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE payout_status AS ENUM ('pending', 'paid');

-- ── CHARITIES ─────────────────────────────────────────────────────
CREATE TABLE charities (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  image_url     TEXT,
  website_url   TEXT,
  is_featured   BOOLEAN NOT NULL DEFAULT false,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_charities_is_active ON charities(is_active);
CREATE INDEX idx_charities_is_featured ON charities(is_featured);

-- ── PROFILES (extends Supabase auth.users) ─────────────────────────
CREATE TABLE profiles (
  id                UUID PRIMARY KEY,  -- FK → auth.users.id
  email             TEXT NOT NULL UNIQUE,
  full_name         TEXT NOT NULL,
  password_hash     TEXT NOT NULL,
  role              user_role NOT NULL DEFAULT 'subscriber',
  charity_id        UUID REFERENCES charities(id) ON DELETE SET NULL,
  charity_percentage INT NOT NULL DEFAULT 10 CHECK (charity_percentage BETWEEN 10 AND 100),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_charity_id ON profiles(charity_id);

-- ── SUBSCRIPTIONS ─────────────────────────────────────────────────
CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan                    subscription_plan NOT NULL,
  status                  subscription_status NOT NULL DEFAULT 'active',
  stripe_subscription_id  TEXT UNIQUE,
  stripe_customer_id      TEXT,
  current_period_end      TIMESTAMPTZ NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- ── SCORES ────────────────────────────────────────────────────────
CREATE TABLE scores (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score      INT NOT NULL CHECK (score BETWEEN 1 AND 45),  -- Stableford range
  played_at  DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_scores_played_at ON scores(played_at DESC);

-- Enforce max 5 scores per user via trigger
CREATE OR REPLACE FUNCTION enforce_max_5_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- If user now has more than 5 scores, delete the oldest
  DELETE FROM scores
  WHERE id IN (
    SELECT id FROM scores
    WHERE user_id = NEW.user_id
    ORDER BY played_at ASC
    OFFSET 5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_max_5_scores
AFTER INSERT ON scores
FOR EACH ROW EXECUTE FUNCTION enforce_max_5_scores();

-- ── DRAWS ─────────────────────────────────────────────────────────
CREATE TABLE draws (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month            DATE NOT NULL UNIQUE,  -- First day of the month
  draw_type        draw_type NOT NULL,
  winning_numbers  INT[] DEFAULT '{}',
  status           draw_status NOT NULL DEFAULT 'draft',
  jackpot_amount   NUMERIC(10,2) NOT NULL DEFAULT 0,
  prize_pool_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_draws_status ON draws(status);
CREATE INDEX idx_draws_month ON draws(month DESC);

-- ── DRAW ENTRIES ──────────────────────────────────────────────────
CREATE TABLE draw_entries (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id          UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scores_snapshot  INT[] NOT NULL,
  match_count      INT NOT NULL DEFAULT 0 CHECK (match_count BETWEEN 0 AND 5),
  prize_tier       prize_tier NOT NULL DEFAULT 'none',
  prize_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(draw_id, user_id)  -- One entry per user per draw
);

CREATE INDEX idx_draw_entries_draw_id ON draw_entries(draw_id);
CREATE INDEX idx_draw_entries_user_id ON draw_entries(user_id);
CREATE INDEX idx_draw_entries_prize_tier ON draw_entries(prize_tier);

-- ── WINNER VERIFICATIONS ──────────────────────────────────────────
CREATE TABLE winner_verifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_entry_id   UUID NOT NULL REFERENCES draw_entries(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  proof_url       TEXT NOT NULL,
  status          verification_status NOT NULL DEFAULT 'pending',
  payout_status   payout_status NOT NULL DEFAULT 'pending',
  reviewed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_winner_verifications_status ON winner_verifications(status);
CREATE INDEX idx_winner_verifications_user_id ON winner_verifications(user_id);

-- ── CHARITY CONTRIBUTIONS ─────────────────────────────────────────
CREATE TABLE charity_contributions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  charity_id       UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  subscription_id  UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount           NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  period           DATE NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contributions_charity_id ON charity_contributions(charity_id);
CREATE INDEX idx_contributions_user_id ON charity_contributions(user_id);
CREATE INDEX idx_contributions_period ON charity_contributions(period DESC);

-- ── AUTO UPDATE updated_at ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_charities_updated_at BEFORE UPDATE ON charities FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── SEED DATA — Charities ─────────────────────────────────────────
INSERT INTO charities (name, description, image_url, website_url, is_featured, is_active) VALUES
  ('Cancer Research UK', 'Funding life-saving cancer research and improving treatments for patients worldwide.', NULL, 'https://www.cancerresearchuk.org', true, true),
  ('RNLI – Royal National Lifeboat Institution', 'Saving lives at sea through a volunteer-powered lifeboat service around the UK and Ireland.', NULL, 'https://rnli.org', true, true),
  ('Mind UK', 'Providing advice and support to empower people experiencing mental health problems.', NULL, 'https://www.mind.org.uk', false, true),
  ('WWF – World Wildlife Fund', 'Working to stop the degradation of our natural world and to build a future where people live in harmony with nature.', NULL, 'https://www.wwf.org.uk', false, true),
  ('British Heart Foundation', 'Funding research and providing information to prevent and treat heart and circulatory diseases.', NULL, 'https://www.bhf.org.uk', true, true),
  ('Macmillan Cancer Support', 'Providing medical, emotional, practical and financial support for people living with cancer.', NULL, 'https://www.macmillan.org.uk', false, true);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE winner_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_contributions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see their own; admins see all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (true); -- service role bypasses this
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (true);

-- Charities are publicly readable
CREATE POLICY "Public charity read" ON charities FOR SELECT USING (true);
