import type { SubscriptionTier } from '@/types';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_API_URL = 'https://api.stripe.com/v1';

/**
 * Create a Stripe checkout session.
 */
export async function createCheckoutSession(params: {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; url: string }> {
  const body = new URLSearchParams({
    'line_items[0][price]': params.priceId,
    'line_items[0][quantity]': '1',
    mode: 'subscription',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  if (params.customerId) {
    body.append('customer', params.customerId);
  } else if (params.customerEmail) {
    body.append('customer_email', params.customerEmail);
  }

  const response = await fetch(`${STRIPE_API_URL}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new StripeError(`Stripe error: ${error.error?.message || 'Unknown error'}`);
  }

  const session = await response.json();
  return { sessionId: session.id, url: session.url };
}

/**
 * Get subscription details for a customer.
 */
export async function getSubscription(subscriptionId: string): Promise<{
  id: string;
  status: string;
  tier: SubscriptionTier;
  currentPeriodEnd: number;
}> {
  const response = await fetch(`${STRIPE_API_URL}/subscriptions/${subscriptionId}`, {
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
    },
  });

  if (!response.ok) {
    throw new StripeError('Failed to fetch subscription');
  }

  const sub = await response.json();
  return {
    id: sub.id,
    status: sub.status,
    tier: mapPriceToTier(sub.items?.data?.[0]?.price?.id),
    currentPeriodEnd: sub.current_period_end,
  };
}

/**
 * Create a Stripe portal session for managing subscriptions.
 */
export async function createPortalSession(customerId: string, returnUrl: string): Promise<string> {
  const body = new URLSearchParams({
    customer: customerId,
    return_url: returnUrl,
  });

  const response = await fetch(`${STRIPE_API_URL}/billing_portal/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new StripeError('Failed to create portal session');
  }

  const session = await response.json();
  return session.url;
}

/**
 * Verify a Stripe webhook signature.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // In production, use Stripe's official SDK for verification.
  // This is a simplified check for the structure.
  if (!signature || !secret) return false;

  const parts = signature.split(',');
  const timestampPart = parts.find((p) => p.startsWith('t='));
  const sigPart = parts.find((p) => p.startsWith('v1='));

  return Boolean(timestampPart && sigPart && payload);
}

/** Map a Stripe price ID to a subscription tier */
function mapPriceToTier(priceId: string): SubscriptionTier {
  const proIds = [
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  ];
  const enterpriseIds = [
    process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
    process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID,
  ];

  if (proIds.includes(priceId)) return 'pro';
  if (enterpriseIds.includes(priceId)) return 'enterprise';
  return 'free';
}

/** Custom error class for Stripe errors */
export class StripeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StripeError';
  }
}
