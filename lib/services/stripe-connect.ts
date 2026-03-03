import Stripe from 'stripe';
import type { ConnectAccountStatus, CreatorEarnings, EarningsTransaction } from '@/types';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const PLATFORM_FEE_PERCENT = 15; // 15% platform fee on direct charges

// Initialize Stripe with the official SDK for proper signature verification
const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-12-18.acacia' as Stripe.LatestApiVersion })
  : null;

function getStripe(): Stripe {
  if (!stripe) throw new StripeConnectError('Stripe is not configured. Set STRIPE_SECRET_KEY.');
  return stripe;
}

// ---- In-memory Connect account store (replace with DB in production) ----
const connectAccounts = new Map<string, {
  userId: string;
  accountId: string;
  status: ConnectAccountStatus;
  createdAt: string;
}>();

// In-memory processed event IDs for idempotency
const processedEvents = new Set<string>();

// In-memory ticket purchase tracker: userId -> Set<roomId>
const ticketPurchases = new Map<string, Set<string>>();

// ---- Connect Account Management ----

/**
 * Create a Stripe Connect Express account for a creator.
 */
export async function createConnectAccount(params: {
  userId: string;
  email: string;
  displayName: string;
  country?: string;
}): Promise<{ accountId: string; onboardingUrl: string }> {
  const s = getStripe();

  const account = await s.accounts.create({
    type: 'express',
    email: params.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: {
      name: params.displayName,
      product_description: 'Live streaming content creator on SeeWhy LIVE',
      mcc: '5815', // Digital goods - media
    },
    metadata: {
      userId: params.userId,
      platform: 'seewhy-live',
    },
    settings: {
      payouts: {
        schedule: {
          interval: 'daily',
        },
      },
    },
  });

  // Store the mapping
  connectAccounts.set(params.userId, {
    userId: params.userId,
    accountId: account.id,
    status: 'onboarding',
    createdAt: new Date().toISOString(),
  });

  // Create the onboarding link
  const accountLink = await s.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/creator/onboarding?refresh=true`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/creator/onboarding?success=true`,
    type: 'account_onboarding',
  });

  return { accountId: account.id, onboardingUrl: accountLink.url };
}

/**
 * Get the onboarding link for an existing Connect account.
 */
export async function getOnboardingLink(accountId: string): Promise<string> {
  const s = getStripe();

  const accountLink = await s.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/creator/onboarding?refresh=true`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/creator/onboarding?success=true`,
    type: 'account_onboarding',
  });

  return accountLink.url;
}

/**
 * Retrieve a Connect account's status and capabilities.
 */
export async function getConnectAccountStatus(accountId: string): Promise<{
  status: ConnectAccountStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  currentlyDue: string[];
}> {
  const s = getStripe();

  const account = await s.accounts.retrieve(accountId);

  let status: ConnectAccountStatus = 'onboarding';
  if (account.charges_enabled && account.payouts_enabled) {
    status = 'active';
  } else if (account.requirements?.disabled_reason) {
    status = 'disabled';
  } else if (account.requirements?.currently_due && account.requirements.currently_due.length > 0) {
    status = 'restricted';
  } else if (account.details_submitted) {
    status = 'active';
  }

  return {
    status,
    chargesEnabled: account.charges_enabled ?? false,
    payoutsEnabled: account.payouts_enabled ?? false,
    detailsSubmitted: account.details_submitted ?? false,
    currentlyDue: account.requirements?.currently_due || [],
  };
}

/**
 * Get a Connect account by user ID.
 */
export function getConnectAccountByUserId(userId: string): { accountId: string; status: ConnectAccountStatus } | null {
  const account = connectAccounts.get(userId);
  if (!account) return null;
  return { accountId: account.accountId, status: account.status };
}

/**
 * Store/update a Connect account mapping.
 */
