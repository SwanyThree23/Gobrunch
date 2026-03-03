import { randomBytes, createHmac } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type {
  StreamConfig,
  MultistreamTarget,
  ExternalPlatform,
  AutomationWebhook,
  AutomationTrigger,
  AutomationEvent,
} from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ---- In-memory stores ----
const streamConfigs = new Map<string, StreamConfig>();
const multistreamTargets = new Map<string, MultistreamTarget[]>(); // roomId -> targets
const automationWebhooks = new Map<string, AutomationWebhook[]>(); // userId -> webhooks

// ============================================================
// STREAM KEY MANAGEMENT
// ============================================================

/**
 * Generate a cryptographically secure stream key.
 * Format: sw_live_{roomIdPrefix}_{randomHex}
 */
function generateStreamKey(roomId: string): string {
  const prefix = roomId.slice(0, 8).replace(/-/g, '');
  const random = randomBytes(16).toString('hex');
  return `sw_live_${prefix}_${random}`;
}

/**
 * Create or reset a stream configuration for a room.
 */
export function createStreamConfig(roomId: string): StreamConfig {
  const streamKey = generateStreamKey(roomId);
  const now = new Date().toISOString();

  const config: StreamConfig = {
    roomId,
    streamKey,
    rtmpIngestUrl: `rtmp://${new URL(APP_URL).hostname}/live`,
    rtmpFullUrl: `rtmp://${new URL(APP_URL).hostname}/live/${streamKey}`,
    whipUrl: `${APP_URL}/api/whip/${streamKey}`,
    playbackUrl: `${APP_URL}/api/live/${streamKey}/playlist.m3u8`,
    status: 'idle',
    createdAt: now,
  };

  streamConfigs.set(roomId, config);
  return config;
}

/**
 * Get stream config for a room, creating if it doesn't exist.
 */
export function getStreamConfig(roomId: string): StreamConfig {
  let config = streamConfigs.get(roomId);
  if (!config) {
    config = createStreamConfig(roomId);
  }
  return config;
}

/**
 * Regenerate the stream key (invalidates the old one).
 */
export function regenerateStreamKey(roomId: string): StreamConfig {
  return createStreamConfig(roomId);
}

/**
 * Validate an incoming stream key. Returns the roomId if valid.
 */
export function validateStreamKey(streamKey: string): string | null {
  for (const [roomId, config] of Array.from(streamConfigs.entries())) {
    if (config.streamKey === streamKey) {
      return roomId;
    }
  }
  return null;
}

/**
 * Mark a stream as live (called when RTMP ingest begins).
 */
export function setStreamLive(roomId: string): void {
  const config = streamConfigs.get(roomId);
  if (config) {
    config.status = 'live';
    config.lastActiveAt = new Date().toISOString();
  }
}

/**
 * Mark a stream as idle (called when RTMP ingest disconnects).
 */
export function setStreamIdle(roomId: string): void {
  const config = streamConfigs.get(roomId);
  if (config) {
    config.status = 'idle';
  }
}

/**
 * Get formatted stream info for external platforms.
 * This is what creators copy into PRISM, OBS, etc.
 */
export function getExternalPlatformConfig(roomId: string, platform: ExternalPlatform): {
  platform: ExternalPlatform;
  serverUrl: string;
  streamKey: string;
  instructions: string;
} {
  const config = getStreamConfig(roomId);

  const platformInstructions: Record<ExternalPlatform, string> = {
    prism: `In PRISM Live Studio:\n1. Open Settings > Stream\n2. Select "Custom RTMP"\n3. Paste the Server URL into the "Server" field\n4. Paste the Stream Key into the "Stream Key" field\n5. Click "Start Streaming"`,
    obs: `In OBS Studio:\n1. Go to Settings > Stream\n2. Set Service to "Custom..."\n3. Paste the Server URL into "Server"\n4. Paste the Stream Key into "Stream Key"\n5. Click OK, then "Start Streaming"`,
    streamlabs: `In Streamlabs Desktop:\n1. Go to Settings > Stream\n2. Set Stream Type to "Custom Streaming Server"\n3. Paste the Server URL into "URL"\n4. Paste the Stream Key into "Stream key"\n5. Click Done, then "Go Live"`,
    vmix: `In vMix:\n1. Click "Stream" in the bottom bar\n2. Set Destination to "Custom RTMP Server"\n3. Paste the Server URL into "URL"\n4. Paste the Stream Key into "Stream Key / Name"\n5. Click "Start"`,
    xsplit: `In XSplit Broadcaster:\n1. Click "Broadcast" > "Set up a new output"\n2. Select "Custom RTMP"\n3. Paste the Server URL into "RTMP URL"\n4. Paste the Stream Key into "Stream Name"\n5. Click "Start Broadcast"`,
    restream: `In Restream:\n1. Add a "Custom RTMP" channel\n2. Paste the Server URL into "RTMP URL"\n3. Paste the Stream Key into "Stream Key"\n4. Enable the channel and start streaming from your encoder`,
    custom: `For any RTMP-compatible encoder:\n1. Use the Server URL as your RTMP endpoint\n2. Use the Stream Key as the stream name/key\n3. Begin streaming`,
  };

  return {
    platform,
    serverUrl: config.rtmpIngestUrl,
    streamKey: config.streamKey,
    instructions: platformInstructions[platform],
  };
}

