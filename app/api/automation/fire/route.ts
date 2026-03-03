import { NextRequest, NextResponse } from 'next/server';
import { fireAutomationEvent } from '@/lib/services/streaming';
import type { ApiResponse, AutomationTrigger } from '@/types';

const INTERNAL_SECRET = process.env.INTERNAL_SECRET || 'ws-internal';

/**
 * POST /api/automation/fire
 *
 * Internal endpoint called by the WebSocket server to fire automation
 * events to all registered outbound webhooks. Protected by an internal
 * shared secret — not exposed to end users.
 */
export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('X-Internal-Secret');
    if (secret !== INTERNAL_SECRET) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { trigger, timestamp, roomId, userId, data } = body;

    if (!trigger || !timestamp) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing trigger or timestamp' },
        { status: 400 }
      );
    }

    await fireAutomationEvent({
      trigger: trigger as AutomationTrigger,
      timestamp,
      roomId,
      userId,
      data: data || {},
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { fired: true, trigger },
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fire automation event' },
      { status: 500 }
    );
  }
}
