import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromHeader } from '@/lib/services/auth';
import {
  createAutomationWebhook,
  getUserWebhooks,
  deleteAutomationWebhook,
  toggleAutomationWebhook,
  getAvailableTriggers,
  getInboundWebhookUrl,
} from '@/lib/services/streaming';
import type { ApiResponse, AutomationTrigger } from '@/types';

const VALID_TRIGGERS: AutomationTrigger[] = [
  'stream.started', 'stream.ended', 'viewer.joined', 'viewer.left',
  'chat.message', 'tip.received', 'ticket.purchased', 'subscriber.new',
  'room.created', 'watchparty.started',
];

const webhookCreateSchema = z.object({
  name: z.string().min(1).max(100),
  targetUrl: z.string().url('Must be a valid URL'),
  triggers: z.array(z.enum(VALID_TRIGGERS as [AutomationTrigger, ...AutomationTrigger[]])).min(1, 'Select at least one trigger'),
});

/**
 * GET /api/automation/webhooks
 * Get all automation webhooks for the current user + available triggers.
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

    const webhooks = getUserWebhooks(userPayload.userId);
    const triggers = getAvailableTriggers();
    const inboundUrl = getInboundWebhookUrl(userPayload.userId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        webhooks,
        availableTriggers: triggers,
        inboundWebhookUrl: inboundUrl,
      },
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/automation/webhooks
 * Create, delete, or toggle an automation webhook.
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

    const body = await request.json();
    const action = body.action || 'create';

    switch (action) {
      case 'create': {
        const parsed = webhookCreateSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: parsed.error.errors[0].message },
            { status: 400 }
          );
        }

        const webhook = createAutomationWebhook({
          userId: userPayload.userId,
          name: parsed.data.name,
          targetUrl: parsed.data.targetUrl,
          triggers: parsed.data.triggers,
        });

        return NextResponse.json<ApiResponse>({
          success: true,
          data: webhook,
          message: 'Webhook created. Use the signing secret to verify payloads.',
        });
      }

      case 'delete': {
        const { webhookId } = body;
        if (!webhookId) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'webhookId is required' },
            { status: 400 }
          );
        }
        const deleted = deleteAutomationWebhook(userPayload.userId, webhookId);
        return NextResponse.json<ApiResponse>({
          success: deleted,
          error: deleted ? undefined : 'Webhook not found',
        });
      }

      case 'toggle': {
        const { webhookId } = body;
        const toggled = toggleAutomationWebhook(userPayload.userId, webhookId);
        return NextResponse.json<ApiResponse>({
          success: !!toggled,
          data: toggled,
        });
      }

      default:
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to manage webhook' },
      { status: 500 }
    );
  }
}
