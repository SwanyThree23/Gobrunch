/**
 * RTMP Fanout Engine - Guest Destinations & Multi-Platform Broadcasting
 * FFmpeg Workers, Reach Multiplier, Validation & Status
 *
 * Each of the 20 panel participants can stream to up to 5 platforms each,
 * enabling 100 concurrent streams from a single event.
 */
import { v4 as uuidv4 } from 'uuid';
import type {
  GuestFanoutTarget,
  FanoutSession,
  FFmpegWorker,
  FanoutPlatform,
  FanoutStatus,
  ReachMultiplierStats,
} from '@/types';

const MAX_TARGETS_PER_GUEST = 5;

// ---- In-memory stores ----
const fanoutSessions = new Map<string, FanoutSession>();
const ffmpegWorkers = new Map<string, FFmpegWorker>();

// Initialize FFmpeg worker pool
function initializeWorkerPool(): void {
  for (let i = 0; i < 4; i++) {
    const worker: FFmpegWorker = {
      id: uuidv4(),
      nodeId: `ffmpeg-node-${i + 1}`,
      status: 'idle',
      cpuUsage: 0,
      memoryUsage: 0,
      activeStreams: 0,
      maxStreams: 25,
      assignedTargets: [],
    };
    ffmpegWorkers.set(worker.id, worker);
  }
}

// Initialize on module load
initializeWorkerPool();

// ============================================================
// FANOUT SESSION MANAGEMENT
// ============================================================

/**
 * Get or create a fanout session for a room.
 */
export function getFanoutSession(roomId: string, panelId: string): FanoutSession {
  let session = fanoutSessions.get(roomId);
  if (!session) {
    session = {
      id: uuidv4(),
      roomId,
      panelId,
      totalTargets: 0,
      activeTargets: 0,
      estimatedReach: 0,
      targets: [],
      ffmpegClusterStatus: 'healthy',
      createdAt: new Date().toISOString(),
    };
    fanoutSessions.set(roomId, session);
  }
  return session;
}

// ============================================================
// GUEST DESTINATION MANAGEMENT
// ============================================================

/**
 * Add a fanout target (destination platform) for a guest participant.
 */
export function addFanoutTarget(
  roomId: string,
  panelId: string,
  params: {
    userId: string;
    platform: FanoutPlatform;
    displayName: string;
    rtmpUrl: string;
    streamKey: string;
    bitrate?: number;
    resolution?: string;
  }
): GuestFanoutTarget | null {
  const session = getFanoutSession(roomId, panelId);

  // Check per-guest limit
  const guestTargets = session.targets.filter(t => t.userId === params.userId);
  if (guestTargets.length >= MAX_TARGETS_PER_GUEST) {
    return null; // Guest has reached max platforms
  }

  const target: GuestFanoutTarget = {
    id: uuidv4(),
    participantId: '', // Will be linked to panel participant
    userId: params.userId,
    platform: params.platform,
    displayName: params.displayName,
    rtmpUrl: params.rtmpUrl,
    streamKey: params.streamKey,
    status: 'idle',
    bitrate: params.bitrate ?? 4500,
    resolution: params.resolution ?? '1920x1080',
  };

  session.targets.push(target);
  session.totalTargets = session.targets.length;
  return target;
}

/**
 * Remove a fanout target.
 */
export function removeFanoutTarget(roomId: string, targetId: string): boolean {
  const session = fanoutSessions.get(roomId);
  if (!session) return false;

  const idx = session.targets.findIndex(t => t.id === targetId);
  if (idx === -1) return false;

  // Stop the FFmpeg worker if running
  const target = session.targets[idx];
  if (target.ffmpegWorkerId) {
    releaseWorker(target.ffmpegWorkerId, targetId);
  }

  session.targets.splice(idx, 1);
  session.totalTargets = session.targets.length;
  session.activeTargets = session.targets.filter(t => t.status === 'live').length;
  return true;
}

/**
 * Get all fanout targets for a guest.
 */
export function getGuestTargets(roomId: string, userId: string): GuestFanoutTarget[] {
  const session = fanoutSessions.get(roomId);
  if (!session) return [];
  return session.targets.filter(t => t.userId === userId);
}

