/**
 * API: Golden Paywall & Monetization
 * GET /api/paywall/:roomId - Get paywall config & status
 * POST /api/paywall/:roomId - Start preview / Record payment / Configure
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  setPaywallConfig,
  getPaywallConfig,
  startPaywallPreview,
  checkPaywallStatus,
  recordPaywallPayment,
  calculateRevenueSplit,
  getEmbeddablePlayerConfig,
  getEmbedCode,
} from '@/lib/services/paywall';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const url = new URL(request.url);
  const viewerId = url.searchParams.get('viewerId');

  const config = getPaywallConfig(roomId);
  const embedConfig = getEmbeddablePlayerConfig(roomId);
  const embedCode = getEmbedCode(roomId);

  let status = null;
  if (viewerId) {
    status = checkPaywallStatus(viewerId, roomId);
  }

  return NextResponse.json({
    success: true,
    data: { config, status, embedConfig, embedCode },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const body = await request.json();
  const { action } = body;

  switch (action) {
    case 'configure': {
      const config = setPaywallConfig(roomId, body.config);
      return NextResponse.json({ success: true, data: config });
    }

    case 'start-preview': {
      if (!body.viewerId) {
        return NextResponse.json({ success: false, error: 'viewerId required' }, { status: 400 });
      }
      const session = startPaywallPreview(body.viewerId, roomId);
      return NextResponse.json({ success: true, data: session });
    }

    case 'check-status': {
      if (!body.viewerId) {
        return NextResponse.json({ success: false, error: 'viewerId required' }, { status: 400 });
      }
      const status = checkPaywallStatus(body.viewerId, roomId);
      return NextResponse.json({ success: true, data: status });
    }

    case 'record-payment': {
      const session = recordPaywallPayment(
        body.viewerId,
        roomId,
        body.amountInCents,
        body.method || 'stripe'
      );
      const split = calculateRevenueSplit(body.amountInCents);
      return NextResponse.json({ success: true, data: { session, split } });
    }

    case 'revenue-split': {
      const split = calculateRevenueSplit(body.amountInCents);
      return NextResponse.json({ success: true, data: split });
    }

    case 'embed-config': {
      const config = getEmbeddablePlayerConfig(roomId, body.options);
      const code = getEmbedCode(roomId, body.width, body.height);
      return NextResponse.json({ success: true, data: { config, code } });
    }

    default:
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }
}
