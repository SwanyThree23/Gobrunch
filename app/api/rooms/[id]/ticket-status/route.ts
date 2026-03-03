import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/services/auth';
import { getRoomById } from '@/lib/services/rooms';
import { hasTicketForRoom } from '@/lib/services/stripe-connect';
import type { ApiResponse } from '@/types';

/**
 * GET /api/rooms/[id]/ticket-status
 * Check if the authenticated user has purchased a ticket for this room.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(authHeader.slice(7));
    if (!payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid token' },
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

    // Host always has access
    if (room.hostId === payload.userId) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: { hasTicket: true, isHost: true },
      });
    }

    // Room doesn't require ticket
    if (!room.requiresTicket) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: { hasTicket: true, isFree: true },
      });
    }

    const hasTicket = hasTicketForRoom(payload.userId, params.id);
    return NextResponse.json<ApiResponse>({
      success: true,
      data: { hasTicket },
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to check ticket status' },
      { status: 500 }
    );
  }
}