// ============================================================
// MULTISTREAM TARGETS
// ============================================================

/**
 * Add a multistream target (rebroadcast to YouTube, Twitch, etc).
 */
export function addMultistreamTarget(roomId: string, target: {
  platform: ExternalPlatform;
  name: string;
  rtmpUrl: string;
  streamKey: string;
}): MultistreamTarget {
  const newTarget: MultistreamTarget = {
    id: uuidv4(),
    platform: target.platform,
    name: target.name,
    rtmpUrl: target.rtmpUrl,
    streamKey: target.streamKey,
    enabled: true,
  };

  const targets = multistreamTargets.get(roomId) || [];
  targets.push(newTarget);
  multistreamTargets.set(roomId, targets);
  return newTarget;
}

/**
 * Get all multistream targets for a room.
 */
export function getMultistreamTargets(roomId: string): MultistreamTarget[] {
  return multistreamTargets.get(roomId) || [];
}

/**
 * Remove a multistream target.
 */
export function removeMultistreamTarget(roomId: string, targetId: string): boolean {
  const targets = multistreamTargets.get(roomId);
  if (!targets) return false;
  const idx = targets.findIndex((t) => t.id === targetId);
  if (idx === -1) return false;
  targets.splice(idx, 1);
  return true;
}

/**
 * Toggle a multistream target on/off.
 */
export function toggleMultistreamTarget(roomId: string, targetId: string): MultistreamTarget | null {
  const targets = multistreamTargets.get(roomId);
  if (!targets) return null;
  const target = targets.find((t) => t.id === targetId);
  if (!target) return null;
  target.enabled = !target.enabled;
  return target;
}

// ============================================================
// N8N / AUTOMATION WEBHOOKS
// ============================================================

/**
 * Create a new automation webhook for a user.
 */
export function createAutomationWebhook(params: {
  userId: string;
  name: string;
  targetUrl: string;
  triggers: AutomationTrigger[];
}): AutomationWebhook {
  const secret = randomBytes(32).toString('hex');
  const webhook: AutomationWebhook = {
    id: uuidv4(),
    userId: params.userId,
    name: params.name,
    targetUrl: params.targetUrl,
    secret,
    triggers: params.triggers,
    enabled: true,
    failCount: 0,
    createdAt: new Date().toISOString(),
  };

  const webhooks = automationWebhooks.get(params.userId) || [];
  webhooks.push(webhook);
  automationWebhooks.set(params.userId, webhooks);
  return webhook;
}

/**
 * Get all automation webhooks for a user.
 */
export function getUserWebhooks(userId: string): AutomationWebhook[] {
  return automationWebhooks.get(userId) || [];
}

/**
 * Delete an automation webhook.
 */
export function deleteAutomationWebhook(userId: string, webhookId: string): boolean {
  const webhooks = automationWebhooks.get(userId);
  if (!webhooks) return false;
  const idx = webhooks.findIndex((w) => w.id === webhookId);
  if (idx === -1) return false;
  webhooks.splice(idx, 1);
  return true;
}

/**
 * Toggle an automation webhook on/off.
 */
