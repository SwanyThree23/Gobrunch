-- Gobrunch Platform Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT,
  wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  is_verified BOOLEAN DEFAULT false,
  badges TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- COMMUNITIES
-- ============================================
CREATE TABLE communities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE community_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin', 'owner')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- ============================================
-- ROOMS
-- ============================================
CREATE TABLE rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  max_participants INTEGER DEFAULT 100,
  is_recording BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE room_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'listener' CHECK (role IN ('host', 'co-host', 'speaker', 'listener')),
  is_muted BOOLEAN DEFAULT true,
  is_hand_raised BOOLEAN DEFAULT false,
  auto_muted BOOLEAN DEFAULT false,
  spam_score INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- ============================================
-- MONETIZATION: TIPS / DONATIONS
-- ============================================
CREATE TABLE tips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MONETIZATION: SUBSCRIPTIONS
-- ============================================
CREATE TABLE subscription_tiers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_monthly DECIMAL(10, 2) NOT NULL CHECK (price_monthly >= 0),
  price_yearly DECIMAL(10, 2) NOT NULL CHECK (price_yearly >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  features TEXT[] DEFAULT '{}',
  max_subscribers INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tier_id UUID REFERENCES subscription_tiers(id) ON DELETE CASCADE NOT NULL,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MONETIZATION: VIRTUAL GOODS / BADGES
-- ============================================
CREATE TABLE virtual_goods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('badge', 'emoji', 'effect', 'frame', 'title')),
  icon_url TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  is_limited BOOLEAN DEFAULT false,
  stock INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  good_id UUID REFERENCES virtual_goods(id) ON DELETE CASCADE NOT NULL,
  price_paid DECIMAL(10, 2) NOT NULL,
  is_equipped BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WALLET / TRANSACTIONS
-- ============================================
CREATE TABLE wallet_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'tip_sent', 'tip_received', 'purchase', 'subscription', 'refund', 'reward')),
  amount DECIMAL(12, 2) NOT NULL,
  balance_after DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MODERATION: REPORTS
-- ============================================
CREATE TABLE moderation_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'hate_speech', 'inappropriate_content', 'impersonation', 'other')),
  description TEXT NOT NULL DEFAULT '',
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id),
  resolution_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MODERATION: BANS
-- ============================================
CREATE TABLE user_bans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  banned_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('temporary', 'permanent')),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MODERATION: WARNINGS
-- ============================================
CREATE TABLE user_warnings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  issued_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ANALYTICS
-- ============================================
CREATE TABLE analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_communities_owner ON communities(owner_id);
CREATE INDEX idx_rooms_host ON rooms(host_id);
CREATE INDEX idx_rooms_community ON rooms(community_id);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_room_participants_room ON room_participants(room_id);
CREATE INDEX idx_room_participants_user ON room_participants(user_id);
CREATE INDEX idx_tips_sender ON tips(sender_id);
CREATE INDEX idx_tips_recipient ON tips(recipient_id);
CREATE INDEX idx_tips_room ON tips(room_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_community ON subscriptions(community_id);
CREATE INDEX idx_user_purchases_user ON user_purchases(user_id);
CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX idx_moderation_reports_status ON moderation_reports(status);
CREATE INDEX idx_moderation_reports_reported ON moderation_reports(reported_user_id);
CREATE INDEX idx_user_bans_user ON user_bans(user_id);
CREATE INDEX idx_user_bans_active ON user_bans(is_active);
CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Profiles: Users can read all, update own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Communities: Public readable, owner can modify
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "communities_select" ON communities FOR SELECT USING (is_public OR owner_id = auth.uid());
CREATE POLICY "communities_insert" ON communities FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "communities_update" ON communities FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "communities_delete" ON communities FOR DELETE USING (auth.uid() = owner_id);

-- Community members
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_members_select" ON community_members FOR SELECT USING (true);
CREATE POLICY "community_members_insert" ON community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "community_members_delete" ON community_members FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM communities WHERE id = community_id AND owner_id = auth.uid())
);

-- Rooms: Public readable, host can modify
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_select" ON rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert" ON rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "rooms_update" ON rooms FOR UPDATE USING (auth.uid() = host_id);

-- Room participants
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room_participants_select" ON room_participants FOR SELECT USING (true);
CREATE POLICY "room_participants_insert" ON room_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "room_participants_update" ON room_participants FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM rooms WHERE id = room_id AND host_id = auth.uid())
);
CREATE POLICY "room_participants_delete" ON room_participants FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM rooms WHERE id = room_id AND host_id = auth.uid())
);

-- Tips: Users can read own, create own
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tips_select" ON tips FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);
CREATE POLICY "tips_insert" ON tips FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Subscription tiers: Public readable, community owner can modify
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscription_tiers_select" ON subscription_tiers FOR SELECT USING (true);
CREATE POLICY "subscription_tiers_insert" ON subscription_tiers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM communities WHERE id = community_id AND owner_id = auth.uid())
);
CREATE POLICY "subscription_tiers_update" ON subscription_tiers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM communities WHERE id = community_id AND owner_id = auth.uid())
);

