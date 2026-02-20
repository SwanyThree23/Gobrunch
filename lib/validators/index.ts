import { z } from 'zod';

// ---- Auth Validators ----
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  displayName: z.string().min(1, 'Display name is required').max(50),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// ---- Room Validators ----
export const roomCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).default(''),
  visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
  maxViewers: z.number().int().min(1).max(100000).default(1000),
  scheduledAt: z.string().datetime().optional(),
  tags: z.array(z.string().max(30)).max(10).default([]),
  chatEnabled: z.boolean().default(true),
  recordingEnabled: z.boolean().default(false),
});

export const roomUpdateSchema = roomCreateSchema.partial().extend({
  status: z.enum(['scheduled', 'live', 'ended', 'archived']).optional(),
});

// ---- WatchParty Validators ----
export const watchPartyCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  videoUrl: z.string().url('Invalid video URL'),
  videoSource: z.enum(['youtube', 'vimeo', 'custom', 'upload']),
  maxParticipants: z.number().int().min(2).max(50).default(10),
  chatEnabled: z.boolean().default(true),
  aiAssistantEnabled: z.boolean().default(false),
});

export const watchPartySyncSchema = z.object({
  type: z.enum(['play', 'pause', 'seek', 'rate_change', 'ready', 'reaction']),
  data: z.object({
    currentTime: z.number().optional(),
    playbackRate: z.number().min(0.25).max(4).optional(),
    reaction: z.string().max(10).optional(),
  }),
});

// ---- Chat Validators ----
export const chatMessageSchema = z.object({
  roomId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  type: z.enum(['text', 'system', 'ai_response', 'reaction', 'pinned']).default('text'),
  replyToId: z.string().uuid().optional(),
});

// ---- OpenRouter AI Validators ----
export const aiChatSchema = z.object({
  message: z.string().min(1).max(4000),
  model: z
    .enum([
      'openai/gpt-4o',
      'anthropic/claude-3.5-sonnet',
      'google/gemini-pro',
      'meta-llama/llama-3-70b',
    ])
    .default('openai/gpt-4o'),
  context: z
    .object({
      roomId: z.string().uuid().optional(),
      watchPartyId: z.string().uuid().optional(),
      videoTitle: z.string().optional(),
    })
    .optional(),
});

// ---- Stripe Validators ----
export const checkoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

// ---- Utility Types ----
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RoomCreateInput = z.infer<typeof roomCreateSchema>;
export type RoomUpdateInput = z.infer<typeof roomUpdateSchema>;
export type WatchPartyCreateInput = z.infer<typeof watchPartyCreateSchema>;
export type WatchPartySyncInput = z.infer<typeof watchPartySyncSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type AIChatInput = z.infer<typeof aiChatSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
