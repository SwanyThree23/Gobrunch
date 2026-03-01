import { NextRequest, NextResponse } from 'next/server';
import { getUserFromHeader } from '@/lib/services/auth';
import { getRoomById } from '@/lib/services/rooms';
import { generateStreamingToolkit } from '@/lib/services/vdoninja';
import type { ApiResponse } from '@/types';

/**
 * GET /api/rooms/[id]/streaming - Get the streaming toolkit (VDO.Ninja, Social Stream, Captions) for a room
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

    const isHost = room.hostId === userPayload.userId;

    // Generate the streaming toolkit
    const toolkit = generateStreamingToolkit({
      roomId: room.id,
      roomName: room.title.toLowerCase().replace(/\s+/g, '-').slice(0, 20),
      hostName: room.host?.displayName || 'Host',
      enableMeshcast: (room.maxViewers || 0) > 50, // Auto-enable Meshcast for larger rooms
      enableCaptions: true,
      enableSocialStream: true,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ...toolkit,
        isHost,
        roomId: room.id,
        roomStatus: room.status,
      },
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to generate streaming toolkit' },
      { status: 500 }
    );
  }
}