-- Subscriptions: Users can read own
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_insert" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subscriptions_update" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Virtual goods: Public readable
ALTER TABLE virtual_goods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "virtual_goods_select" ON virtual_goods FOR SELECT USING (true);

-- User purchases: Users can read own
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_purchases_select" ON user_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_purchases_insert" ON user_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_purchases_update" ON user_purchases FOR UPDATE USING (auth.uid() = user_id);

-- Wallet transactions: Users can read own
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet_transactions_select" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);

-- Moderation reports: Reporter and moderators can read
ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "moderation_reports_select" ON moderation_reports FOR SELECT USING (
  auth.uid() = reporter_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
);
CREATE POLICY "moderation_reports_insert" ON moderation_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "moderation_reports_update" ON moderation_reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
);

-- User bans: Moderators and admins can manage
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_bans_select" ON user_bans FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
);
CREATE POLICY "user_bans_insert" ON user_bans FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
);
CREATE POLICY "user_bans_update" ON user_bans FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
);

-- User warnings
ALTER TABLE user_warnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_warnings_select" ON user_warnings FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
);
CREATE POLICY "user_warnings_insert" ON user_warnings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
);

-- Analytics: Admins can read
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_events_select" ON analytics_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "analytics_events_insert" ON analytics_events FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER communities_updated_at BEFORE UPDATE ON communities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Process tip: deduct from sender, credit recipient, create transactions
CREATE OR REPLACE FUNCTION process_tip(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_room_id UUID,
  p_amount DECIMAL,
  p_message TEXT DEFAULT NULL,
  p_is_anonymous BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_tip_id UUID;
  v_sender_balance DECIMAL;
  v_recipient_balance DECIMAL;
BEGIN
  -- Check sender balance
  SELECT wallet_balance INTO v_sender_balance FROM profiles WHERE id = p_sender_id FOR UPDATE;
  IF v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct from sender
  UPDATE profiles SET wallet_balance = wallet_balance - p_amount WHERE id = p_sender_id
    RETURNING wallet_balance INTO v_sender_balance;

  -- Credit recipient (platform takes 10% fee)
  UPDATE profiles SET wallet_balance = wallet_balance + (p_amount * 0.90) WHERE id = p_recipient_id
    RETURNING wallet_balance INTO v_recipient_balance;

  -- Create tip record
  INSERT INTO tips (sender_id, recipient_id, room_id, amount, message, is_anonymous)
  VALUES (p_sender_id, p_recipient_id, p_room_id, p_amount, p_message, p_is_anonymous)
  RETURNING id INTO v_tip_id;

  -- Create transaction records
  INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference_id)
  VALUES
    (p_sender_id, 'tip_sent', -p_amount, v_sender_balance, 'Tip sent', v_tip_id),
    (p_recipient_id, 'tip_received', p_amount * 0.90, v_recipient_balance, 'Tip received', v_tip_id);

  RETURN v_tip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process virtual good purchase
CREATE OR REPLACE FUNCTION purchase_virtual_good(
  p_user_id UUID,
  p_good_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_purchase_id UUID;
  v_price DECIMAL;
  v_balance DECIMAL;
  v_stock INTEGER;
  v_is_limited BOOLEAN;
BEGIN
  -- Get good info
  SELECT price, stock, is_limited INTO v_price, v_stock, v_is_limited
  FROM virtual_goods WHERE id = p_good_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Virtual good not found or inactive';
  END IF;

  -- Check stock for limited items
  IF v_is_limited AND v_stock IS NOT NULL AND v_stock <= 0 THEN
    RAISE EXCEPTION 'Item is out of stock';
  END IF;

  -- Check balance
  SELECT wallet_balance INTO v_balance FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF v_balance < v_price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct balance
  UPDATE profiles SET wallet_balance = wallet_balance - v_price WHERE id = p_user_id
    RETURNING wallet_balance INTO v_balance;

  -- Reduce stock if limited
  IF v_is_limited THEN
    UPDATE virtual_goods SET stock = stock - 1 WHERE id = p_good_id;
  END IF;

  -- Create purchase
  INSERT INTO user_purchases (user_id, good_id, price_paid)
  VALUES (p_user_id, p_good_id, v_price)
  RETURNING id INTO v_purchase_id;

  -- Create transaction
  INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference_id)
  VALUES (p_user_id, 'purchase', -v_price, v_balance, 'Virtual good purchase', v_purchase_id);

  RETURN v_purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-mute spam detection
CREATE OR REPLACE FUNCTION check_spam_and_mute(
  p_room_id UUID,
  p_user_id UUID,
  p_message_count INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_new_score INTEGER;
  v_threshold INTEGER := 10;
BEGIN
  -- Increment spam score
  UPDATE room_participants
  SET spam_score = spam_score + p_message_count
  WHERE room_id = p_room_id AND user_id = p_user_id
  RETURNING spam_score INTO v_new_score;

  -- Auto-mute if threshold exceeded
  IF v_new_score >= v_threshold THEN
    UPDATE room_participants
    SET is_muted = true, auto_muted = true
    WHERE room_id = p_room_id AND user_id = p_user_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE tips;
ALTER PUBLICATION supabase_realtime ADD TABLE moderation_reports;