export function setConnectAccount(userId: string, accountId: string, status: ConnectAccountStatus): void {
  connectAccounts.set(userId, {
    userId,
    accountId,
    status,
    createdAt: connectAccounts.get(userId)?.createdAt || new Date().toISOString(),
  });
}

/**
 * Create a Stripe Connect login link for the Express Dashboard.
 */
export async function createDashboardLink(accountId: string): Promise<string> {
  const s = getStripe();
  const link = await s.accounts.createLoginLink(accountId);
  return link.url;
}

// ---- Direct Charges ----

/**
 * Create a direct charge on a connected account (e.g. for tips, tickets).
 */
export async function createDirectCharge(params: {
  amount: number;
  currency?: string;
  connectedAccountId: string;
  customerEmail?: string;
  description?: string;
  applicationFeePercent?: number;
  metadata?: Record<string, string>;
}): Promise<{ paymentIntentId: string; clientSecret: string }> {
  const s = getStripe();

  const feePercent = params.applicationFeePercent ?? PLATFORM_FEE_PERCENT;
  const applicationFeeAmount = Math.round(params.amount * (feePercent / 100));

  const paymentIntent = await s.paymentIntents.create(
    {
      amount: params.amount, // in cents
      currency: params.currency || 'usd',
      application_fee_amount: applicationFeeAmount,
      description: params.description || 'SeeWhy LIVE payment',
      metadata: {
        platform: 'seewhy-live',
        ...params.metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    },
    {
      stripeAccount: params.connectedAccountId,
    }
  );

  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret!,
  };
}

/**
 * Create a Checkout Session for a tip to a creator (direct charge).
 */
export async function createTipCheckoutSession(params: {
  amount: number;
  creatorAccountId: string;
  tipperEmail?: string;
  creatorName: string;
  roomId?: string;
  message?: string;
}): Promise<{ sessionId: string; url: string }> {
  const s = getStripe();

  const applicationFeeAmount = Math.round(params.amount * (PLATFORM_FEE_PERCENT / 100));

  const session = await s.checkout.sessions.create(
    {
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Tip for ${params.creatorName}`,
              description: params.message || `Support ${params.creatorName} on SeeWhy LIVE`,
            },
            unit_amount: params.amount,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        metadata: {
          type: 'tip',
          roomId: params.roomId || '',
          message: params.message || '',
          platform: 'seewhy-live',
        },
      },
      customer_email: params.tipperEmail,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/tip/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/tip/cancelled`,
    },
    {
      stripeAccount: params.creatorAccountId,
    }
  );

  return { sessionId: session.id, url: session.url! };
}

/**
 * Create a Checkout Session for an event ticket (direct charge on connected account).
 */
