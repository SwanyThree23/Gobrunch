// ============================================================
// SeeWhy LIVE - Core Type Definitions
// Enterprise Live Streaming Platform by SWANYTHREE EntTech
// ============================================================

// ---- User Types ----
export type UserRole = 'viewer' | 'host' | 'moderator' | 'admin';
export type UserStatus = 'online' | 'away' | 'offline';
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  subscription: SubscriptionTier;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  bio?: string;
  socialLinks?: SocialLinks;
  totalViewers: number;
  totalStreams: number;
  totalWatchParties: number;
}

export interface SocialLinks {
  twitter?: string;
  youtube?: string;
  twitch?: string;
  website?: string;
}

// ---- Auth Types ----
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends AuthCredentials {
  username: string;
  displayName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// ---- Room Types ----
export type RoomStatus = 'scheduled' | 'live' | 'ended' | 'archived';
export type RoomVisibility = 'public' | 'private' | 'unlisted';

export interface Room {
  id: string;
  title: string;
  description: string;
  hostId: string;
  host?: User;
  status: RoomStatus;
  visibility: RoomVisibility;
  thumbnailUrl?: string;
  streamUrl?: string;
  maxViewers: number;
  currentViewers: number;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  tags: string[];
  chatEnabled: boolean;
  recordingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoomCreatePayload {
  title: string;
  description: string;
  visibility: RoomVisibility;
  maxViewers?: number;
  scheduledAt?: string;
  tags?: string[];
  chatEnabled?: boolean;
  recordingEnabled?: boolean;
}

export interface RoomUpdatePayload extends Partial<RoomCreatePayload> {
  status?: RoomStatus;
}

// ---- WatchParty Types ----
export type WatchPartyStatus = 'waiting' | 'playing' | 'paused' | 'ended';

export interface WatchParty {
  id: string;
  roomId: string;
  room?: Room;
  hostId: string;
  host?: User;
  title: string;
  videoUrl: string;
  videoSource: 'youtube' | 'vimeo' | 'custom' | 'upload';
  status: WatchPartyStatus;
  currentTime: number;
  playbackRate: number;
  participants: WatchPartyParticipant[];
  maxParticipants: number;
  inviteCode: string;
  chatEnabled: boolean;
  aiAssistantEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WatchPartyParticipant {
  userId: string;
  user?: User;
  joinedAt: string;
  isReady: boolean;
  reaction?: string;
}

export interface WatchPartyCreatePayload {
  title: string;
  videoUrl: string;
  videoSource: WatchParty['videoSource'];
  maxParticipants?: number;
  chatEnabled?: boolean;
  aiAssistantEnabled?: boolean;
}

export interface WatchPartySyncEvent {
  type: 'play' | 'pause' | 'seek' | 'rate_change' | 'ready' | 'reaction';
  timestamp: number;
  userId: string;
  data: {
    currentTime?: number;
    playbackRate?: number;
    reaction?: string;
  };
}

// ---- Chat Types ----
export type ChatMessageType = 'text' | 'system' | 'ai_response' | 'reaction' | 'pinned';

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  user?: User;
  type: ChatMessageType;
  content: string;
  replyToId?: string;
  isPinned: boolean;
  reactions: Record<string, string[]>;
  createdAt: string;
}

export interface ChatSendPayload {
  roomId: string;
  content: string;
  type?: ChatMessageType;
  replyToId?: string;
}

// ---- OpenRouter AI Types ----
export type AIModel = 'openai/gpt-4o' | 'anthropic/claude-3.5-sonnet' | 'google/gemini-pro' | 'meta-llama/llama-3-70b';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequest {
  model: AIModel;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: OpenRouterMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIAssistantContext {
  roomId: string;
  watchPartyId?: string;
  videoTitle?: string;
  conversationHistory: OpenRouterMessage[];
}

// ---- Stripe / Payment Types ----
export interface PricingPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  priceMonthly: number;
  priceYearly: number;
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  features: string[];
  maxRooms: number;
  maxViewersPerRoom: number;
  maxWatchPartySize: number;
  aiAssistantEnabled: boolean;
  recordingEnabled: boolean;
  analyticsEnabled: boolean;
}

export interface CheckoutPayload {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

// ---- Stripe Connect Types ----
export type ConnectAccountStatus = 'not_created' | 'onboarding' | 'active' | 'restricted' | 'disabled';

export interface ConnectAccount {
  accountId: string;
  userId: string;
  status: ConnectAccountStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  currentlyDue: string[];
  createdAt: string;
}

export interface CreatorEarnings {
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  lastPayoutDate?: string;
  lastPayoutAmount?: number;
  transactions: EarningsTransaction[];
}

export interface EarningsTransaction {
  id: string;
  type: 'tip' | 'subscription' | 'ticket' | 'payout';
  amount: number;
  fee: number;
  net: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  fromUser?: string;
}

export interface DirectChargePayload {
  amount: number;
  currency?: string;
  connectedAccountId: string;
  applicationFeePercent?: number;
  description?: string;
  metadata?: Record<string, string>;
}

export interface TipPayload {
  creatorId: string;
  amount: number;
  message?: string;
  roomId?: string;
}

// ---- VDO.Ninja Types ----
export interface VDONinjaConfig {
  roomId: string;
  pushId?: string;
  viewId?: string;
  password?: string;
  quality?: number;
  bitrate?: number;
  audiobitrate?: number;
  stereo?: boolean;
  proaudio?: boolean;
  meshcast?: boolean;
  label?: string;
  transparent?: boolean;
}

export type VDONinjaRole = 'director' | 'publisher' | 'viewer';

export interface VDONinjaRoom {
  roomName: string;
  apiKey?: string;
  role: VDONinjaRole;
  config: VDONinjaConfig;
  iframeUrl: string;
}

export interface VDONinjaCommand {
  action: string;
  target?: string;
  value?: string | number | boolean;
}

// ---- Social Stream / Caption Types ----
export interface SocialStreamConfig {
  enabled: boolean;
  platforms: ('youtube' | 'twitch' | 'facebook' | 'kick')[];
  overlayMode: boolean;
  ttsEnabled: boolean;
}

export interface CaptionConfig {
  enabled: boolean;
  language: string;
  fontSize: number;
  position: 'top' | 'bottom';
}

// ---- WebSocket Event Types ----
export type WSEventType =
  | 'room:join'
  | 'room:leave'
  | 'room:update'
  | 'chat:message'
  | 'chat:typing'
  | 'chat:reaction'
  | 'watchparty:sync'
  | 'watchparty:participant_join'
  | 'watchparty:participant_leave'
  | 'watchparty:reaction'
  | 'viewer:count'
  | 'error';

export interface WSEvent<T = unknown> {
  type: WSEventType;
  payload: T;
  timestamp: number;
  userId?: string;
}

// ---- API Response Types ----
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---- Dashboard / Analytics Types ----
export interface DashboardStats {
  totalRooms: number;
  activeRooms: number;
  totalViewers: number;
  totalWatchParties: number;
  revenueThisMonth: number;
  viewerGrowth: number;
}

export interface AnalyticsDataPoint {
  date: string;
  viewers: number;
  streams: number;
  watchParties: number;
  revenue: number;
}
