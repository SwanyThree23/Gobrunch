'use client';

/**
 * GoldenPaywall - 2-Minute Free Preview with Blurred Golden Overlay
 * Embeddable player paywall with micro-transaction options ($0.99 - $4.99)
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GOLDEN_PAYWALL_PREVIEW_SECONDS, PAYWALL_PRICE_OPTIONS } from '@/lib/constants';
import type { PaywallConfig, PaywallPriceOption } from '@/types';

interface GoldenPaywallProps {
  roomId: string;
  viewerId: string;
  creatorName: string;
  config?: PaywallConfig;
  onPurchase: (option: PaywallPriceOption) => void;
  onPreviewExpired: () => void;
}

export function GoldenPaywall({
  roomId,
  viewerId,
  creatorName,
  config,
  onPurchase,
  onPreviewExpired,
}: GoldenPaywallProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(
    config?.previewDurationSeconds ?? GOLDEN_PAYWALL_PREVIEW_SECONDS
  );
  const [isExpired, setIsExpired] = useState(false);
  const [selectedOption, setSelectedOption] = useState<PaywallPriceOption | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const priceOptions: PaywallPriceOption[] = config?.priceOptions ?? PAYWALL_PRICE_OPTIONS.map((p, i) => ({
    id: `pw_${i}`,
    amount: p.amount,
    label: p.label,
    duration: p.duration,
  }));

  // Countdown timer
  useEffect(() => {
    if (remainingSeconds <= 0) {
      setIsExpired(true);
      onPreviewExpired();
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          setIsExpired(true);
          onPreviewExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds, onPreviewExpired]);

  const handlePurchase = useCallback((option: PaywallPriceOption) => {
    setIsPurchasing(true);
    setSelectedOption(option);
    onPurchase(option);
  }, [onPurchase]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-full">
      {/* Preview Timer (shown during preview) */}
      {!isExpired && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 z-30"
        >
          <div className={`px-3 py-1.5 rounded-full text-sm font-mono font-bold backdrop-blur-sm border ${
            remainingSeconds <= 30
              ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
              : 'bg-black/40 text-gold border-gold/30'
          }`}>
            ⏱ {formatTime(remainingSeconds)}
          </div>
        </motion.div>
      )}

      {/* Golden Paywall Overlay (shown when expired) */}
      <AnimatePresence>
        {isExpired && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center"
            style={{
              backdropFilter: `blur(${config?.blurIntensity ?? 12}px)`,
              background: 'linear-gradient(135deg, rgba(128,0,32,0.4), rgba(212,175,55,0.3), rgba(128,0,32,0.4))',
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="max-w-md w-full mx-4"
            >
              {/* Golden Card */}
              <div className="bg-gradient-to-b from-gray-900/95 to-black/95 rounded-2xl border border-gold/30 shadow-2xl shadow-gold/10 overflow-hidden">
                {/* Gold Header */}
                <div className="bg-gradient-to-r from-gold/20 via-yellow-400/10 to-gold/20 p-6 text-center border-b border-gold/20">
                  <div className="text-4xl mb-2">✨</div>
                  <h2 className="text-xl font-bold gradient-text">
                    {config?.ctaText ?? 'Continue Watching'}
                  </h2>
                  <p className="text-sm text-white/60 mt-1">
                    {config?.ctaSubtext ?? `Support ${creatorName} and unlock the full stream`}
                  </p>
                </div>

                {/* Price Options */}
                <div className="p-6 space-y-3">
                  {priceOptions.map((option) => (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePurchase(option)}
                      disabled={isPurchasing}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                        selectedOption?.id === option.id
                          ? 'bg-gold/20 border-gold/50 ring-2 ring-gold/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-gold/30'
                      } ${isPurchasing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-left">
                        <span className="text-lg font-bold text-gold">{option.label}</span>
                        {option.description && (
                          <p className="text-xs text-white/50 mt-0.5">{option.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-white/40 capitalize">
                          {option.duration?.replace('-', ' ')}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Revenue Split Info */}
                <div className="px-6 pb-4">
                  <p className="text-center text-xs text-white/30">
                    90% goes directly to {creatorName} • Secure payment via Stripe
                  </p>
                </div>

                {/* P2P Alternative */}
                <div className="border-t border-white/10 p-4 text-center">
                  <p className="text-xs text-white/40 mb-2">Or tip directly (zero fees)</p>
                  <div className="flex justify-center gap-3">
                    {['PayPal', 'CashApp', 'Venmo'].map(provider => (
                      <button
                        key={provider}
                        className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
                      >
                        {provider}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GoldenPaywall;
