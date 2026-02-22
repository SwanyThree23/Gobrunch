import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/services/stripe';
import type { ApiResponse } from '@/types';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    const isValid = verifyWebhookSignature(body, signature, STRIPE_WEBHOOK_SECRET);
    if (!isValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    switch (event.type) {
      case 'checkout.session.completed': {
        // Handle successful checkout - activate subscription
        const session = event.data.object;
        console.log('Checkout completed:', session.id);
        // TODO: Update user subscription tier in database
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Subscription updated:', subscription.id);
        // TODO: Update user subscription status
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Subscription cancelled:', subscription.id);
        // TODO: Downgrade user to free tier
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Payment failed:', invoice.id);
        // TODO: Notify user of payment failure
        break;
      }

      default:
        console.log('Unhandled webhook event:', event.type);
    }

    return NextResponse.json<ApiResponse>({ success: true });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
