'use client';

/**
 * Embeddable Player Page - iframe-ready player with Golden Paywall
 * /embed/:roomId - Can be embedded on any external website
 */
import { useState, useCallback, use } from 'react';
import { GoldenPaywall } from '@/components/streaming/GoldenPaywall';
import type { PaywallPriceOption } from '@/types';

export default function EmbedPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const [isPaid, setIsPaid] = useState(false);

  const handlePurchase = useCallback(async (option: PaywallPriceOption) => {
    try {
      const res = await fetch(`/api/paywall/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record-payment',
          viewerId: 'anonymous',
          amountInCents: option.amount,
          method: 'stripe',
        }),
      });
      if (res.ok) setIsPaid(true);
    } catch {
      // Handle error
    }
  }, [roomId]);

  const handlePreviewExpired = useCallback(() => {
    // Preview expired - paywall overlay is now visible
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Video Player */}
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <div className="text-6xl mb-4">📺</div>
          <h1 className="text-xl font-bold text-white">SeeWhy LIVE</h1>
          <p className="text-sm text-white/40 mt-1">Room: {roomId}</p>
        </div>
      </div>

      {/* Golden Paywall Overlay */}
      {!isPaid && (
        <GoldenPaywall
          roomId={roomId}
          viewerId="anonymous"
          creatorName="Creator"
          onPurchase={handlePurchase}
          onPreviewExpired={handlePreviewExpired}
        />
      )}

      {/* Branding */}
      <div className="absolute bottom-2 left-2 text-xs text-white/20">
        Powered by SeeWhy LIVE
      </div>
    </div>
  );
}
