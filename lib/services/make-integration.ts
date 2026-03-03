import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ---- In-memory API key store (userId -> apiKey) ----
const apiKeys = new Map<string, { key: string; name: string; createdAt: string }>();

// ============================================================
// API KEY MANAGEMENT
// ============================================================

/**
 * Generate an API key for a user. Used by Make.com, n8n, and Zapier
 * to authenticate inbound requests.
 */
export function generateApiKey(userId: string, name: string): { key: string; name: string; createdAt: string } {
  const key = `sw_${randomBytes(24).toString('hex')}`;
  const entry = { key, name, createdAt: new Date().toISOString() };
  apiKeys.set(userId, entry);
  return entry;
}

/**
 * Validate an API key. Returns the userId if valid.
 */
export function validateApiKey(key: string): string | null {
  for (const [userId, entry] of Array.from(apiKeys.entries())) {
    // Timing-safe comparison
    const expected = Buffer.from(entry.key);
    const received = Buffer.from(key);
    if (expected.length === received.length && timingSafeEqual(expected, received)) {
      return userId;
    }
  }
  return null;
}

/**
 * Get the API key for a user (masked).
 */
export function getApiKey(userId: string): { key: string; name: string; createdAt: string } | null {
  const entry = apiKeys.get(userId);
  if (!entry) return null;
  return {
    key: `${entry.key.slice(0, 6)}...${entry.key.slice(-4)}`,
    name: entry.name,
    createdAt: entry.createdAt,
  };
}

/**
 * Revoke and regenerate an API key.
 */
export function revokeApiKey(userId: string): boolean {
  return apiKeys.delete(userId);
}

// ============================================================
// MAKE.COM WEBHOOK VERIFICATION
// ============================================================

/**
 * Verify an inbound HMAC signature from Make.com.
 */
