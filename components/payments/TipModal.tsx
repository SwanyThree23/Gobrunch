'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, X, Heart, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { stripeApi } from '@/lib/api';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  roomId?: string;
}

const TIP_AMOUNTS = [
  { label: '$1', cents: 100 },
  { label: '$5', cents: 500 },
  { label: '$10', cents: 1000 },
  { label: '$25', cents: 2500 },
  { label: '$50', cents: 5000 },
  { label: '$100', cents: 10000 },
];

export function TipModal({ isOpen, onClose, creatorId, creatorName, roomId }: TipModalProps) {
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const effectiveAmount = customAmount ? Math.round(parseFloat(customAmount) * 100) : selectedAmount;

  async function handleTip() {
    if (effectiveAmount < 100) {
      setError('Minimum tip is $1.00');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await stripeApi.createTip({
        creatorId,
        amount: effectiveAmount,
        message: message || undefined,
        roomId,
      });

      // Redirect to Stripe Checkout
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tip');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50"
          >
            <Card className="!p-0 overflow-hidden">
              {/* Header */}
              <div className="p-6 bg-gradient-to-br from-gold/10 to-burgundy/10 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                      <Heart className="text-gold" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold">Support {creatorName}</h3>
                      <p className="text-xs text-white/40">Send a tip to show your appreciation</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <X size={18} className="text-white/50" />
                  </button>
                </div>
              </div>

              {/* Amount selection */}
              <div className="p-6">
                <p className="text-sm text-white/50 mb-3">Select amount</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {TIP_AMOUNTS.map((tip) => (
                    <button
                      key={tip.cents}
                      onClick={() => {
                        setSelectedAmount(tip.cents);
                        setCustomAmount('');
                      }}
                      className={`py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                        !customAmount && selectedAmount === tip.cents
                          ? 'bg-gold text-dark ring-2 ring-gold/50'
                          : 'bg-white/5 hover:bg-white/10 text-white/70'
                      }`}
                    >
                      {tip.label}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="relative mb-4">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setError('');
                    }}
                    placeholder="Custom amount"
                    min="1"
                    step="0.01"
                    className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold/40"
                  />
                </div>

                {/* Message */}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message (optional)"
                  maxLength={500}
                  rows={2}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold/40 resize-none mb-4"
                />

                {error && (
                  <p className="text-red-400 text-sm mb-4">{error}</p>
                )}

                {/* Send button */}
                <Button
                  variant="gold"
                  className="w-full"
                  onClick={handleTip}
                  disabled={loading || effectiveAmount < 100}
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Send ${(effectiveAmount / 100).toFixed(2)} Tip
                </Button>

                <p className="text-xs text-white/30 text-center mt-3">
                  Powered by Stripe. Secure payment processing.
                </p>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
