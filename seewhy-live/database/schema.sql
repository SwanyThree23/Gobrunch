-- SeeWhy LIVE Platform - Database Schema
-- PostgreSQL 12+ Required
-- Complete schema with constraints, triggers, indexes, views

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE 1: users
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_suspended BOOLEAN DEFAULT FALSE,
  suspension_reason TEXT,
  last_login_at TIMESTAMP WITH TIME ZONE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 2: user_payment_methods
-- ============================================
CREATE TABLE user_payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL CHECK (
    provider IN ('paypal', 'cashapp', 'venmo', 'zelle', 'chime')
  ),
  encrypted_credentials TEXT NOT NULL,
  encryption_iv VARCHAR(64) NOT NULL,
  encryption_tag VARCHAR(64) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  verified_at TIMESTAMP WITH TIME ZONE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

-- ============================================
-- TABLE 3: payment_transactions
-- ============================================
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idempotency_key VARCHAR(255) UNIQUE,
  from_user_id UUID NOT NULL REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'USD',
  provider VARCHAR(20) NOT NULL CHECK (
    provider IN ('paypal', 'cashapp', 'venmo', 'zelle', 'chime')
  ),
  provider_transaction_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed')
  ),
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (from_user_id != to_user_id)
);

-- ============================================
-- TABLE 4: video_posts
-- ============================================
CREATE TABLE video_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  video_url VARCHAR(500) NOT NULL,
  hls_url VARCHAR(500),
  original_filename VARCHAR(255),
  mime_type VARCHAR(50),
  file_size BIGINT,
  duration INTEGER NOT NULL CHECK (duration > 0 AND duration <= 600),
  width INTEGER,
  height INTEGER,
  bitrate INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (
    status IN ('processing', 'ready', 'failed', 'flagged', 'removed')
  ),
  processing_progress INTEGER DEFAULT 0 CHECK (
    processing_progress >= 0 AND processing_progress <= 100
  ),
  moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (
    moderation_status IN ('pending', 'approved', 'flagged', 'rejected')
  ),
  moderation_reason TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 5: video_thumbnails
-- ============================================
CREATE TABLE video_thumbnails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES video_posts(id) ON DELETE CASCADE,
  thumbnail_url VARCHAR(500) NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  width INTEGER,
  height INTEGER,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 6: video_views
-- ============================================
CREATE TABLE video_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES video_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  watch_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 7: video_likes
-- ============================================
CREATE TABLE video_likes (
  video_id UUID NOT NULL REFERENCES video_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (video_id, user_id)
);

-- ============================================
-- TABLE 8: multi_panel_rooms
-- ============================================
CREATE TABLE multi_panel_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  max_participants INTEGER DEFAULT 16 CHECK (
    max_participants >= 2 AND max_participants <= 16
  ),
  is_active BOOLEAN DEFAULT TRUE,
  is_private BOOLEAN DEFAULT FALSE,
  enable_paywall BOOLEAN DEFAULT FALSE,
  paywall_amount DECIMAL(10, 2) CHECK (
    paywall_amount IS NULL OR paywall_amount > 0
  ),
  paywall_currency VARCHAR(3) DEFAULT 'USD',
  enable_audio_only BOOLEAN DEFAULT FALSE,
  recording_enabled BOOLEAN DEFAULT FALSE,
  stream_key VARCHAR(100) UNIQUE,
  version INTEGER DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 9: room_participants
-- ============================================
CREATE TABLE room_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES multi_panel_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  panel_position INTEGER NOT NULL CHECK (
    panel_position >= 0 AND panel_position <= 15
  ),
  role VARCHAR(20) DEFAULT 'viewer' CHECK (
    role IN ('host', 'co-host', 'speaker', 'viewer')
  ),
  is_muted BOOLEAN DEFAULT FALSE,
  is_video_off BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (room_id, panel_position),
  UNIQUE (room_id, user_id)
);

-- ============================================
-- TABLE 10: room_paywall_access
-- ============================================
CREATE TABLE room_paywall_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES multi_panel_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES payment_transactions(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (room_id, user_id)
);

-- ============================================
-- TABLE 11: room_invites
-- ============================================
CREATE TABLE room_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES multi_panel_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id),
  invite_token VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'declined', 'expired')
  ),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (room_id, user_id)
);

-- ============================================
-- TABLE 12: share_links
-- ============================================
CREATE TABLE share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type VARCHAR(20) NOT NULL CHECK (
    content_type IN ('video', 'room', 'profile')
  ),
  share_token VARCHAR(100) UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  platform VARCHAR(20),
  custom_title VARCHAR(200),
  custom_description TEXT,
  custom_thumbnail_url VARCHAR(500),
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 13: external_views
-- ============================================
CREATE TABLE external_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_token VARCHAR(100) NOT NULL REFERENCES share_links(share_token) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  user_agent TEXT,
  referrer VARCHAR(500),
  platform VARCHAR(50),
  country VARCHAR(2),
  city VARCHAR(100),
  device_type VARCHAR(20),
  browser VARCHAR(50),
  os VARCHAR(50),
  session_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- VIEW 1: video_analytics
