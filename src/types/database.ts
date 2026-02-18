// Database types matching Supabase schema

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      communities: {
        Row: Community;
        Insert: Omit<Community, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Community, 'id'>>;
      };
      rooms: {
        Row: Room;
        Insert: Omit<Room, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Room, 'id'>>;
      };
      room_participants: {
        Row: RoomParticipant;
        Insert: Omit<RoomParticipant, 'id' | 'joined_at'>;
        Update: Partial<Omit<RoomParticipant, 'id'>>;
      };
      tips: {
        Row: Tip;
        Insert: Omit<Tip, 'id' | 'created_at'>;
        Update: Partial<Omit<Tip, 'id'>>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'id' | 'created_at'>;
        Update: Partial<Omit<Subscription, 'id'>>;
      };
      subscription_tiers: {
        Row: SubscriptionTier;
        Insert: Omit<SubscriptionTier, 'id' | 'created_at'>;
        Update: Partial<Omit<SubscriptionTier, 'id'>>;
      };
      virtual_goods: {
        Row: VirtualGood;
        Insert: Omit<VirtualGood, 'id' | 'created_at'>;
        Update: Partial<Omit<VirtualGood, 'id'>>;
      };
      user_purchases: {
        Row: UserPurchase;
        Insert: Omit<UserPurchase, 'id' | 'purchased_at'>;
        Update: Partial<Omit<UserPurchase, 'id'>>;
      };
      moderation_reports: {
        Row: ModerationReport;
        Insert: Omit<ModerationReport, 'id' | 'created_at'>;
        Update: Partial<Omit<ModerationReport, 'id'>>;
      };
      user_bans: {
        Row: UserBan;
        Insert: Omit<UserBan, 'id' | 'created_at'>;
        Update: Partial<Omit<UserBan, 'id'>>;
      };
      user_warnings: {
        Row: UserWarning;
        Insert: Omit<UserWarning, 'id' | 'created_at'>;
        Update: Partial<Omit<UserWarning, 'id'>>;
      };
      wallet_transactions: {
        Row: WalletTransaction;
        Insert: Omit<WalletTransaction, 'id' | 'created_at'>;
        Update: Partial<Omit<WalletTransaction, 'id'>>;
      };
      analytics_events: {
        Row: AnalyticsEvent;
        Insert: Omit<AnalyticsEvent, 'id'>;
        Update: Partial<Omit<AnalyticsEvent, 'id'>>;
      };
    };
  };
}

// Core types
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  wallet_balance: number;
  role: 'user' | 'moderator' | 'admin';
  is_verified: boolean;
  badges: string[];
  created_at: string;
  updated_at: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  cover_image_url: string | null;
  is_public: boolean;
  member_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  title: string;
  description: string | null;
  host_id: string;
  community_id: string | null;
  status: 'scheduled' | 'live' | 'ended';
  max_participants: number;
  is_recording: boolean;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  role: 'host' | 'co-host' | 'speaker' | 'listener';
  is_muted: boolean;
  is_hand_raised: boolean;
  auto_muted: boolean;
  spam_score: number;
  joined_at: string;
}

// Monetization types
export interface Tip {
  id: string;
  sender_id: string;
  recipient_id: string;
  room_id: string | null;
  amount: number;
  currency: string;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
}

export interface SubscriptionTier {
  id: string;
  community_id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: string[];
  max_subscribers: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier_id: string;
  community_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  cancelled_at: string | null;
  created_at: string;
}

export interface VirtualGood {
  id: string;
  name: string;
  description: string;
  category: 'badge' | 'emoji' | 'effect' | 'frame' | 'title';
  icon_url: string;
  price: number;
  currency: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  is_limited: boolean;
  stock: number | null;
  is_active: boolean;
  created_at: string;
}

export interface UserPurchase {
  id: string;
  user_id: string;
  good_id: string;
  price_paid: number;
  is_equipped: boolean;
  purchased_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'tip_sent' | 'tip_received' | 'purchase' | 'subscription' | 'refund' | 'reward';
  amount: number;
  balance_after: number;
  description: string;
  reference_id: string | null;
  created_at: string;
}

// Moderation types
export interface ModerationReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  room_id: string | null;
  community_id: string | null;
  reason: 'spam' | 'harassment' | 'hate_speech' | 'inappropriate_content' | 'impersonation' | 'other';
  description: string;
  evidence_urls: string[];
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  reviewed_by: string | null;
  resolution_note: string | null;
  created_at: string;
}

export interface UserBan {
  id: string;
  user_id: string;
  banned_by: string;
  community_id: string | null;
  room_id: string | null;
  reason: string;
  type: 'temporary' | 'permanent';
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UserWarning {
  id: string;
  user_id: string;
  issued_by: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  acknowledged: boolean;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  event_name: string;
  properties: Record<string, unknown>;
  user_id: string | null;
  timestamp: string;
}
