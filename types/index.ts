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
  ticketPrice?: number;
  requiresTicket?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- Stream Key / RTMP Types ----
export interface StreamConfig {
  roomId: string;
  streamKey: string;
  rtmpIngestUrl: string;
  rtmpFullUrl: string;
  whipUrl?: string;
  playbackUrl: string;
  status: 'idle' | 'live' | 'reconnecting';
  createdAt: string;
  lastActiveAt?: string;
}

export type ExternalPlatform = 'prism' | 'obs' | 'streamlabs' | 'vmix' | 'xsplit' | 'restream' | 'custom';

export interface MultistreamTarget {
  id: string;
  platform: ExternalPlatform;
  name: string;
  rtmpUrl: string;
  streamKey: string;
  enabled: boolean;
}

export interface ExternalStreamInput {
  platform: ExternalPlatform;
  ingestUrl: string;
  streamKey: string;
}

// ---- n8n / Automation Types ----
export type AutomationTrigger =
  | 'stream.started'
  | 'stream.ended'
  | 'viewer.joined'
  | 'viewer.left'
  | 'chat.message'
  | 'tip.received'
  | 'ticket.purchased'
  | 'subscriber.new'
  | 'room.created'
  | 'watchparty.started';

export interface AutomationWebhook {
  id: string;
  userId: string;
  name: string;
  targetUrl: string;
  secret: string;
  triggers: AutomationTrigger[];
  enabled: boolean;
  lastTriggeredAt?: string;
  failCount: number;
  createdAt: string;
}

export interface AutomationEvent {
  trigger: AutomationTrigger;
  timestamp: string;
  roomId?: string;
  userId?: string;
  data: Record<string, unknown>;
}

