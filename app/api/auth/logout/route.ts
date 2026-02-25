import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';

export async function POST() {
  const response = NextResponse.json<ApiResponse>({
    success: true,
    message: 'Logged out successfully',
  });

  response.cookies.set('auth_token', '', { path: '/', maxAge: 0 });
  return response;
}
