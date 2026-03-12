/**
 * Monetization Flywheel - Golden Paywall, P2P Payments, Marketplace
 * 90/10 Revenue Split: Creator keeps 90%, platform takes 10%
 */
import { v4 as uuidv4 } from 'uuid';
import type {
  PaywallConfig,
  PaywallSession,
  PaywallPriceOption,
  PaywallStatus,
  EmbeddablePlayerConfig,
  P2PPaymentLink,
  P2PPaymentProvider,
  CreatorSubscriptionPlan,
  CreatorSubscriptionTier,
  CreatorProduct,
  CreatorMarketplace,
} from '@/types';

const PLATFORM_FEE = 0.10; // 10% platform fee (creator keeps 90%)
const GOLDEN_PAYWALL_PREVIEW_SECONDS = 120; // 2-minute free preview
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ---- In-memory stores ----
const paywallConfigs = new Map<string, PaywallConfig>();
const paywallSessions = new Map<string, PaywallSession>(); // key: `${viewerId}:${roomId}`
const p2pLinks = new Map<string, P2PPaymentLink[]>(); // creatorId -> links
const creatorSubPlans = new Map<string, CreatorSubscriptionPlan[]>(); // creatorId -> plans
const creatorProducts = new Map<string, CreatorProduct[]>(); // creatorId -> products

// ============================================================
// GOLDEN PAYWALL - 2-Minute Free Preview
// ============================================================

/**
 * Configure the paywall for a room.
 */
export function setPaywallConfig(roomId: string, config: Partial<PaywallConfig>): PaywallConfig {
  const paywallConfig: PaywallConfig = {
    enabled: config.enabled ?? true,
    previewDurationSeconds: config.previewDurationSeconds ?? GOLDEN_PAYWALL_PREVIEW_SECONDS,
    priceOptions: config.priceOptions ?? getDefaultPriceOptions(),
    blurIntensity: config.blurIntensity ?? 12,
    ctaText: config.ctaText ?? 'Continue Watching',
    ctaSubtext: config.ctaSubtext ?? 'Support the creator and unlock the full stream',
  };

  paywallConfigs.set(roomId, paywallConfig);
  return paywallConfig;
}

/**
 * Get paywall config for a room.
 */
export function getPaywallConfig(roomId: string): PaywallConfig | null {
  return paywallConfigs.get(roomId) ?? null;
}

/**
 * Default micro-transaction price options ($0.99 - $4.99).
 */
function getDefaultPriceOptions(): PaywallPriceOption[] {
  return [
    { id: 'pw_099', amount: 99, label: '$0.99', description: 'Single view access', duration: 'single-view' },
    { id: 'pw_199', amount: 199, label: '$1.99', description: '24-hour access', duration: '24-hours' },
    { id: 'pw_299', amount: 299, label: '$2.99', description: '24-hour access', duration: '24-hours' },
    { id: 'pw_499', amount: 499, label: '$4.99', description: 'Lifetime access', duration: 'lifetime' },
  ];
}

/**
 * Start a paywall preview session for a viewer.
 * The 120-second countdown begins.
 */
export function startPaywallPreview(viewerId: string, roomId: string): PaywallSession {
  const key = `${viewerId}:${roomId}`;

  // Check if session already exists
  const existing = paywallSessions.get(key);
  if (existing) return existing;

  const config = paywallConfigs.get(roomId);
  const previewDuration = config?.previewDurationSeconds ?? GOLDEN_PAYWALL_PREVIEW_SECONDS;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + previewDuration * 1000);

  const session: PaywallSession = {
    id: uuidv4(),
    viewerId,
    roomId,
    status: 'preview',
    previewStartedAt: now.toISOString(),
    previewExpiresAt: expiresAt.toISOString(),
  };

  paywallSessions.set(key, session);
  return session;
}

/**
 * Check paywall status for a viewer in a room.
 */