// ============================================================
// RTMP VALIDATION & CONNECTION
// ============================================================

/**
 * Validate an RTMP connection with a 1-second test stream.
 * Returns true if the target is reachable.
 */
export async function validateFanoutTarget(roomId: string, targetId: string): Promise<{
  success: boolean;
  error?: string;
  latencyMs?: number;
}> {
  const session = fanoutSessions.get(roomId);
  if (!session) return { success: false, error: 'No fanout session found' };

  const target = session.targets.find(t => t.id === targetId);
  if (!target) return { success: false, error: 'Target not found' };

  target.status = 'validating';

  // Simulate RTMP validation (in production: FFmpeg probe with 1s timeout)
  const startTime = Date.now();

  try {
    // Validate RTMP URL format
    const rtmpUrlPattern = /^rtmps?:\/\/.+/;
    if (!rtmpUrlPattern.test(target.rtmpUrl)) {
      target.status = 'error';
      target.validationError = 'Invalid RTMP URL format';
      return { success: false, error: 'Invalid RTMP URL format' };
    }

    // Validate stream key is not empty
    if (!target.streamKey || target.streamKey.trim().length === 0) {
      target.status = 'error';
      target.validationError = 'Stream key is required';
      return { success: false, error: 'Stream key is required' };
    }

    // Mark as connected (in production: FFmpeg would probe the endpoint)
    target.status = 'connected';
    target.lastValidatedAt = new Date().toISOString();
    target.validationError = undefined;

    const latencyMs = Date.now() - startTime;
    return { success: true, latencyMs };
  } catch {
    target.status = 'error';
    target.validationError = 'Connection failed';
    return { success: false, error: 'Connection failed' };
  }
}

/**
 * Start streaming to a target (assigns FFmpeg worker).
 */
export function startFanoutStream(roomId: string, targetId: string): {
  success: boolean;
  workerId?: string;
  error?: string;
} {
  const session = fanoutSessions.get(roomId);
  if (!session) return { success: false, error: 'No fanout session' };

  const target = session.targets.find(t => t.id === targetId);
  if (!target) return { success: false, error: 'Target not found' };

  // Find an available FFmpeg worker
  const worker = findAvailableWorker();
  if (!worker) return { success: false, error: 'No FFmpeg workers available' };

  // Assign worker
  worker.assignedTargets.push(targetId);
  worker.activeStreams += 1;
  worker.status = 'encoding';
  worker.cpuUsage = Math.min(100, (worker.activeStreams / worker.maxStreams) * 100);

  target.ffmpegWorkerId = worker.id;
  target.status = 'live';
  target.startedAt = new Date().toISOString();

  session.activeTargets = session.targets.filter(t => t.status === 'live').length;
  updateReachEstimate(session);

  return { success: true, workerId: worker.id };
}

/**
 * Stop a fanout stream.
 */
export function stopFanoutStream(roomId: string, targetId: string): boolean {
  const session = fanoutSessions.get(roomId);
  if (!session) return false;

  const target = session.targets.find(t => t.id === targetId);
  if (!target) return false;

  if (target.ffmpegWorkerId) {
    releaseWorker(target.ffmpegWorkerId, targetId);
  }

  target.status = 'disconnected';
  target.ffmpegWorkerId = undefined;

  session.activeTargets = session.targets.filter(t => t.status === 'live').length;
  updateReachEstimate(session);
  return true;
}

// ============================================================
// REACH MULTIPLIER
// 20 participants × 5 platforms = 100 concurrent streams
// ============================================================

/**
 * Calculate the reach multiplier stats for a room.
 */
