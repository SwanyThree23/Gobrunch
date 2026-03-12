/**
 * FFmpeg Fanout Worker
 * Handles RTMP multi-platform broadcasting for the Guest Destinations feature.
 * Each worker can handle up to 25 concurrent FFmpeg processes.
 *
 * In production, this worker:
 * 1. Listens on Redis pub/sub for new fanout job assignments
 * 2. Spawns FFmpeg processes to copy the composite stream to each guest's RTMP destinations
 * 3. Reports health/status back via Redis
 */
import { execSync } from 'child_process';

const NODE_ID = process.env.NODE_ID || 'ffmpeg-worker-1';
const MAX_STREAMS = parseInt(process.env.WORKER_MAX_STREAMS || '25');
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

interface FanoutJob {
  id: string;
  sourceUrl: string; // RTMP source to copy from
  targetUrl: string; // RTMP destination to copy to
  streamKey: string;
  bitrate: number;
  resolution: string;
}

// Track active FFmpeg processes
const activeJobs = new Map<string, { pid: number; startedAt: Date }>();

// Verify FFmpeg is available
try {
  execSync('ffmpeg -version', { stdio: 'ignore' });
  console.log(`[FFmpeg Worker ${NODE_ID}] FFmpeg available`);
} catch {
  console.error(`[FFmpeg Worker ${NODE_ID}] FFmpeg not found!`);
  process.exit(1);
}

/**
 * Build the FFmpeg command for an RTMP fanout.
 * Uses copy codec (no re-encoding) for minimal CPU usage.
 */
function buildFfmpegCommand(job: FanoutJob): string {
  const target = `${job.targetUrl}/${job.streamKey}`;

  return [
    'ffmpeg',
    '-i', job.sourceUrl,
    '-c', 'copy',                    // Copy codec (no re-encoding)
    '-f', 'flv',                     // FLV format for RTMP
    '-flvflags', 'no_duration_filesize',
    '-reconnect', '1',               // Auto-reconnect on failure
    '-reconnect_streamed', '1',
    '-reconnect_delay_max', '5',
    target,
  ].join(' ');
}

/**
 * Get worker status report.
 */
function getStatus() {
  return {
    nodeId: NODE_ID,
    activeStreams: activeJobs.size,
    maxStreams: MAX_STREAMS,
    cpuUsage: (activeJobs.size / MAX_STREAMS) * 100,
    status: activeJobs.size >= MAX_STREAMS ? 'overloaded' : activeJobs.size > 0 ? 'encoding' : 'idle',
    uptime: process.uptime(),
    redisUrl: REDIS_URL,
  };
}

// ---- Main Loop ----
console.log(`[FFmpeg Worker ${NODE_ID}] Started`);
console.log(`  Max streams: ${MAX_STREAMS}`);
console.log(`  Redis: ${REDIS_URL}`);
console.log(`  Status: ${getStatus().status}`);

// Health check endpoint (simple interval-based status report)
setInterval(() => {
  const status = getStatus();
  console.log(`[FFmpeg Worker ${NODE_ID}] Status: ${status.activeStreams}/${status.maxStreams} streams, CPU: ${status.cpuUsage.toFixed(1)}%`);
}, 30000);

// Keep process alive
process.on('SIGTERM', () => {
  console.log(`[FFmpeg Worker ${NODE_ID}] Shutting down...`);
  // In production: gracefully stop all FFmpeg processes
  for (const jobId of Array.from(activeJobs.keys())) {
    console.log(`  Stopping job ${jobId}`);
  }
  process.exit(0);
});

// Prevent exit
setInterval(() => {}, 1 << 30);

export { buildFfmpegCommand, getStatus };
export type { FanoutJob };
