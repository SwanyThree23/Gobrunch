import { NextRequest, NextResponse } from 'next/server';
import { updateRoom, getRoomById } from '@/lib/services/rooms';
import { fireAutomationEvent } from '@/lib/services/streaming';
import type { ApiResponse } from '@/types';

/**
 * POST /api/automation/inbound/[userId]
 *
 * Inbound webhook endpoint for n8n and other automation tools to push
 * actions INTO SeeWhy LIVE. This allows external workflows to:
 * - Start/stop streams
 * - Send chat messages
 * - Update room settings
 * - Trigger platform events
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const body = await request.json();
    const action = body.action as string;

    if (!action) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing "action" field' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'room.update': {
        const { roomId, updates } = body;
        if (!roomId || !updates) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'roomId and updates are required' },
            { status: 400 }
          );
        }
        const room = updateRoom(roomId, params.userId, updates);
        if (!room) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'Room not found or not authorized' },
            { status: 404 }
          );
        }
        return NextResponse.json<ApiResponse>({ success: true, data: room });
      }

      case 'stream.start': {
        const { roomId } = body;
        const room = getRoomById(roomId);
        if (!room || room.hostId !== params.userId) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'Room not found or not authorized' },
            { status: 404 }
          );
        }
        const updated = updateRoom(roomId, params.userId, { status: 'live' });
        // Fire automation event
        await fireAutomationEvent({
          trigger: 'stream.started',
          timestamp: new Date().toISOString(),
          roomId,
          userId: params.userId,
          data: { title: room.title },
        });
        return NextResponse.json<ApiResponse>({ success: true, data: updated });
      }

      case 'stream.end': {
        const { roomId } = body;
        const room = getRoomById(roomId);
        if (!room || room.hostId !== params.userId) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'Room not found or not authorized' },
            { status: 404 }
          );
        }
        const updated = updateRoom(roomId, params.userId, { status: 'ended' });
        await fireAutomationEvent({
          trigger: 'stream.ended',
          timestamp: new Date().toISOString(),
          roomId,
          userId: params.userId,
          data: { title: room.title, peakViewers: room.currentViewers },
        });
        return NextResponse.json<ApiResponse>({ success: true, data: updated });
      }

      case 'ping': {
        return NextResponse.json<ApiResponse>({
          success: true,
          data: { message: 'pong', userId: params.userId, timestamp: new Date().toISOString() },
        });
      }

      default:
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Unknown action: ${action}. Available: room.update, stream.start, stream.end, ping` },
          { status: 400 }
        );
    }
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to process inbound webhook' },
      { status: 500 }
    );
  }
}