export function verifyMakeSignature(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  const received = signature.replace('sha256=', '');
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(received);
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

// ============================================================
// MAKE.COM SCENARIO TEMPLATES
// ============================================================

/**
 * Pre-built Make.com scenario blueprints that users can import directly.
 * These templates accelerate setup by providing ready-to-use automation flows.
 */
export function getMakeScenarioTemplates(userId: string): MakeScenarioTemplate[] {
  const inboundUrl = `${APP_URL}/api/automation/inbound/${userId}`;
  const apiKeyEntry = apiKeys.get(userId);

  return [
    {
      id: 'stream-to-social',
      name: 'Go Live → Social Media Blast',
      description: 'When your stream starts, automatically post to Twitter/X, Discord, and Slack',
      trigger: 'stream.started',
      modules: ['Webhook', 'Twitter', 'Discord', 'Slack'],
      blueprint: {
        name: 'SeeWhy LIVE → Social Media Blast',
        flow: [
          { module: 'Webhooks', action: 'Custom Webhook', note: 'Receives stream.started event from SeeWhy LIVE' },
          { module: 'Router', action: 'Route to multiple paths' },
          { module: 'Twitter', action: 'Create a Tweet', note: 'Posts "🔴 I\'m live on SeeWhy LIVE! {title} — Join: {roomUrl}"' },
          { module: 'Discord', action: 'Send a Message', note: 'Posts go-live notification to your Discord server' },
          { module: 'Slack', action: 'Send a Message', note: 'Posts to your Slack channel' },
        ],
        webhookPayloadExample: {
          trigger: 'stream.started',
          timestamp: new Date().toISOString(),
          roomId: 'example-room-id',
          userId,
          data: { title: 'My Amazing Stream', viewerCount: 0 },
        },
      },
    },
    {
      id: 'tip-to-notification',
      name: 'Tip Received → Thank You Message',
      description: 'When you receive a tip, send an automated thank-you email and log to Google Sheets',
      trigger: 'tip.received',
      modules: ['Webhook', 'Gmail', 'Google Sheets'],
      blueprint: {
        name: 'SeeWhy LIVE → Tip Thank You',
        flow: [
          { module: 'Webhooks', action: 'Custom Webhook', note: 'Receives tip.received event from SeeWhy LIVE' },
          { module: 'Gmail', action: 'Send an Email', note: 'Sends thank-you to the tipper' },
          { module: 'Google Sheets', action: 'Add a Row', note: 'Logs tip amount, user, and timestamp' },
        ],
        webhookPayloadExample: {
          trigger: 'tip.received',
          timestamp: new Date().toISOString(),
          roomId: 'example-room-id',
          userId,
          data: { amount: 500, currency: 'usd', fromUser: 'viewer-1', message: 'Great stream!' },
        },
      },
    },
    {
      id: 'ticket-to-crm',
      name: 'Ticket Purchased → CRM & Email Sequence',
      description: 'When a ticket is purchased, add the buyer to your CRM and trigger an email sequence',
      trigger: 'ticket.purchased',
      modules: ['Webhook', 'HubSpot', 'Mailchimp'],
      blueprint: {
        name: 'SeeWhy LIVE → Ticket CRM Flow',
        flow: [
          { module: 'Webhooks', action: 'Custom Webhook', note: 'Receives ticket.purchased event from SeeWhy LIVE' },
          { module: 'HubSpot', action: 'Create/Update Contact', note: 'Adds buyer to your CRM' },
          { module: 'Mailchimp', action: 'Add Subscriber to List', note: 'Triggers event reminder email sequence' },
        ],
        webhookPayloadExample: {
          trigger: 'ticket.purchased',
          timestamp: new Date().toISOString(),
          roomId: 'example-room-id',
          userId,
          data: { buyerId: 'user-789', amount: 1500 },
        },
      },
    },
    {
      id: 'stream-end-recap',
      name: 'Stream Ended → Analytics Recap',
      description: 'When your stream ends, compile analytics and send a recap email with Google Sheets logging',
      trigger: 'stream.ended',
      modules: ['Webhook', 'Gmail', 'Google Sheets', 'Notion'],
      blueprint: {
        name: 'SeeWhy LIVE → Stream Recap',
        flow: [
          { module: 'Webhooks', action: 'Custom Webhook', note: 'Receives stream.ended event from SeeWhy LIVE' },
          { module: 'Google Sheets', action: 'Add a Row', note: 'Logs stream date, duration, and peak viewers' },
          { module: 'Notion', action: 'Create a Page', note: 'Creates a stream archive page in your Notion workspace' },
          { module: 'Gmail', action: 'Send an Email', note: 'Sends you a stream performance recap email' },
        ],
        webhookPayloadExample: {
          trigger: 'stream.ended',
          timestamp: new Date().toISOString(),
          roomId: 'example-room-id',
          userId,
          data: { title: 'My Stream', peakViewers: 150 },
        },
      },
    },
    {
      id: 'viewer-milestone',
      name: 'Viewer Joined → Milestone Celebration',
      description: 'Track viewer joins and trigger a celebration when you hit milestones (50, 100, 500, 1000)',
      trigger: 'viewer.joined',
      modules: ['Webhook', 'Filter', 'Discord', 'Twitter'],
      blueprint: {
        name: 'SeeWhy LIVE → Viewer Milestones',
        flow: [
          { module: 'Webhooks', action: 'Custom Webhook', note: 'Receives viewer.joined event from SeeWhy LIVE' },
          { module: 'Tools', action: 'Filter', note: 'Only continue if viewerCount is 50, 100, 500, or 1000' },
          { module: 'Discord', action: 'Send a Message', note: 'Celebrate milestone in Discord' },
          { module: 'Twitter', action: 'Create a Tweet', note: 'Tweet about the milestone' },
        ],
        webhookPayloadExample: {
          trigger: 'viewer.joined',
          timestamp: new Date().toISOString(),
          roomId: 'example-room-id',
          userId,
          data: { viewerId: 'user-789', viewerCount: 100 },
        },
      },
    },
    {
      id: 'scheduled-start',
      name: 'Google Calendar → Auto Start Stream',
      description: 'Use Make.com to trigger stream start at a scheduled time from Google Calendar',
      trigger: 'inbound',
      modules: ['Google Calendar', 'HTTP'],
      blueprint: {
        name: 'Google Calendar → SeeWhy LIVE Auto Start',
        flow: [
          { module: 'Google Calendar', action: 'Watch Events', note: 'Triggers when a calendar event starts' },
          { module: 'HTTP', action: 'Make a request', note: `POST to ${inboundUrl} with action: "stream.start"` },
        ],
        inboundRequestExample: {
          method: 'POST',
          url: inboundUrl,
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKeyEntry?.key ? `${apiKeyEntry.key.slice(0, 6)}...` : 'YOUR_API_KEY',
          },
          body: { action: 'stream.start', roomId: 'YOUR_ROOM_ID' },
        },
      },
    },
    {
      id: 'chat-moderation',
      name: 'Chat Message → AI Moderation',
      description: 'Route chat messages through OpenAI for toxicity detection and auto-moderation',
      trigger: 'chat.message',
      modules: ['Webhook', 'OpenAI', 'HTTP', 'Filter'],
      blueprint: {
        name: 'SeeWhy LIVE → AI Chat Moderation',
        flow: [
          { module: 'Webhooks', action: 'Custom Webhook', note: 'Receives chat.message event from SeeWhy LIVE' },
          { module: 'OpenAI', action: 'Create a Completion', note: 'Analyze message for toxicity' },
          { module: 'Tools', action: 'Filter', note: 'Only continue if toxicity score > threshold' },
          { module: 'HTTP', action: 'Make a request', note: `POST to ${inboundUrl} to moderate the user` },
        ],
        webhookPayloadExample: {
          trigger: 'chat.message',
          timestamp: new Date().toISOString(),
          roomId: 'example-room-id',
          userId,
          data: { content: 'Hello everyone!', type: 'text' },
        },
      },
    },
  ];
}