export function toggleAutomationWebhook(userId: string, webhookId: string): AutomationWebhook | null {
  const webhooks = automationWebhooks.get(userId);
  if (!webhooks) return null;
  const webhook = webhooks.find((w) => w.id === webhookId);
  if (!webhook) return null;
  webhook.enabled = !webhook.enabled;
  return webhook;
}

/**
 * Fire an automation event to all matching webhooks.
 * Signs the payload with HMAC-SHA256 for security.
 */
export async function fireAutomationEvent(event: AutomationEvent): Promise<void> {
  // Collect all webhooks across all users that match this trigger
  const allWebhooks: AutomationWebhook[] = [];
  for (const webhooks of Array.from(automationWebhooks.values())) {
    for (const wh of webhooks) {
      if (wh.enabled && wh.triggers.includes(event.trigger)) {
        allWebhooks.push(wh);
      }
    }
  }

  const payload = JSON.stringify(event);

  // Fire all webhooks in parallel (fire-and-forget with error tracking)
  const deliveries = allWebhooks.map(async (wh) => {
    try {
      // Sign the payload with the webhook secret
      const signature = createHmac('sha256', wh.secret)
        .update(payload)
        .digest('hex');

      const response = await fetch(wh.targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SeeWhy-Signature': `sha256=${signature}`,
          'X-SeeWhy-Event': event.trigger,
          'X-SeeWhy-Delivery': uuidv4(),
          'User-Agent': 'SeeWhyLIVE-Webhook/1.0',
        },
        body: payload,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (response.ok) {
        wh.lastTriggeredAt = new Date().toISOString();
        wh.failCount = 0;
      } else {
        wh.failCount += 1;
        // Disable after 10 consecutive failures
        if (wh.failCount >= 10) {
          wh.enabled = false;
        }
      }
    } catch {
      wh.failCount += 1;
      if (wh.failCount >= 10) {
        wh.enabled = false;
      }
    }
  });

  await Promise.allSettled(deliveries);
}

/**
 * Generate the platform's inbound webhook URL for n8n or other automation tools
 * to push data INTO SeeWhy LIVE.
 */
export function getInboundWebhookUrl(userId: string): string {
  return `${APP_URL}/api/automation/inbound/${userId}`;
}

/**
 * Get all available automation triggers with descriptions.
 */
export function getAvailableTriggers(): { trigger: AutomationTrigger; description: string; example: Record<string, unknown> }[] {
  return [
    {
      trigger: 'stream.started',
      description: 'Fires when a creator starts a live stream',
      example: { roomId: 'abc-123', hostId: 'user-456', title: 'My Stream' },
    },
    {
      trigger: 'stream.ended',
      description: 'Fires when a live stream ends',
      example: { roomId: 'abc-123', duration: 3600, peakViewers: 150 },
    },
    {
      trigger: 'viewer.joined',
      description: 'Fires when a viewer joins a room',
      example: { roomId: 'abc-123', viewerId: 'user-789', viewerCount: 42 },
    },
    {
      trigger: 'viewer.left',
      description: 'Fires when a viewer leaves a room',
      example: { roomId: 'abc-123', viewerId: 'user-789', viewerCount: 41 },
    },
    {
      trigger: 'chat.message',
      description: 'Fires when a chat message is sent',
      example: { roomId: 'abc-123', userId: 'user-789', content: 'Hello!', type: 'text' },
    },
    {
      trigger: 'tip.received',
      description: 'Fires when a creator receives a tip',
      example: { roomId: 'abc-123', amount: 500, currency: 'usd', fromUser: 'viewer-1', message: 'Great stream!' },
    },
    {
      trigger: 'ticket.purchased',
      description: 'Fires when someone purchases a ticket to an event',
      example: { roomId: 'abc-123', buyerId: 'user-789', amount: 1500 },
    },
    {
      trigger: 'subscriber.new',
      description: 'Fires when someone subscribes to a plan',
      example: { userId: 'user-789', tier: 'pro', priceId: 'price_xxx' },
    },
    {
      trigger: 'room.created',
      description: 'Fires when a new room is created',
      example: { roomId: 'abc-123', hostId: 'user-456', title: 'New Room', visibility: 'public' },
    },
    {
      trigger: 'watchparty.started',
      description: 'Fires when a watch party begins playing',
      example: { watchPartyId: 'wp-123', hostId: 'user-456', videoUrl: 'https://...' },
    },
  ];
}
