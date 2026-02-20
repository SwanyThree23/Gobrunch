import { NextRequest, NextResponse } from 'next/server';
import { registerUser, AuthError } from '@/lib/services/auth';
import { registerSchema } from '@/lib/validators';
import type { ApiResponse, AuthResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, username, displayName, password } = parsed.data;
    const result = await registerUser(email, username, displayName, password);

    return NextResponse.json<ApiResponse<AuthResponse>>(
      { success: true, data: result },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: 409 }
      );
    }
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