export interface N8nWorkflowConfig {
  webhookUrl: string;
  triggers: AutomationTrigger[];
  name: string;
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
  ticketPrice?: number;
  requiresTicket?: boolean;
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

// ============================================================
// MODULE 1: Advanced Streaming & Interaction Layer
// 20-Person Panels, Spotlight Mode, Vertical Cinema, Virtual Source
// ============================================================

export type PanelLayout = 'grid' | 'spotlight' | 'vertical-cinema' | 'sidebar';

export interface StreamPanelParticipant {
  id: string;
  userId: string;
  user?: User;
  streamId: string;
  role: 'host' | 'co-host' | 'guest' | 'viewer';
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  virtualCamera: boolean;
  spotlighted: boolean;
  raisedHand: boolean;
  joinedAt: string;
}

export interface StreamPanel {
  id: string;
  roomId: string;
  layout: PanelLayout;
  maxParticipants: number; // up to 20
  participants: StreamPanelParticipant[];
  spotlightUserId?: string;
  sfuNodeId?: string; // Mediasoup SFU node assignment
  createdAt: string;
  updatedAt: string;
}

export interface SpotlightEvent {
  type: 'spotlight' | 'unspotlight';
  userId: string;
  triggeredBy: string;
  timestamp: string;
}

export interface VirtualSourceConfig {
  type: 'camera' | 'virtual-camera' | 'screen-share' | 'screen-share-audio';
  deviceId?: string;
  label: string;
  constraints: {
    width?: number;
    height?: number;
    frameRate?: number;
    audioCaptureEnabled?: boolean;
  };
}

export interface VerticalCinemaConfig {
  mediaPlayerHeight: number; // percentage (default 50)
  panelGridHeight: number; // percentage (default 50)
  mediaSource: 'youtube' | 'vimeo' | 'rtmp' | 'direct-video' | 'custom';
  mediaUrl: string;
  syncEnabled: boolean;
}

// ============================================================
// MODULE 2: Guest Destinations & Multi-Platform RTMP Fanout
// FFmpeg Workers, Reach Multiplier, Validation & Status
// ============================================================

export type FanoutPlatform = 'youtube' | 'twitch' | 'tiktok' | 'facebook' | 'kick' | 'instagram' | 'x' | 'linkedin' | 'custom';

export type FanoutStatus = 'idle' | 'validating' | 'connected' | 'live' | 'error' | 'disconnected';

export interface GuestFanoutTarget {
  id: string;
  participantId: string;
  userId: string;
  platform: FanoutPlatform;
  displayName: string;
  rtmpUrl: string;
  streamKey: string;
  status: FanoutStatus;
  ffmpegWorkerId?: string;
  bitrate: number;
  resolution: string;
  lastValidatedAt?: string;
  validationError?: string;
  startedAt?: string;
  viewerCount?: number;
}

export interface FanoutSession {
  id: string;
  roomId: string;
  panelId: string;
  totalTargets: number;
  activeTargets: number;
  estimatedReach: number; // total concurrent streams across all guests
  targets: GuestFanoutTarget[];
  ffmpegClusterStatus: 'healthy' | 'degraded' | 'offline';
  createdAt: string;
}

export interface FFmpegWorker {
  id: string;
  nodeId: string;
  status: 'idle' | 'encoding' | 'overloaded' | 'offline';
  cpuUsage: number;
  memoryUsage: number;
  activeStreams: number;
  maxStreams: number;
  assignedTargets: string[];
}

export interface ReachMultiplierStats {
  totalParticipants: number;
  totalPlatforms: number;
  totalConcurrentStreams: number;
  estimatedTotalViewers: number;
  platformBreakdown: Record<FanoutPlatform, number>;
}

// ============================================================
// MODULE 3: Monetization Flywheel & 90/10 Split
// Embeddable Player, Golden Paywall, P2P Payments, SAAS, Marketplace
// ============================================================

export const PLATFORM_FEE_PERCENT = 10; // 10% platform fee (creator keeps 90%)
export const GOLDEN_PAYWALL_PREVIEW_SECONDS = 120; // 2-minute free preview

export type PaywallStatus = 'preview' | 'active' | 'expired' | 'paid' | 'bypassed';

export interface PaywallConfig {
  enabled: boolean;
  previewDurationSeconds: number; // default 120
  priceOptions: PaywallPriceOption[];
  blurIntensity: number; // 0-20, default 12
  ctaText: string;
  ctaSubtext: string;
}

export interface PaywallPriceOption {
  id: string;
  amount: number; // in cents ($0.99 = 99, $4.99 = 499)
  label: string;
  description?: string;
  duration?: 'single-view' | '24-hours' | 'lifetime';
}

export interface PaywallSession {
  id: string;
  viewerId: string;
  roomId: string;
  status: PaywallStatus;
  previewStartedAt: string;
  previewExpiresAt: string;
  paidAt?: string;
  amountPaid?: number;
  paymentMethod?: 'stripe' | 'p2p';
}

export interface EmbeddablePlayerConfig {
  roomId: string;
  width: string;
  height: string;
  autoplay: boolean;
  muted: boolean;
  paywallEnabled: boolean;
  theme: 'dark' | 'light';
  brandingEnabled: boolean;
  iframeUrl: string;
}

export type P2PPaymentProvider = 'paypal' | 'cashapp' | 'venmo' | 'zelle' | 'chime';

export interface P2PPaymentLink {
  id: string;
  creatorId: string;
  provider: P2PPaymentProvider;
  handle: string; // username, email, or phone for the P2P service
  displayLabel: string;
  enabled: boolean;
  qrCodeUrl?: string;
  createdAt: string;
}

export type CreatorSubscriptionTier = 'bronze' | 'silver' | 'gold';

export interface CreatorSubscriptionPlan {
  id: string;
  creatorId: string;
  tier: CreatorSubscriptionTier;
  name: string;
  priceMonthly: number; // Bronze $1, Silver $5, Gold $15
  features: string[];
  stripePriceId: string;
  subscriberCount: number;
  enabled: boolean;
}

export interface CreatorProduct {
  id: string;
  creatorId: string;
  name: string;
  description: string;
  type: 'digital' | 'physical' | 'service';
  priceInCents: number;
  imageUrl?: string;
  downloadUrl?: string; // for digital products
  inventory?: number; // for physical products
  stripePriceId: string;
  soldCount: number;
  enabled: boolean;
  createdAt: string;
}

export interface CreatorMarketplace {
  creatorId: string;
  storeName: string;
  storeDescription: string;
  products: CreatorProduct[];
  subscriptionPlans: CreatorSubscriptionPlan[];
  p2pLinks: P2PPaymentLink[];
  totalRevenue: number;
  totalSales: number;
}

// ============================================================
// MODULE 4: SwanyThree AI Trio & Security
// Vault Pro, AI Tools Wrapper Pro (LLMLingua), SwanyBot Guardian AI
// ============================================================

// ---- Vault Pro (AES-256-GCM Encryption) ----
export type VaultSecretType = 'api_key' | 'stream_key' | 'webhook_secret' | 'oauth_token' | 'encryption_key';

export interface VaultSecret {
  id: string;
  userId: string;
  name: string;
  type: VaultSecretType;
  encryptedValue: string; // AES-256-GCM encrypted
  iv: string; // initialization vector
  authTag: string; // GCM authentication tag
  rotationSchedule?: 'daily' | 'weekly' | 'monthly' | 'manual';
  lastRotatedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultAuditLog {
  id: string;
  secretId: string;
  userId: string;
  action: 'created' | 'accessed' | 'rotated' | 'deleted' | 'expired';
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// ---- AI Tools Wrapper Pro (LLMLingua + OpenRouter) ----
export interface LLMLinguaConfig {
  compressionRatio: number; // target 0.3-0.5 (50-70% compression)
  targetTokenCount?: number;
  preserveKeywords: string[];
  contextLevel: 'sentence' | 'paragraph' | 'document';
}

export interface CompressedPrompt {
  original: string;
  compressed: string;
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
  tokensSaved: number;
  estimatedCostSaved: number; // in USD
}

export interface AIToolsWrapperConfig {
  compressionEnabled: boolean;
  linguaConfig: LLMLinguaConfig;
  routingStrategy: 'cost-optimized' | 'performance' | 'balanced';
  fallbackChain: AIModel[];
  maxRetries: number;
  costBudgetPerDay: number; // in USD
  currentDaySpend: number;
}

// ---- SwanyBot Guardian AI (Moderation + Transcription + Clips) ----
export type ModerationAction = 'allow' | 'warn' | 'mute' | 'timeout' | 'ban';
export type ModerationCategory = 'spam' | 'harassment' | 'hate_speech' | 'nsfw' | 'self_harm' | 'violence' | 'misinformation' | 'scam';

export interface ModerationResult {
  messageId: string;
  content: string;
  flagged: boolean;
  categories: ModerationCategory[];
  confidence: number; // 0-1 (target 0.95 = 95% accuracy)
  action: ModerationAction;
  reason?: string;
  reviewedAt: string;
}

export interface ModerationConfig {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  autoActions: Record<ModerationCategory, ModerationAction>;
  allowedWords: string[];
  blockedWords: string[];
  maxWarningsBeforeTimeout: number;
  timeoutDurationMinutes: number;
}

export interface TranscriptionSegment {
  id: string;
  roomId: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
  language: string;
  confidence: number;
}

export interface HighlightClip {
  id: string;
  roomId: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  thumbnailUrl?: string;
  clipUrl?: string;
  score: number; // AI-generated importance score 0-100
  tags: string[];
  generatedBy: 'ai' | 'manual';
  createdAt: string;
}

// ============================================================
// MODULE 5: Communication & Automation
// MCP Gateway, Multilingual Chat, QR Codes
// ============================================================

// ---- MCP Gateway (Model Context Protocol) ----
export type MCPServerStatus = 'online' | 'offline' | 'degraded' | 'maintenance';
export type MCPCapability = 'database' | 'api-management' | 'security' | 'streaming' | 'analytics' | 'moderation' | 'translation';

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  status: MCPServerStatus;
  capabilities: MCPCapability[];
  version: string;
  healthCheckUrl: string;
  lastHealthCheck?: string;
  uptime: number; // percentage
  requestCount: number;
  avgResponseMs: number;
}

export interface MCPGatewayConfig {
  servers: MCPServer[];
  routingPolicy: 'round-robin' | 'least-loaded' | 'capability-match';
  rateLimitPerMinute: number;
  authRequired: boolean;
  apiKeyHash?: string;
}

export interface MCPRequest {
  serverId: string;
  capability: MCPCapability;
  action: string;
  params: Record<string, unknown>;
  timeout: number;
}

export interface MCPResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  serverid: string;
  processingTimeMs: number;
  timestamp: string;
}

// ---- Multilingual Universal Chat ----
export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'zh' | 'pt' | 'ar' | 'hi' | 'ru' | 'it' | 'nl' | 'pl' | 'tr' | 'vi' | 'th' | 'id' | 'sv' | 'da';

export interface TranslationConfig {
  enabled: boolean;
  sourceLanguage: SupportedLanguage;
  targetLanguages: SupportedLanguage[];
  autoDetect: boolean;
  showOriginal: boolean;
}

export interface TranslatedMessage extends ChatMessage {
  originalLanguage: SupportedLanguage;
  translations: Record<SupportedLanguage, string>;
  translatedAt: string;
}

export interface LiveCaptionConfig {
  enabled: boolean;
  language: SupportedLanguage;
  provider: 'whisper' | 'google' | 'azure';
  showSpeakerLabels: boolean;
  fontSize: number;
  position: 'top' | 'bottom' | 'overlay';
}

// ---- QR Code ----
export interface QRCodeConfig {
  type: 'join-room' | 'join-watchparty' | 'tip' | 'store' | 'invite';
  targetUrl: string;
  size: number;
  foregroundColor: string;
  backgroundColor: string;
  logoUrl?: string;
  expiresAt?: string;
}

// ============================================================
// MODULE 6: Extended WebSocket Events
// ============================================================

export type ExtendedWSEventType = WSEventType
  | 'panel:participant_join'
  | 'panel:participant_leave'
  | 'panel:spotlight'
  | 'panel:layout_change'
  | 'fanout:status_update'
  | 'fanout:target_live'
  | 'fanout:target_error'
  | 'paywall:preview_start'
  | 'paywall:preview_expired'
  | 'paywall:payment_received'
  | 'moderation:flagged'
  | 'moderation:action'
  | 'transcription:segment'
  | 'translation:message'
  | 'mcp:request'
  | 'mcp:response';
