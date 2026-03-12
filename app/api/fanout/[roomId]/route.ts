/**
 * API: RTMP Fanout Engine - Guest Destinations
 * GET /api/fanout/:roomId - Get fanout session & reach stats
 * POST /api/fanout/:roomId - Add/validate/start/stop targets
 * DELETE /api/fanout/:roomId - Remove a target
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getFanoutSession,
  addFanoutTarget,
  removeFanoutTarget,
  getGuestTargets,
  validateFanoutTarget,
  startFanoutStream,
  stopFanoutStream,
  getReachMultiplierStats,
  getWorkerPoolStatus,
  getPlatformDefaults,
} from '@/lib/services/fanout';
import type { FanoutPlatform } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const panelId = url.searchParams.get('panelId') || 'default';

  const session = getFanoutSession(roomId, panelId);
  const reachStats = getReachMultiplierStats(roomId);
  const workerPool = getWorkerPoolStatus();
  const guestTargets = userId ? getGuestTargets(roomId, userId) : [];

  return NextResponse.json({
    success: true,
    data: { session, reachStats, workerPool, guestTargets },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const body = await request.json();
  const { action } = body;

  switch (action) {
    case 'add-target': {
      const target = addFanoutTarget(roomId, body.panelId || 'default', {
        userId: body.userId,
        platform: body.platform as FanoutPlatform,
        displayName: body.displayName,
        rtmpUrl: body.rtmpUrl,
        streamKey: body.streamKey,
        bitrate: body.bitrate,
        resolution: body.resolution,
      });

      if (!target) {
        return NextResponse.json({
          success: false,
          error: 'Max 5 platforms per guest reached',
        }, { status: 409 });
      }

      return NextResponse.json({ success: true, data: target });
    }

    case 'validate': {
      const result = await validateFanoutTarget(roomId, body.targetId);
      return NextResponse.json({ success: result.success, data: result });
    }

    case 'start': {
      const result = startFanoutStream(roomId, body.targetId);
      return NextResponse.json({ success: result.success, data: result });
    }

    case 'stop': {
      const stopped = stopFanoutStream(roomId, body.targetId);
      return NextResponse.json({ success: stopped });
    }

    case 'platform-defaults': {
      const defaults = getPlatformDefaults(body.platform as FanoutPlatform);
      return NextResponse.json({ success: true, data: defaults });
    }

    default:
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const { targetId } = await request.json();

  if (!targetId) {
    return NextResponse.json({ success: false, error: 'targetId required' }, { status: 400 });
  }

  const removed = removeFanoutTarget(roomId, targetId);
  return NextResponse.json({ success: removed });
}
