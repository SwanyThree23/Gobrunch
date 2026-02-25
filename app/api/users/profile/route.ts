import { NextRequest, NextResponse } from 'next/server';
import { getUserFromHeader, getUserById, updateUser } from '@/lib/services/auth';
import type { ApiResponse, User } from '@/types';

export async function GET(request: NextRequest) {
  const payload = getUserFromHeader(request.headers.get('authorization'));
  if (!payload) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const user = getUserById(payload.userId);
  if (!user) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json<ApiResponse<User>>({ success: true, data: user });
}

export async function PATCH(request: NextRequest) {
  const payload = getUserFromHeader(request.headers.get('authorization'));
  if (!payload) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { displayName, bio, avatarUrl } = body;

  const updated = updateUser(payload.userId, { displayName, bio, avatarUrl });
  if (!updated) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json<ApiResponse<User>>({ success: true, data: updated });
}
