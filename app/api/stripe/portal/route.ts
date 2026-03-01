import { NextRequest, NextResponse } from 'next/server';
import { getUserFromHeader, getUserById } from '@/lib/services/auth';
import { createBillingPortal, StripeConnectError } from '@/lib/services/stripe-connect';
import type { ApiResponse } from '@/types';

/**
 * POST /api/stripe/portal - Create a Stripe billing portal session
 * Allows users to manage their subscriptions, update payment methods, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromHeader(authHeader);
    if (!userPayload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = getUserById(userPayload.userId);
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No active subscription found' },
        { status: 400 }
      );
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`;
    const url = await createBillingPortal(user.stripeCustomerId, returnUrl);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { url },
    });
  } catch (error) {
    const message = error instanceof StripeConnectError ? error.message : 'Failed to create portal session';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