export async function createTicketCheckoutSession(params: {
  amount: number;
  creatorAccountId: string;
  buyerEmail?: string;
  eventTitle: string;
  roomId: string;
}): Promise<{ sessionId: string; url: string }> {
  const s = getStripe();

  const applicationFeeAmount = Math.round(params.amount * (PLATFORM_FEE_PERCENT / 100));

  const session = await s.checkout.sessions.create(
    {
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Ticket: ${params.eventTitle}`,
              description: `Access to live event on SeeWhy LIVE`,
            },
            unit_amount: params.amount,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        metadata: {
          type: 'ticket',
          roomId: params.roomId,
          platform: 'seewhy-live',
        },
      },
      customer_email: params.buyerEmail,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/room/${params.roomId}?ticket=confirmed`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/room/${params.roomId}?ticket=cancelled`,
    },
    {
      stripeAccount: params.creatorAccountId,
    }
  );

  return { sessionId: session.id, url: session.url! };
}

// ---- Subscription Checkout (Platform) ----

/**
 * Create a subscription checkout session using the official Stripe SDK.
 */
export async function createSubscriptionCheckout(params: {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<{ sessionId: string; url: string }> {
  const s = getStripe();

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
  };

  if (params.customerId) {
    sessionParams.customer = params.customerId;
  } else if (params.customerEmail) {
    sessionParams.customer_email = params.customerEmail;
  }

  const session = await s.checkout.sessions.create(sessionParams);
  return { sessionId: session.id, url: session.url! };
}

/**
 * Create a billing portal session for subscription management.
 */
export async function createBillingPortal(customerId: string, returnUrl: string): Promise<string> {
  const s = getStripe();
  const session = await s.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

// ---- Earnings & Balance ----

/**
 * Get a connected account's balance and recent transactions.
 */
export async function getCreatorEarnings(accountId: string): Promise<CreatorEarnings> {
  const s = getStripe();

  const [balance, charges, payouts] = await Promise.all([
    s.balance.retrieve({ stripeAccount: accountId }),
    s.charges.list({ limit: 20 }, { stripeAccount: accountId }),
    s.payouts.list({ limit: 5 }, { stripeAccount: accountId }),
  ]);

  const availableBalance = balance.available.reduce(
    (sum, b) => sum + b.amount,
    0
  );
  const pendingBalance = balance.pending.reduce(
    (sum, b) => sum + b.amount,
    0
  );

  const transactions: EarningsTransaction[] = charges.data.map((charge) => ({
    id: charge.id,
    type: (charge.metadata?.type as EarningsTransaction['type']) || 'tip',
    amount: charge.amount,
    fee: charge.application_fee_amount || 0,
    net: charge.amount - (charge.application_fee_amount || 0),
    currency: charge.currency,
    description: charge.description || 'Payment',
    status: charge.status === 'succeeded' ? 'completed' : charge.status === 'pending' ? 'pending' : 'failed',
    createdAt: new Date(charge.created * 1000).toISOString(),
    fromUser: charge.metadata?.fromUser,
  }));

  const lastPayout = payouts.data[0];

  return {
    totalEarnings: transactions.reduce((sum, t) => sum + t.net, 0),
    availableBalance,
    pendingBalance,
    lastPayoutDate: lastPayout ? new Date(lastPayout.created * 1000).toISOString() : undefined,
    lastPayoutAmount: lastPayout?.amount,
    transactions,
  };
}

// ---- Webhook Verification (Production-grade) ----

/**
 * Verify a Stripe webhook signature using the official SDK.
 * Includes 5-minute replay protection.
 */
export function verifyWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  const s = getStripe();

  // Official SDK signature verification
  const event = s.webhooks.constructEvent(payload, signature, secret);

  // Replay protection: reject events older than 5 minutes
  const eventTimestamp = event.created;
  const now = Math.floor(Date.now() / 1000);
  const FIVE_MINUTES = 300;

  if (now - eventTimestamp > FIVE_MINUTES) {
    throw new StripeConnectError('Webhook event is too old (replay protection)');
  }

  return event;
}

/**
 * Check if an event has already been processed (idempotency).
 */
export function isEventProcessed(eventId: string): boolean {
  return processedEvents.has(eventId);
}

/**
 * Mark an event as processed.
 */
export function markEventProcessed(eventId: string): void {
  processedEvents.add(eventId);
  // Cleanup: limit set size to prevent memory leaks
  if (processedEvents.size > 10000) {
    const entries = Array.from(processedEvents);
    for (let i = 0; i < 5000; i++) {
      processedEvents.delete(entries[i]);
    }
  }
}

// ---- Ticket Access Tracking ----

/**
 * Record a ticket purchase for a user + room.
 */
export function recordTicketPurchase(userId: string, roomId: string): void {
  if (!ticketPurchases.has(userId)) {
    ticketPurchases.set(userId, new Set());
  }
  ticketPurchases.get(userId)!.add(roomId);
}

/**
 * Check if a user has purchased a ticket for a specific room.
 */
export function hasTicketForRoom(userId: string, roomId: string): boolean {
  return ticketPurchases.get(userId)?.has(roomId) ?? false;
}

// ---- Error Class ----

export class StripeConnectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StripeConnectError';
  }
}
