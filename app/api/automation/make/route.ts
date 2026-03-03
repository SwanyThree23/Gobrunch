import { NextRequest, NextResponse } from 'next/server';
import { getUserFromHeader } from '@/lib/services/auth';
import {
  generateApiKey,
  getApiKey,
  revokeApiKey,
  getMakeScenarioTemplates,
  getMakeSetupGuide,
} from '@/lib/services/make-integration';
import type { ApiResponse } from '@/types';

/**
 * GET /api/automation/make
 *
 * Get Make.com integration details: setup guide, scenario templates,
 * API key status, and webhook URLs.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = getUserFromHeader(authHeader);
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const guide = getMakeSetupGuide(user.userId);
    const templates = getMakeScenarioTemplates(user.userId);
    const apiKey = getApiKey(user.userId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        guide,
        templates,
        apiKey,
      },
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to load Make.com integration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/automation/make
 *
 * Manage Make.com integration: generate/revoke API keys.
 */
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
    const { action } = body;

    switch (action) {
      case 'generate_key': {
        const name = body.name || 'Make.com API Key';
        const result = generateApiKey(user.userId, name);
        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            key: result.key,
            name: result.name,
            createdAt: result.createdAt,
            note: 'Save this key — it will not be shown again in full.',
          },
        });
      }

      case 'revoke_key': {
        const revoked = revokeApiKey(user.userId);
        return NextResponse.json<ApiResponse>({
          success: true,
          data: { revoked },
        });
      }

      default:
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Unknown action: ${action}. Available: generate_key, revoke_key` },
          { status: 400 }
        );
    }
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
