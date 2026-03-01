import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromHeader, getUserById } from '@/lib/services/auth';
import {
  createTipCheckoutSession,
  getConnectAccountByUserId,
  StripeConnectError,
} from '@/lib/services/stripe-connect';
import type { ApiResponse } from '@/types';

const tipSchema = z.object({
  creatorId: z.string().min(1, 'Creator ID is required'),
  amount: z.number().int().min(100, 'Minimum tip is $1.00').max(100000, 'Maximum tip is $1,000.00'),
  message: z.string().max(500).optional(),
  roomId: z.string().optional(),
});

/**
 * POST /api/stripe/tip - Create a tip checkout session for a creator
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

    const tipper = getUserById(userPayload.userId);
    if (!tipper) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = tipSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { creatorId, amount, message, roomId } = parsed.data;

    // Get creator's Connect account
    const creatorAccount = getConnectAccountByUserId(creatorId);
    if (!creatorAccount || creatorAccount.status !== 'active') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Creator has not set up payments yet' },
        { status: 400 }
      );
    }

    const creator = getUserById(creatorId);
    if (!creator) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Creator not found' },
        { status: 404 }
      );
    }

    const session = await createTipCheckoutSession({
      amount,
      creatorAccountId: creatorAccount.accountId,
      tipperEmail: tipper.email,
      creatorName: creator.displayName,
      roomId,
      message,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: session,
    });
  } catch (error) {
    const message = error instanceof StripeConnectError ? error.message : 'Failed to create tip session';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