-- ============================================
CREATE OR REPLACE VIEW video_analytics AS
SELECT
  vp.id AS video_id,
  vp.title,
  vp.user_id,
  vp.status,
  vp.duration,
  vp.created_at,
  COALESCE(vw.view_count, 0) AS view_count,
  COALESCE(vl.like_count, 0) AS like_count,
  COALESCE(ev.external_view_count, 0) AS external_view_count,
  COALESCE(vw.avg_watch_duration, 0) AS avg_watch_duration,
  COALESCE(vw.unique_viewers, 0) AS unique_viewers
FROM video_posts vp
LEFT JOIN (
  SELECT
    video_id,
    COUNT(*) AS view_count,
    AVG(watch_duration) AS avg_watch_duration,
    COUNT(DISTINCT ip_address) AS unique_viewers
  FROM video_views
  GROUP BY video_id
) vw ON vp.id = vw.video_id
LEFT JOIN (
  SELECT video_id, COUNT(*) AS like_count
  FROM video_likes
  GROUP BY video_id
) vl ON vp.id = vl.video_id
LEFT JOIN (
  SELECT
    sl.content_id,
    COUNT(ev2.id) AS external_view_count
  FROM share_links sl
  JOIN external_views ev2 ON sl.share_token = ev2.share_token
  WHERE sl.content_type = 'video'
  GROUP BY sl.content_id
) ev ON vp.id = ev.content_id;

-- ============================================
-- VIEW 2: user_earnings
-- ============================================
CREATE OR REPLACE VIEW user_earnings AS
SELECT
  u.id AS user_id,
  u.username,
  u.display_name,
  COALESCE(received.total_received, 0) AS total_received,
  COALESCE(received.payment_count, 0) AS payment_count,
  COALESCE(paywall.paywall_sales, 0) AS paywall_sales,
  COALESCE(paywall.paywall_revenue, 0) AS paywall_revenue,
  COALESCE(received.total_received, 0) + COALESCE(paywall.paywall_revenue, 0) AS total_earnings
FROM users u
LEFT JOIN (
  SELECT
    to_user_id,
    SUM(amount) AS total_received,
    COUNT(*) AS payment_count
  FROM payment_transactions
  WHERE status = 'completed'
  GROUP BY to_user_id
) received ON u.id = received.to_user_id
LEFT JOIN (
  SELECT
    mpr.host_user_id,
    COUNT(DISTINCT rpa.id) AS paywall_sales,
    SUM(mpr.paywall_amount) AS paywall_revenue
  FROM multi_panel_rooms mpr
  JOIN room_paywall_access rpa ON mpr.id = rpa.room_id
  WHERE mpr.enable_paywall = TRUE
  GROUP BY mpr.host_user_id
) paywall ON u.id = paywall.host_user_id;

-- ============================================
-- INDEXES
-- ============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Payment methods indexes
CREATE INDEX idx_user_payment_methods_user_id ON user_payment_methods(user_id);
CREATE INDEX idx_user_payment_methods_provider ON user_payment_methods(provider);

