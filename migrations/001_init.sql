-- initial schema for CY Live platform

-- Profiles table extends Supabase auth users
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_account_id text,
    total_earnings numeric(12,2) NOT NULL DEFAULT 0,
    subscriber_count integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Streams table
CREATE TABLE IF NOT EXISTS streams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    category text,
    mode text CHECK (mode IN ('public','private','unlisted')) NOT NULL DEFAULT 'public',
    status text CHECK (status IN ('offline','configuring','live','ended')) NOT NULL DEFAULT 'offline',
    encrypted_stream_key bytea NOT NULL,
    view_account_id uuid REFERENCES view_accounts(id),
    started_at timestamptz,
    ended_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- View accounts (tracking revenue & duration per viewing session)
CREATE TABLE IF NOT EXISTS view_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id uuid NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    viewer_id uuid REFERENCES profiles(id),
    revenue numeric(12,2) NOT NULL DEFAULT 0,
    duration integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Transactions with check constraints
CREATE TABLE IF NOT EXISTS transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id uuid NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    viewer_id uuid REFERENCES profiles(id),
    gross_amount numeric(12,2) NOT NULL CHECK (gross_amount >= 0),
    creator_amount numeric(12,2) NOT NULL,
    platform_amount numeric(12,2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (creator_amount = round(gross_amount * 0.9, 2)),
    CHECK (platform_amount = round(gross_amount * 0.1, 2)),
    CHECK (creator_amount + platform_amount = gross_amount)
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    viewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_subscription_id text NOT NULL UNIQUE,
    billing_period_start timestamptz NOT NULL,
    billing_period_end timestamptz NOT NULL,
    status text CHECK (status IN ('active','canceled','past_due','unpaid')) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id uuid NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES profiles(id),
    type text CHECK (type IN ('text','tip','subscription','system','moderation')) NOT NULL DEFAULT 'text',
    content jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    moderated boolean NOT NULL DEFAULT false
);

-- Stream guests
CREATE TABLE IF NOT EXISTS stream_guests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id uuid NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    muted boolean NOT NULL DEFAULT false,
    camera_off boolean NOT NULL DEFAULT false,
    joined_at timestamptz NOT NULL DEFAULT now(),
    left_at timestamptz
);

-- Domino arena tables
CREATE TABLE IF NOT EXISTS domino_rooms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text,
    owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS domino_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id uuid NOT NULL REFERENCES domino_rooms(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    elo_rating numeric(6,2) NOT NULL DEFAULT 1500
);

CREATE TABLE IF NOT EXISTS domino_ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id uuid NOT NULL REFERENCES domino_rooms(id) ON DELETE CASCADE,
    winner_id uuid REFERENCES profiles(id),
    loser_id uuid REFERENCES profiles(id),
    delta numeric(6,2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- N8N events logging
CREATE TABLE IF NOT EXISTS n8n_webhooks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    payload jsonb,
    status text CHECK (status IN ('pending','success','failed')) NOT NULL DEFAULT 'pending',
    attempt integer NOT NULL DEFAULT 0,
    last_attempt_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Triggers for profile earnings and subscriber count

CREATE OR REPLACE FUNCTION update_profile_earnings() RETURNS trigger AS $$
BEGIN
    UPDATE profiles
    SET total_earnings = total_earnings + NEW.creator_amount
    WHERE id = NEW.stream_id::uuid;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transactions_earnings
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_profile_earnings();

CREATE OR REPLACE FUNCTION update_subscriber_count() RETURNS trigger AS $$
BEGIN
    UPDATE profiles
    SET subscriber_count = (
        SELECT count(*) FROM subscriptions WHERE creator_id = NEW.creator_id AND status = 'active'
    )
    WHERE id = NEW.creator_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subscriptions_count
AFTER INSERT OR UPDATE OR DELETE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscriber_count();
