import { NextRequest, NextResponse } from 'next/server';
import { updateRoom, getRoomById } from '@/lib/services/rooms';
import { fireAutomationEvent } from '@/lib/services/streaming';
import { validateApiKey } from '@/lib/services/make-integration';
import type { ApiResponse } from '@/types';

/**
 * POST /api/automation/inbound/[userId]
 *
 * Inbound webhook endpoint for Make.com, n8n, and Zapier to push
 * actions INTO SeeWhy LIVE. Authenticated via X-API-Key header.
 *
 * Available actions:
 * - stream.start   — Start a live stream
 * - stream.end     — End a live stream
 * - room.update    — Update room settings
 * - send.chat      — Send a chat message to a room
 * - ping           — Health check
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Authenticate via API key
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey) {
      const keyOwner = validateApiKey(apiKey);
      if (!keyOwner || keyOwner !== params.userId) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid API key' },
          { status: 401 }
        );
      }
    }
    // Allow unauthenticated ping for connection testing
    const body = await request.json();
    const action = body.action as string;

    if (!action) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing "action" field' },
        { status: 400 }
      );
    }

    // Require API key for all actions except ping
    if (action !== 'ping' && !apiKey) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'X-API-Key header required. Generate one at /creator/integrations' },
        { status: 401 }
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
        if (!roomId) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'roomId is required' },
            { status: 400 }
          );
        }
        const room = getRoomById(roomId);
        if (!room || room.hostId !== params.userId) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'Room not found or not authorized' },
            { status: 404 }
          );
        }
        const updated = updateRoom(roomId, params.userId, { status: 'live' });
        await fireAutomationEvent({
          trigger: 'stream.started',
          timestamp: new Date().toISOString(),
          roomId,
          userId: params.userId,
          data: { title: room.title, source: 'make.com' },
        });
        return NextResponse.json<ApiResponse>({ success: true, data: updated });
      }

      case 'stream.end': {
        const { roomId } = body;
        if (!roomId) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'roomId is required' },
            { status: 400 }
          );
        }
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
          data: { title: room.title, peakViewers: room.currentViewers, source: 'make.com' },
        });
        return NextResponse.json<ApiResponse>({ success: true, data: updated });
      }

      case 'send.chat': {
        const { roomId, content } = body;
        if (!roomId || !content) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'roomId and content are required' },
            { status: 400 }
          );
        }
        const room = getRoomById(roomId);
        if (!room) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'Room not found' },
            { status: 404 }
          );
        }
        // Fire as a chat event so it reaches webhooks and the WebSocket
        await fireAutomationEvent({
          trigger: 'chat.message',
          timestamp: new Date().toISOString(),
          roomId,
          userId: params.userId,
          data: { content, type: 'system', source: 'make.com' },
        });
        return NextResponse.json<ApiResponse>({
          success: true,
          data: { sent: true, roomId, content },
        });
      }

      case 'ping': {
        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            message: 'pong',
            userId: params.userId,
            timestamp: new Date().toISOString(),
            authenticated: !!apiKey,
          },
        });
      }

      default:
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `Unknown action: ${action}. Available: room.update, stream.start, stream.end, send.chat, ping`,
          },
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
