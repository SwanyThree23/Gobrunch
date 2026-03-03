import { NextRequest, NextResponse } from 'next/server';
import { getUserFromHeader } from '@/lib/services/auth';
import { getRoomById } from '@/lib/services/rooms';
import {
  getStreamConfig,
  regenerateStreamKey,
  getExternalPlatformConfig,
  getMultistreamTargets,
  addMultistreamTarget,
  removeMultistreamTarget,
  toggleMultistreamTarget,
} from '@/lib/services/streaming';
import type { ApiResponse, ExternalPlatform } from '@/types';

/**
 * GET /api/rooms/[id]/stream-config
 * Get stream key, RTMP URL, and multistream targets for a room.
 * Host-only endpoint.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromHeader(authHeader);
    if (!userPayload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const room = getRoomById(params.id);
    if (!room) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    if (room.hostId !== userPayload.userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only the host can access stream settings' },
        { status: 403 }
      );
    }

    const streamConfig = getStreamConfig(params.id);
    const multistreamTargets = getMultistreamTargets(params.id);

    // Get platform-specific instructions
    const platform = (request.nextUrl.searchParams.get('platform') || 'obs') as ExternalPlatform;
    const platformConfig = getExternalPlatformConfig(params.id, platform);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        stream: streamConfig,
        multistream: multistreamTargets,
        platformConfig,
      },
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to get stream config' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rooms/[id]/stream-config
 * Regenerate stream key, add multistream target, or get platform-specific config.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromHeader(authHeader);
    if (!userPayload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const room = getRoomById(params.id);
    if (!room) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    if (room.hostId !== userPayload.userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only the host can modify stream settings' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const action = body.action as string;

    switch (action) {
      case 'regenerate-key': {
        const newConfig = regenerateStreamKey(params.id);
        return NextResponse.json<ApiResponse>({
          success: true,
          data: newConfig,
          message: 'Stream key regenerated. Update your streaming software.',
        });
      }

      case 'add-multistream': {
        const { platform, name, rtmpUrl, streamKey } = body;
        if (!platform || !name || !rtmpUrl || !streamKey) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'Missing required fields: platform, name, rtmpUrl, streamKey' },
            { status: 400 }
          );
        }
        const target = addMultistreamTarget(params.id, { platform, name, rtmpUrl, streamKey });
        return NextResponse.json<ApiResponse>({
          success: true,
          data: target,
        });
      }

      case 'remove-multistream': {
        const { targetId } = body;
        const removed = removeMultistreamTarget(params.id, targetId);
        return NextResponse.json<ApiResponse>({
          success: removed,
          error: removed ? undefined : 'Target not found',
        });
      }

      case 'toggle-multistream': {
        const target = toggleMultistreamTarget(params.id, body.targetId);
        return NextResponse.json<ApiResponse>({
          success: !!target,
          data: target,
        });
      }

      case 'get-platform-config': {
        const platformConfig = getExternalPlatformConfig(params.id, body.platform || 'obs');
        return NextResponse.json<ApiResponse>({
          success: true,
          data: platformConfig,
        });
      }

      default:
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to update stream config' },
      { status: 500 }
    );
  }
}