-- Payment transactions indexes
CREATE INDEX idx_payment_transactions_from_user ON payment_transactions(from_user_id);
CREATE INDEX idx_payment_transactions_to_user ON payment_transactions(to_user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_provider ON payment_transactions(provider);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX idx_payment_transactions_idempotency ON payment_transactions(idempotency_key);

-- Video posts indexes
CREATE INDEX idx_video_posts_user_id ON video_posts(user_id);
CREATE INDEX idx_video_posts_status ON video_posts(status);
CREATE INDEX idx_video_posts_created_at ON video_posts(created_at);
CREATE INDEX idx_video_posts_public_ready ON video_posts(is_public, status)
  WHERE is_public = TRUE AND status = 'ready';

-- Video thumbnails indexes
CREATE INDEX idx_video_thumbnails_video_id ON video_thumbnails(video_id);

-- Video views indexes
CREATE INDEX idx_video_views_video_id ON video_views(video_id);
CREATE INDEX idx_video_views_user_id ON video_views(user_id);
CREATE INDEX idx_video_views_ip_address ON video_views(ip_address);
CREATE INDEX idx_video_views_created_at ON video_views(created_at);
CREATE INDEX idx_video_views_dedup ON video_views(video_id, ip_address, created_at);

-- Video likes indexes
CREATE INDEX idx_video_likes_video_id ON video_likes(video_id);
CREATE INDEX idx_video_likes_user_id ON video_likes(user_id);

-- Room indexes
CREATE INDEX idx_rooms_host_user_id ON multi_panel_rooms(host_user_id);
CREATE INDEX idx_rooms_is_active ON multi_panel_rooms(is_active);
CREATE INDEX idx_rooms_created_at ON multi_panel_rooms(created_at);

-- Room participants indexes
CREATE INDEX idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX idx_room_participants_user_id ON room_participants(user_id);

-- Room paywall access indexes
CREATE INDEX idx_room_paywall_room_id ON room_paywall_access(room_id);
CREATE INDEX idx_room_paywall_user_id ON room_paywall_access(user_id);
CREATE INDEX idx_room_paywall_expires ON room_paywall_access(expires_at);

-- Room invites indexes
CREATE INDEX idx_room_invites_room_id ON room_invites(room_id);
CREATE INDEX idx_room_invites_user_id ON room_invites(user_id);
CREATE INDEX idx_room_invites_token ON room_invites(invite_token);

-- Share links indexes
CREATE INDEX idx_share_links_content ON share_links(content_id, content_type);
CREATE INDEX idx_share_links_token ON share_links(share_token);
CREATE INDEX idx_share_links_created_by ON share_links(created_by);
CREATE INDEX idx_share_links_created_at ON share_links(created_at);

-- External views indexes
CREATE INDEX idx_external_views_token ON external_views(share_token);
CREATE INDEX idx_external_views_ip ON external_views(ip_address);
CREATE INDEX idx_external_views_platform ON external_views(platform);
CREATE INDEX idx_external_views_created_at ON external_views(created_at);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_payment_methods_updated_at
  BEFORE UPDATE ON user_payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_video_posts_updated_at
  BEFORE UPDATE ON video_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_rooms_updated_at
  BEFORE UPDATE ON multi_panel_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_share_links_updated_at
  BEFORE UPDATE ON share_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Duration validation trigger (additional server-side enforcement)
CREATE OR REPLACE FUNCTION validate_video_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.duration > 600 THEN
    RAISE EXCEPTION 'Video duration exceeds maximum of 600 seconds (10 minutes)';
  END IF;
  IF NEW.duration <= 0 THEN
    RAISE EXCEPTION 'Video duration must be greater than 0';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_video_duration
  BEFORE INSERT OR UPDATE ON video_posts
  FOR EACH ROW EXECUTE FUNCTION validate_video_duration();

-- Increment share view count trigger
CREATE OR REPLACE FUNCTION increment_share_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE share_links
  SET view_count = view_count + 1
  WHERE share_token = NEW.share_token;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_share_views
  AFTER INSERT ON external_views
  FOR EACH ROW EXECUTE FUNCTION increment_share_view_count();

-- Prevent duplicate views within 24 hours
CREATE OR REPLACE FUNCTION check_duplicate_view()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM video_views
    WHERE video_id = NEW.video_id
      AND ip_address = NEW.ip_address
      AND created_at > NOW() - INTERVAL '24 hours'
  ) THEN
    RETURN NULL; -- silently skip duplicate
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_duplicate_view
  BEFORE INSERT ON video_views
  FOR EACH ROW EXECUTE FUNCTION check_duplicate_view();

-- Validate room participant count
CREATE OR REPLACE FUNCTION validate_room_participant_count()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM room_participants
  WHERE room_id = NEW.room_id AND left_at IS NULL;

  SELECT max_participants INTO max_count
  FROM multi_panel_rooms
  WHERE id = NEW.room_id;

  IF current_count >= max_count THEN
    RAISE EXCEPTION 'Room has reached maximum participant limit of %', max_count;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_room_participants
  BEFORE INSERT ON room_participants
  FOR EACH ROW EXECUTE FUNCTION validate_room_participant_count();

-- Validate paywall access expiry
CREATE OR REPLACE FUNCTION validate_paywall_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at <= NOW() THEN
    RAISE EXCEPTION 'Paywall access expiry must be in the future';
  END IF;
  -- Default 24-hour access
  IF NEW.expires_at > NOW() + INTERVAL '25 hours' THEN
    NEW.expires_at := NOW() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_paywall_access
  BEFORE INSERT ON room_paywall_access
  FOR EACH ROW EXECUTE FUNCTION validate_paywall_access();

-- ============================================
-- SEED DATA (Optional - for development)
-- ============================================

-- Run this section only in development
-- INSERT INTO users (username, email, password_hash, display_name)
-- VALUES
--   ('admin', 'admin@seewhy.live', '$2b$12$...', 'Admin'),
--   ('testuser', 'test@seewhy.live', '$2b$12$...', 'Test User');
