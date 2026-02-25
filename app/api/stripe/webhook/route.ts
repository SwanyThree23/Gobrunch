import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/services/stripe';
import { getUserByEmail, updateUser } from '@/lib/services/auth';
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
        const session = event.data.object;
        console.log('Checkout completed:', session.id);
        const customerEmail = session.customer_email || session.customer_details?.email;
        if (customerEmail) {
          const user = getUserByEmail(customerEmail);
          if (user) {
            const tier = session.metadata?.tier || 'pro';
            updateUser(user.id, { subscription: tier });
            console.log(`Upgraded ${customerEmail} to ${tier}`);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Subscription updated:', subscription.id);
        const email = subscription.customer_email;
        if (email) {
          const user = getUserByEmail(email);
          if (user) {
            const status = subscription.status === 'active' ? user.subscription : 'free';
            updateUser(user.id, { subscription: status });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Subscription cancelled:', subscription.id);
        const cancelEmail = subscription.customer_email;
        if (cancelEmail) {
          const user = getUserByEmail(cancelEmail);
          if (user) {
            updateUser(user.id, { subscription: 'free' });
            console.log(`Downgraded ${cancelEmail} to free`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Payment failed:', invoice.id, 'for', invoice.customer_email);
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
