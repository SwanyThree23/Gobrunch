import { NextRequest, NextResponse } from 'next/server';
import { getUserFromHeader } from '@/lib/services/auth';
import {
  createWatchParty,
  getWatchPartyByInviteCode,
  listUserWatchParties,
} from '@/lib/services/watchparty';
import { watchPartyCreateSchema } from '@/lib/validators';
import type { ApiResponse, WatchParty } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inviteCode = searchParams.get('code');

    // Lookup by invite code
    if (inviteCode) {
      const party = getWatchPartyByInviteCode(inviteCode);
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
    }

    // List user's watch parties
    const authHeader = request.headers.get('authorization');
    const user = getUserFromHeader(authHeader);

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const parties = listUserWatchParties(user.userId);
    return NextResponse.json<ApiResponse<WatchParty[]>>({
      success: true,
      data: parties,
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const parsed = watchPartyCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const party = createWatchParty(user.userId, parsed.data);

    return NextResponse.json<ApiResponse<WatchParty>>(
      { success: true, data: party },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
