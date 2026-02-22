import { NextRequest, NextResponse } from 'next/server';
import { getUserFromHeader } from '@/lib/services/auth';
import { createRoom, listRooms } from '@/lib/services/rooms';
import { roomCreateSchema } from '@/lib/validators';
import type { ApiResponse, Room, PaginatedResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as Room['status'] | null;
    const hostId = searchParams.get('hostId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const result = listRooms({
      status: status || undefined,
      hostId: hostId || undefined,
      page,
      pageSize,
    });

    return NextResponse.json<PaginatedResponse<Room>>({
      success: true,
      data: result.rooms,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
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
    const parsed = roomCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const room = createRoom(user.userId, parsed.data);

    return NextResponse.json<ApiResponse<Room>>(
      { success: true, data: room },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
