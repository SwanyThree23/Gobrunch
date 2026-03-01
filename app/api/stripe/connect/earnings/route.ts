import { NextRequest, NextResponse } from 'next/server';
import { getUserFromHeader } from '@/lib/services/auth';
import {
  getConnectAccountByUserId,
  getCreatorEarnings,
  StripeConnectError,
} from '@/lib/services/stripe-connect';
import type { ApiResponse } from '@/types';

/**
 * GET /api/stripe/connect/earnings - Get creator's earnings and transaction history
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromHeader(authHeader);
    if (!userPayload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const account = getConnectAccountByUserId(userPayload.userId);
    if (!account) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No Connect account found. Complete onboarding first.' },
        { status: 404 }
      );
    }

    const earnings = await getCreatorEarnings(account.accountId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: earnings,
    });
  } catch (error) {
    const message = error instanceof StripeConnectError ? error.message : 'Failed to fetch earnings';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
