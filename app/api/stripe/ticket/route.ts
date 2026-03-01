import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromHeader, getUserById } from '@/lib/services/auth';
import { getRoomById } from '@/lib/services/rooms';
import {
  createTicketCheckoutSession,
  getConnectAccountByUserId,
  StripeConnectError,
} from '@/lib/services/stripe-connect';
import type { ApiResponse } from '@/types';

const ticketSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  amount: z.number().int().min(100, 'Minimum ticket price is $1.00').max(1000000, 'Maximum ticket price is $10,000.00'),
});

/**
 * POST /api/stripe/ticket - Create a ticket purchase checkout session
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

    const buyer = getUserById(userPayload.userId);
    if (!buyer) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = ticketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { roomId, amount } = parsed.data;

    // Get the room and its host's Connect account
    const room = getRoomById(roomId);
    if (!room) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    const hostAccount = getConnectAccountByUserId(room.hostId);
    if (!hostAccount || hostAccount.status !== 'active') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Room host has not set up payments' },
        { status: 400 }
      );
    }

    const session = await createTicketCheckoutSession({
      amount,
      creatorAccountId: hostAccount.accountId,
      buyerEmail: buyer.email,
      eventTitle: room.title,
      roomId,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: session,
    });
  } catch (error) {
    const message = error instanceof StripeConnectError ? error.message : 'Failed to create ticket session';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