export function checkPaywallStatus(viewerId: string, roomId: string): {
  status: PaywallStatus;
  remainingSeconds: number;
  session?: PaywallSession;
} {
  const key = `${viewerId}:${roomId}`;
  const session = paywallSessions.get(key);

  if (!session) {
    return { status: 'preview', remainingSeconds: GOLDEN_PAYWALL_PREVIEW_SECONDS };
  }

  if (session.status === 'paid' || session.status === 'bypassed') {
    return { status: session.status, remainingSeconds: -1, session };
  }

  const now = new Date();
  const expiresAt = new Date(session.previewExpiresAt);
  const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

  if (remaining === 0 && session.status === 'preview') {
    session.status = 'expired';
  }

  return { status: session.status, remainingSeconds: remaining, session };
}

/**
 * Record a paywall payment (90% to creator, 10% to platform).
 */
export function recordPaywallPayment(viewerId: string, roomId: string, amountInCents: number, method: 'stripe' | 'p2p'): PaywallSession | null {
  const key = `${viewerId}:${roomId}`;
  let session = paywallSessions.get(key);

  if (!session) {
    session = startPaywallPreview(viewerId, roomId);
  }

  session.status = 'paid';
  session.paidAt = new Date().toISOString();
  session.amountPaid = amountInCents;
  session.paymentMethod = method;

  return session;
}

/**
 * Calculate the 90/10 revenue split.
 */
export function calculateRevenueSplit(amountInCents: number): {
  creatorAmount: number;
  platformFee: number;
  creatorPercentage: number;
  platformPercentage: number;
} {
  const platformFee = Math.round(amountInCents * PLATFORM_FEE);
  const creatorAmount = amountInCents - platformFee;

  return {
    creatorAmount,
    platformFee,
    creatorPercentage: 90,
    platformPercentage: 10,
  };
}

// ============================================================
// EMBEDDABLE PLAYER
// ============================================================

/**
 * Generate embeddable player iframe configuration.
 */
export function getEmbeddablePlayerConfig(roomId: string, options?: Partial<EmbeddablePlayerConfig>): EmbeddablePlayerConfig {
  return {
    roomId,
    width: options?.width ?? '100%',
    height: options?.height ?? '100%',
    autoplay: options?.autoplay ?? true,
    muted: options?.muted ?? true,
    paywallEnabled: options?.paywallEnabled ?? true,
    theme: options?.theme ?? 'dark',
    brandingEnabled: options?.brandingEnabled ?? true,
    iframeUrl: `${APP_URL}/embed/${roomId}?autoplay=${options?.autoplay ?? true}&muted=${options?.muted ?? true}&paywall=${options?.paywallEnabled ?? true}&theme=${options?.theme ?? 'dark'}`,
  };
}

/**
 * Generate embed code snippet for external websites.
 */
export function getEmbedCode(roomId: string, width: string = '640', height: string = '360'): string {
  return `<iframe src="${APP_URL}/embed/${roomId}" width="${width}" height="${height}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
}

// ============================================================
// P2P PAYMENT LINKS (Zero-Fee Direct Payments)
// PayPal, CashApp, Venmo, Zelle, Chime
// ============================================================

/**
 * Add a P2P payment link for a creator.
 */
export function addP2PLink(
  creatorId: string,
  provider: P2PPaymentProvider,
  handle: string,
  displayLabel?: string
): P2PPaymentLink {
  const link: P2PPaymentLink = {
    id: uuidv4(),
    creatorId,
    provider,
    handle,
    displayLabel: displayLabel ?? `${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
    enabled: true,
    createdAt: new Date().toISOString(),
  };

  const links = p2pLinks.get(creatorId) || [];
  links.push(link);
  p2pLinks.set(creatorId, links);
  return link;
}

/**
 * Get all P2P links for a creator.
 */
export function getP2PLinks(creatorId: string): P2PPaymentLink[] {
  return (p2pLinks.get(creatorId) || []).filter(l => l.enabled);
}

/**
 * Remove a P2P link.
 */
export function removeP2PLink(creatorId: string, linkId: string): boolean {
  const links = p2pLinks.get(creatorId);
  if (!links) return false;
  const idx = links.findIndex(l => l.id === linkId);
  if (idx === -1) return false;
  links.splice(idx, 1);
  return true;
}