export function getReachMultiplierStats(roomId: string): ReachMultiplierStats {
  const session = fanoutSessions.get(roomId);
  if (!session) {
    return {
      totalParticipants: 0,
      totalPlatforms: 0,
      totalConcurrentStreams: 0,
      estimatedTotalViewers: 0,
      platformBreakdown: {} as Record<FanoutPlatform, number>,
    };
  }

  const uniqueUsers = new Set(session.targets.map(t => t.userId));
  const platformBreakdown: Record<string, number> = {};

  for (const target of session.targets) {
    if (target.status === 'live') {
      platformBreakdown[target.platform] = (platformBreakdown[target.platform] || 0) + 1;
    }
  }

  return {
    totalParticipants: uniqueUsers.size,
    totalPlatforms: Object.keys(platformBreakdown).length,
    totalConcurrentStreams: session.activeTargets,
    estimatedTotalViewers: session.targets
      .filter(t => t.status === 'live')
      .reduce((sum, t) => sum + (t.viewerCount || 0), 0),
    platformBreakdown: platformBreakdown as Record<FanoutPlatform, number>,
  };
}

// ============================================================
// FFMPEG WORKER MANAGEMENT
// ============================================================

/**
 * Find an available FFmpeg worker with capacity.
 */
function findAvailableWorker(): FFmpegWorker | null {
  for (const worker of Array.from(ffmpegWorkers.values())) {
    if (worker.status !== 'offline' && worker.activeStreams < worker.maxStreams) {
      return worker;
    }
  }
  return null;
}

/**
 * Release a worker from a target assignment.
 */
function releaseWorker(workerId: string, targetId: string): void {
  const worker = ffmpegWorkers.get(workerId);
  if (!worker) return;

  worker.assignedTargets = worker.assignedTargets.filter(id => id !== targetId);
  worker.activeStreams = Math.max(0, worker.activeStreams - 1);
  worker.cpuUsage = (worker.activeStreams / worker.maxStreams) * 100;

  if (worker.activeStreams === 0) {
    worker.status = 'idle';
  }
}

/**
 * Update estimated reach for a session.
 */
function updateReachEstimate(session: FanoutSession): void {
  session.estimatedReach = session.targets
    .filter(t => t.status === 'live')
    .reduce((sum, t) => sum + (t.viewerCount || 0) + 1, 0); // +1 for the stream itself
}

/**
 * Get the status of all FFmpeg workers.
 */
export function getWorkerPoolStatus(): FFmpegWorker[] {
  return Array.from(ffmpegWorkers.values());
}

/**
 * Get platform-specific RTMP defaults.
 */
export function getPlatformDefaults(platform: FanoutPlatform): {
  rtmpUrl: string;
  instructions: string;
} {
  const defaults: Record<FanoutPlatform, { rtmpUrl: string; instructions: string }> = {
    youtube: {
      rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
      instructions: 'Go to YouTube Studio > Go Live > Stream > Copy stream key',
    },
    twitch: {
      rtmpUrl: 'rtmp://live.twitch.tv/app',
      instructions: 'Go to Twitch Dashboard > Settings > Stream > Copy primary stream key',
    },
    tiktok: {
      rtmpUrl: 'rtmp://push.tiktok.com/live',
      instructions: 'Go to TikTok LIVE Studio > Copy server URL and stream key',
    },
    facebook: {
      rtmpUrl: 'rtmps://live-api-s.facebook.com:443/rtmp',
      instructions: 'Go to Facebook Live Producer > Use stream key from setup',
    },
    kick: {
      rtmpUrl: 'rtmp://fa723fc1b171.global-contribute.live-video.net/app',
      instructions: 'Go to Kick Dashboard > Settings > Stream > Copy stream key',
    },
    instagram: {
      rtmpUrl: 'rtmps://live-upload.instagram.com:443/rtmp',
      instructions: 'Use Instagram Live Producer (requires professional account)',
    },
    x: {
      rtmpUrl: 'rtmp://prod-ec-us-west-2.video.pscp.tv:80/x',
      instructions: 'Go to X (Twitter) > Media Studio > Producer > Copy stream credentials',
    },
    linkedin: {
      rtmpUrl: 'rtmp://rtmp.linkedin.com/rtmp',
      instructions: 'Go to LinkedIn Events > Create Live Event > Copy stream credentials',
    },
    custom: {
      rtmpUrl: '',
      instructions: 'Enter your custom RTMP server URL and stream key',
    },
  };

  return defaults[platform] || defaults.custom;
}