// ============================================================
// MAKE.COM SETUP INSTRUCTIONS
// ============================================================

export function getMakeSetupGuide(userId: string): MakeSetupGuide {
  const webhookUrl = `${APP_URL}/api/automation/inbound/${userId}`;
  const apiKeyEntry = apiKeys.get(userId);

  return {
    outbound: {
      title: 'Receive events FROM SeeWhy LIVE (Outbound Webhooks)',
      steps: [
        'In Make.com, create a new Scenario',
        'Add a "Webhooks" module → "Custom webhook" as the trigger',
        'Copy the webhook URL that Make.com generates',
        'In SeeWhy LIVE, go to Creator → Automations',
        'Create a new outbound webhook with the Make.com URL',
        'Select the triggers you want (e.g., stream.started, tip.received)',
        'Save the webhook — copy the signing secret for verification',
        'Back in Make.com, click "Run once" to test the connection',
        'Send a test event from SeeWhy LIVE to verify delivery',
        'Add your desired action modules (Slack, Email, Sheets, etc.)',
      ],
      verificationNote: 'Each webhook delivery includes an X-SeeWhy-Signature header (HMAC-SHA256). You can verify this in Make.com using a custom function module.',
      signatureHeader: 'X-SeeWhy-Signature',
      eventHeader: 'X-SeeWhy-Event',
      deliveryHeader: 'X-SeeWhy-Delivery',
    },
    inbound: {
      title: 'Send actions TO SeeWhy LIVE (Inbound Webhooks)',
      webhookUrl,
      apiKey: apiKeyEntry?.key ? `${apiKeyEntry.key.slice(0, 6)}...${apiKeyEntry.key.slice(-4)}` : null,
      steps: [
        'Generate an API key in the Make.com Integration settings below',
        'In Make.com, add an "HTTP" module → "Make a request"',
        `Set the URL to: ${webhookUrl}`,
        'Set method to POST and Content-Type to application/json',
        'Add header X-API-Key with your generated API key',
        'Set the body to include "action" and relevant fields',
      ],
      availableActions: [
        { action: 'stream.start', fields: ['roomId'], description: 'Start a live stream' },
        { action: 'stream.end', fields: ['roomId'], description: 'End a live stream' },
        { action: 'room.update', fields: ['roomId', 'updates'], description: 'Update room settings (title, description, etc.)' },
        { action: 'send.chat', fields: ['roomId', 'content'], description: 'Send a chat message to a room' },
        { action: 'ping', fields: [], description: 'Health check — returns pong' },
      ],
      exampleRequest: {
        method: 'POST',
        url: webhookUrl,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'YOUR_API_KEY',
        },
        body: { action: 'stream.start', roomId: 'your-room-id' },
      },
    },
  };
}

// ============================================================
// TYPES
// ============================================================

export interface MakeScenarioTemplate {
  id: string;
  name: string;
  description: string;
  trigger: string;
  modules: string[];
  blueprint: {
    name: string;
    flow: Array<{ module: string; action: string; note?: string }>;
    webhookPayloadExample?: Record<string, unknown>;
    inboundRequestExample?: Record<string, unknown>;
  };
}

export interface MakeSetupGuide {
  outbound: {
    title: string;
    steps: string[];
    verificationNote: string;
    signatureHeader: string;
    eventHeader: string;
    deliveryHeader: string;
  };
  inbound: {
    title: string;
    webhookUrl: string;
    apiKey: string | null;
    steps: string[];
    availableActions: Array<{ action: string; fields: string[]; description: string }>;
    exampleRequest: Record<string, unknown>;
  };
}
