import type { PricingPlan, AIModel } from '@/types';

// ---- App Constants ----
export const APP_NAME = 'SeeWhy LIVE';
export const APP_DESCRIPTION = 'Enterprise live streaming platform by SWANYTHREE EntTech';
export const APP_VERSION = '1.1.0';

// ---- API Configuration ----
export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
export const OPENROUTER_REFERER = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ---- Default AI Model ----
export const DEFAULT_AI_MODEL: AIModel = 'openai/gpt-4o';

export const AI_MODELS: { id: AIModel; name: string; description: string }[] = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'Fast and capable multimodal model' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Excellent for analysis and conversation' },
  { id: 'google/gemini-pro', name: 'Gemini Pro', description: 'Strong general-purpose model' },
  { id: 'meta-llama/llama-3-70b', name: 'Llama 3 70B', description: 'Open-source powerhouse' },
];

// ---- Room Limits ----
export const ROOM_LIMITS = {
  free: { maxRooms: 2, maxViewers: 50, maxWatchPartySize: 5 },
  pro: { maxRooms: 20, maxViewers: 5000, maxWatchPartySize: 25 },
  enterprise: { maxRooms: -1, maxViewers: 100000, maxWatchPartySize: 50 },
} as const;

// ---- WebSocket Events ----
export const WS_EVENTS = {
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_UPDATE: 'room:update',
  CHAT_MESSAGE: 'chat:message',
  CHAT_TYPING: 'chat:typing',
  CHAT_REACTION: 'chat:reaction',
  WATCHPARTY_SYNC: 'watchparty:sync',
  WATCHPARTY_PARTICIPANT_JOIN: 'watchparty:participant_join',
  WATCHPARTY_PARTICIPANT_LEAVE: 'watchparty:participant_leave',
  WATCHPARTY_REACTION: 'watchparty:reaction',
  VIEWER_COUNT: 'viewer:count',
  ERROR: 'error',
} as const;

// ---- Pricing Plans ----
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Starter',
    tier: 'free',
    priceMonthly: 0,
    priceYearly: 0,
    stripePriceIdMonthly: '',
    stripePriceIdYearly: '',
    features: [
      'Up to 2 rooms',
      '50 viewers per room',
      'Basic chat',
      'Watch parties (5 participants)',
      'Community support',
    ],
    maxRooms: 2,
    maxViewersPerRoom: 50,
    maxWatchPartySize: 5,
    aiAssistantEnabled: false,
    recordingEnabled: false,
    analyticsEnabled: false,
  },
  {
    id: 'pro',
    name: 'Professional',
    tier: 'pro',
    priceMonthly: 29,
    priceYearly: 290,
    stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
    stripePriceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
    features: [
      'Up to 20 rooms',
      '5,000 viewers per room',
      'AI Assistant (OpenRouter)',
      'Watch parties (25 participants)',
      'Stream recording',
      'Analytics dashboard',
      'Priority support',
    ],
    maxRooms: 20,
    maxViewersPerRoom: 5000,
    maxWatchPartySize: 25,
    aiAssistantEnabled: true,
    recordingEnabled: true,
    analyticsEnabled: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    priceMonthly: 99,
    priceYearly: 990,
    stripePriceIdMonthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
    stripePriceIdYearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '',
    features: [
      'Unlimited rooms',
      '100,000 viewers per room',
      'AI Assistant (all models)',
      'Watch parties (50 participants)',
      'HD recording & storage',
      'Advanced analytics',
      'Custom branding',
      'Dedicated support',
      'SLA guarantee',
    ],
    maxRooms: -1,
    maxViewersPerRoom: 100000,
    maxWatchPartySize: 50,
    aiAssistantEnabled: true,
    recordingEnabled: true,
    analyticsEnabled: true,
  },
];

// ---- Chat Constants ----
export const MAX_CHAT_MESSAGE_LENGTH = 2000;
export const CHAT_HISTORY_LIMIT = 200;

// ---- AI System Prompts ----
export const AI_SYSTEM_PROMPT = `You are SeeWhy AI, an intelligent assistant integrated into the SeeWhy LIVE streaming platform. You help viewers and hosts with:
- Answering questions about the content being streamed or watched
- Summarizing discussions in the chat
- Providing relevant information related to the video/stream topic
- Helping hosts manage their rooms and engage with viewers
Keep responses concise and helpful. Be friendly but professional.`;

export const AI_WATCHPARTY_PROMPT = `You are SeeWhy AI, assisting in a Watch Party session. The group is watching a video together. Help by:
- Answering questions about the video content
- Suggesting discussion topics
- Providing fun facts or trivia related to the video
- Summarizing key moments if asked
Keep responses brief and engaging for a group setting.`;
