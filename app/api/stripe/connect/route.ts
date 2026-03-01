import { NextRequest, NextResponse } from 'next/server';
import { getUserFromHeader, getUserById } from '@/lib/services/auth';
import {
  createConnectAccount,
  getConnectAccountByUserId,
  getConnectAccountStatus,
  getOnboardingLink,
  createDashboardLink,
  StripeConnectError,
} from '@/lib/services/stripe-connect';
import type { ApiResponse } from '@/types';

/**
 * GET /api/stripe/connect - Get current user's Connect account status
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
      return NextResponse.json<ApiResponse>({
        success: true,
        data: { status: 'not_created', accountId: null },
      });
    }

    // Fetch live status from Stripe
    const status = await getConnectAccountStatus(account.accountId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        accountId: account.accountId,
        ...status,
      },
    });
  } catch (error) {
    const message = error instanceof StripeConnectError ? error.message : 'Failed to get Connect status';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stripe/connect - Create or continue Connect onboarding
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

    const body = await request.json();
    const action = body.action || 'create'; // 'create' | 'refresh' | 'dashboard'

    const existingAccount = getConnectAccountByUserId(user.id);

    if (action === 'dashboard' && existingAccount) {
      const dashboardUrl = await createDashboardLink(existingAccount.accountId);
      return NextResponse.json<ApiResponse>({
        success: true,
        data: { url: dashboardUrl },
      });
    }

    if (action === 'refresh' && existingAccount) {
      const onboardingUrl = await getOnboardingLink(existingAccount.accountId);
      return NextResponse.json<ApiResponse>({
        success: true,
        data: { onboardingUrl, accountId: existingAccount.accountId },
      });
    }

    // Create new Connect account
    if (existingAccount) {
      // Account exists, return refreshed onboarding link
      const onboardingUrl = await getOnboardingLink(existingAccount.accountId);
      return NextResponse.json<ApiResponse>({
        success: true,
        data: { onboardingUrl, accountId: existingAccount.accountId },
      });
    }

    const result = await createConnectAccount({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof StripeConnectError ? error.message : 'Failed to create Connect account';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