/**
 * Get the P2P URL for a provider.
 */
export function getP2PPaymentUrl(provider: P2PPaymentProvider, handle: string): string {
  const urls: Record<P2PPaymentProvider, (h: string) => string> = {
    paypal: (h) => `https://paypal.me/${h}`,
    cashapp: (h) => `https://cash.app/${h.startsWith('$') ? h : `$${h}`}`,
    venmo: (h) => `https://venmo.com/${h}`,
    zelle: () => `zelle:${handle}`, // Zelle uses email/phone directly
    chime: (h) => `https://chime.com/pay/${h}`,
  };
  return urls[provider](handle);
}

// ============================================================
// CREATOR SUBSCRIPTION PLANS (Bronze $1, Silver $5, Gold $15)
// ============================================================

/**
 * Create default subscription plans for a creator.
 */
export function createDefaultSubPlans(creatorId: string): CreatorSubscriptionPlan[] {
  const defaults: { tier: CreatorSubscriptionTier; name: string; price: number; features: string[] }[] = [
    {
      tier: 'bronze',
      name: 'Bronze',
      price: 100, // $1
      features: ['Ad-free viewing', 'Bronze badge', 'Chat access'],
    },
    {
      tier: 'silver',
      name: 'Silver',
      price: 500, // $5
      features: ['All Bronze perks', 'Silver badge', 'Exclusive content', 'Priority chat'],
    },
    {
      tier: 'gold',
      name: 'Gold',
      price: 1500, // $15
      features: ['All Silver perks', 'Gold badge', 'Private streams', '1-on-1 sessions', 'Early access'],
    },
  ];

  const plans: CreatorSubscriptionPlan[] = defaults.map(d => ({
    id: uuidv4(),
    creatorId,
    tier: d.tier,
    name: d.name,
    priceMonthly: d.price,
    features: d.features,
    stripePriceId: '',
    subscriberCount: 0,
    enabled: true,
  }));

  creatorSubPlans.set(creatorId, plans);
  return plans;
}

/**
 * Get subscription plans for a creator.
 */
export function getCreatorSubPlans(creatorId: string): CreatorSubscriptionPlan[] {
  return creatorSubPlans.get(creatorId) || [];
}

// ============================================================
// CREATOR MARKETPLACE (Digital/Physical Products)
// ============================================================

/**
 * Add a product to a creator's store.
 */
export function addCreatorProduct(
  creatorId: string,
  params: {
    name: string;
    description: string;
    type: 'digital' | 'physical' | 'service';
    priceInCents: number;
    imageUrl?: string;
    downloadUrl?: string;
    inventory?: number;
  }
): CreatorProduct {
  const product: CreatorProduct = {
    id: uuidv4(),
    creatorId,
    name: params.name,
    description: params.description,
    type: params.type,
    priceInCents: params.priceInCents,
    imageUrl: params.imageUrl,
    downloadUrl: params.downloadUrl,
    inventory: params.inventory,
    stripePriceId: '',
    soldCount: 0,
    enabled: true,
    createdAt: new Date().toISOString(),
  };

  const products = creatorProducts.get(creatorId) || [];
  products.push(product);
  creatorProducts.set(creatorId, products);
  return product;
}

/**
 * Get all products for a creator.
 */
export function getCreatorProducts(creatorId: string): CreatorProduct[] {
  return (creatorProducts.get(creatorId) || []).filter(p => p.enabled);
}

/**
 * Get the complete creator marketplace data.
 */
export function getCreatorMarketplace(creatorId: string, storeName?: string): CreatorMarketplace {
  const products = getCreatorProducts(creatorId);
  const plans = getCreatorSubPlans(creatorId);
  const links = getP2PLinks(creatorId);

  return {
    creatorId,
    storeName: storeName || 'My Store',
    storeDescription: '',
    products,
    subscriptionPlans: plans,
    p2pLinks: links,
    totalRevenue: products.reduce((sum, p) => sum + (p.soldCount * p.priceInCents), 0),
    totalSales: products.reduce((sum, p) => sum + p.soldCount, 0),
  };
}
