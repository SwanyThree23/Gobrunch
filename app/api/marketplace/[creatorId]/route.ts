/**
 * API: Creator Marketplace - P2P Payments, Subscriptions, Products
 * GET /api/marketplace/:creatorId - Get full marketplace data
 * POST /api/marketplace/:creatorId - Manage products, P2P links, subscription plans
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  addP2PLink,
  getP2PLinks,
  removeP2PLink,
  getP2PPaymentUrl,
  createDefaultSubPlans,
  getCreatorSubPlans,
  addCreatorProduct,
  getCreatorProducts,
  getCreatorMarketplace,
} from '@/lib/services/paywall';
import type { P2PPaymentProvider } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> }
) {
  const { creatorId } = await params;
  const marketplace = getCreatorMarketplace(creatorId);

  return NextResponse.json({ success: true, data: marketplace });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> }
) {
  const { creatorId } = await params;
  const body = await request.json();
  const { action } = body;

  switch (action) {
    // ---- P2P Payment Links ----
    case 'add-p2p-link': {
      const link = addP2PLink(
        creatorId,
        body.provider as P2PPaymentProvider,
        body.handle,
        body.displayLabel
      );
      const paymentUrl = getP2PPaymentUrl(body.provider, body.handle);
      return NextResponse.json({ success: true, data: { link, paymentUrl } });
    }

    case 'get-p2p-links': {
      const links = getP2PLinks(creatorId);
      return NextResponse.json({ success: true, data: links });
    }

    case 'remove-p2p-link': {
      const removed = removeP2PLink(creatorId, body.linkId);
      return NextResponse.json({ success: removed });
    }

    case 'p2p-url': {
      const url = getP2PPaymentUrl(body.provider, body.handle);
      return NextResponse.json({ success: true, data: { url } });
    }

    // ---- Subscription Plans ----
    case 'init-sub-plans': {
      const plans = createDefaultSubPlans(creatorId);
      return NextResponse.json({ success: true, data: plans });
    }

    case 'get-sub-plans': {
      const plans = getCreatorSubPlans(creatorId);
      return NextResponse.json({ success: true, data: plans });
    }

    // ---- Products ----
    case 'add-product': {
      const product = addCreatorProduct(creatorId, {
        name: body.name,
        description: body.description,
        type: body.type,
        priceInCents: body.priceInCents,
        imageUrl: body.imageUrl,
        downloadUrl: body.downloadUrl,
        inventory: body.inventory,
      });
      return NextResponse.json({ success: true, data: product });
    }

    case 'get-products': {
      const products = getCreatorProducts(creatorId);
      return NextResponse.json({ success: true, data: products });
    }

    default:
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }
}
