import { NextRequest, NextResponse } from 'next/server';
import { getUserFromHeader, getUserById } from '@/lib/services/auth';
import { createCheckoutSession, StripeError } from '@/lib/services/stripe';
import { checkoutSchema } from '@/lib/validators';
import type { ApiResponse } from '@/types';

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

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { priceId, successUrl, cancelUrl } = parsed.data;

    const session = await createCheckoutSession({
      priceId,
      customerId: user.stripeCustomerId,
      customerEmail: !user.stripeCustomerId ? user.email : undefined,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json<ApiResponse<{ sessionId: string; url: string }>>({
      success: true,
      data: session,
    });
  } catch (error) {
    if (error instanceof StripeError) {
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
