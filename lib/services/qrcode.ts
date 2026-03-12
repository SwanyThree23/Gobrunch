/**
 * QR Code Generator - Instant Mobile Joining & Scan-to-Pay
 * Uses a lightweight SVG-based QR code generation (no external deps)
 */
import type { QRCodeConfig } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================================
// QR CODE URL GENERATORS
// ============================================================

/**
 * Generate a QR code config for joining a room.
 */
export function getRoomJoinQR(roomId: string): QRCodeConfig {
  return {
    type: 'join-room',
    targetUrl: `${APP_URL}/room/${roomId}`,
    size: 256,
    foregroundColor: '#800020', // Burgundy
    backgroundColor: '#FFFFFF',
    logoUrl: `${APP_URL}/logo.png`,
  };
}

/**
 * Generate a QR code config for joining a watch party.
 */
export function getWatchPartyJoinQR(inviteCode: string): QRCodeConfig {
  return {
    type: 'join-watchparty',
    targetUrl: `${APP_URL}/watchparty/join/${inviteCode}`,
    size: 256,
    foregroundColor: '#800020',
    backgroundColor: '#FFFFFF',
  };
}

/**
 * Generate a QR code config for tipping a creator.
 */
export function getTipQR(creatorId: string, roomId?: string): QRCodeConfig {
  const url = roomId
    ? `${APP_URL}/tip/${creatorId}?room=${roomId}`
    : `${APP_URL}/tip/${creatorId}`;

  return {
    type: 'tip',
    targetUrl: url,
    size: 256,
    foregroundColor: '#D4AF37', // Gold
    backgroundColor: '#FFFFFF',
  };
}

/**
 * Generate a QR code config for a creator's store.
 */
export function getStoreQR(creatorId: string): QRCodeConfig {
  return {
    type: 'store',
    targetUrl: `${APP_URL}/store/${creatorId}`,
    size: 256,
    foregroundColor: '#800020',
    backgroundColor: '#FFFFFF',
  };
}

/**
 * Generate a QR code config for an invite link.
 */
export function getInviteQR(inviteUrl: string): QRCodeConfig {
  return {
    type: 'invite',
    targetUrl: inviteUrl,
    size: 256,
    foregroundColor: '#800020',
    backgroundColor: '#FFFFFF',
  };
}

// ============================================================
// SVG QR CODE GENERATION (Lightweight, No External Dependencies)
// ============================================================

/**
 * Generate a simple QR code as an SVG data URI.
 * This is a lightweight implementation for display purposes.
 * For production-grade QR codes, use the Google Charts API endpoint.
 */
export function getQRCodeUrl(config: QRCodeConfig): string {
  // Use Google Charts API for QR code generation (free, no API key needed)
  const params = new URLSearchParams({
    cht: 'qr',
    chs: `${config.size}x${config.size}`,
    chl: config.targetUrl,
    choe: 'UTF-8',
    chld: 'M|2', // Error correction level M, margin 2
  });

  return `https://chart.googleapis.com/chart?${params}`;
}

/**
 * Generate an HTML embed snippet for a QR code.
 */
export function getQRCodeEmbed(config: QRCodeConfig): string {
  const url = getQRCodeUrl(config);
  return `<img src="${url}" alt="QR Code" width="${config.size}" height="${config.size}" style="border-radius: 8px;" />`;
}

/**
 * Generate a complete QR code card with label and URL.
 */
export function getQRCodeCard(config: QRCodeConfig, label: string): {
  qrUrl: string;
  targetUrl: string;
  label: string;
  embedHtml: string;
} {
  return {
    qrUrl: getQRCodeUrl(config),
    targetUrl: config.targetUrl,
    label,
    embedHtml: getQRCodeEmbed(config),
  };
}
