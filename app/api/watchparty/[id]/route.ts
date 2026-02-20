import { NextRequest, NextResponse } from 'next/server';
import { getUserFromHeader } from '@/lib/services/auth';
import {
  getWatchPartyById,
  joinWatchParty,
  leaveWatchParty,
  handleSyncEvent,
  WatchPartyError,
} from '@/lib/services/watchparty';
import { watchPartySyncSchema } from '@/lib/validators';
import type { ApiResponse, WatchParty, WatchPartySyncEvent } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const party = getWatchPartyById(params.id);

    if (!party) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Watch party not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<WatchParty>>({
      success: true,
      data: party,
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/** Join a watch party */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = getUserFromHeader(authHeader);

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const party = joinWatchParty(params.id, user.userId);

    if (!party) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Watch party not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<WatchParty>>({
      success: true,
      data: party,
    });
  } catch (error) {
    if (error instanceof WatchPartyError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/** Sync event (play/pause/seek/etc.) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = getUserFromHeader(authHeader);

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = watchPartySyncSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const syncEvent: WatchPartySyncEvent = {
      type: parsed.data.type,
      timestamp: Date.now(),
      userId: user.userId,
      data: parsed.data.data,
    };

    const party = handleSyncEvent(params.id, user.userId, syncEvent);

    if (!party) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Watch party not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<WatchParty>>({
      success: true,
      data: party,
    });
  } catch (error) {
    if (error instanceof WatchPartyError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/** Leave a watch party */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = getUserFromHeader(authHeader);

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const party = leaveWatchParty(params.id, user.userId);

    if (!party) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Watch party not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Left watch party',
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
