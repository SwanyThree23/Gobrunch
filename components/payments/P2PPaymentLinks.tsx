'use client';

/**
 * P2PPaymentLinks - Zero-Fee Direct Payment Links
 * PayPal, CashApp, Venmo, Zelle, Chime
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { P2P_PROVIDERS } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import type { P2PPaymentLink, P2PPaymentProvider } from '@/types';

interface P2PPaymentLinksProps {
  links: P2PPaymentLink[];
  isOwner: boolean;
  creatorName: string;
  onAdd: (provider: P2PPaymentProvider, handle: string, label?: string) => void;
  onRemove: (linkId: string) => void;
}

export function P2PPaymentLinks({
  links,
  isOwner,
  creatorName,
  onAdd,
  onRemove,
}: P2PPaymentLinksProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<P2PPaymentProvider>('paypal');
  const [handle, setHandle] = useState('');

  const handleAdd = () => {
    if (!handle.trim()) return;
    onAdd(selectedProvider, handle.trim());
    setHandle('');
    setShowAddForm(false);
  };

  const getPaymentUrl = (provider: P2PPaymentProvider, h: string): string => {
    const urls: Record<P2PPaymentProvider, (h: string) => string> = {
      paypal: (h) => `https://paypal.me/${h}`,
      cashapp: (h) => `https://cash.app/${h.startsWith('$') ? h : `$${h}`}`,
      venmo: (h) => `https://venmo.com/${h}`,
      zelle: (h) => `mailto:${h}?subject=Payment via Zelle`,
      chime: (h) => `https://chime.com/pay/${h}`,
    };
    return urls[provider](h);
  };

  const providerConfig = P2P_PROVIDERS.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {} as Record<string, (typeof P2P_PROVIDERS)[number]>);

  return (
    <div className="space-y-3">
      {/* Viewer Mode: Show clickable P2P links */}
      {!isOwner && links.length > 0 && (
        <div>
          <p className="text-xs text-white/50 mb-2">Tip {creatorName} directly (zero fees):</p>
          <div className="flex flex-wrap gap-2">
            {links.map(link => {
              const cfg = providerConfig[link.provider];
              return (
                <a
                  key={link.id}
                  href={getPaymentUrl(link.provider, link.handle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all hover:scale-105"
                  style={{
                    backgroundColor: `${cfg?.color}15`,
                    borderColor: `${cfg?.color}40`,
                    border: '1px solid',
                  }}
                >
                  <span>{cfg?.icon}</span>
                  <span className="text-sm font-medium text-white">{link.displayLabel}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Owner Mode: Manage P2P links */}
      {isOwner && (
        <>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">Direct Payment Links</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
              + Add
            </Button>
          </div>

          {/* Add Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {P2P_PROVIDERS.map(provider => (
                      <button
                        key={provider.id}
                        onClick={() => setSelectedProvider(provider.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          selectedProvider === provider.id
                            ? 'bg-white/10 border-gold/50 text-gold'
                            : 'bg-white/5 border-white/10 text-white/60'
                        }`}
                      >
                        {provider.icon} {provider.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder={`Your ${P2P_PROVIDERS.find(p => p.id === selectedProvider)?.label} handle/email`}
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="input-field text-sm"
                  />
                  <div className="flex gap-2">
                    <Button variant="gold" size="sm" onClick={handleAdd}>Save</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Existing Links */}
          <div className="space-y-2">
            {links.map(link => {
              const cfg = providerConfig[link.provider];
              return (
                <div key={link.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span>{cfg?.icon}</span>
                    <span className="text-sm text-white">{link.displayLabel}</span>
                    <span className="text-xs text-white/30">{link.handle}</span>
                  </div>
                  <button
                    onClick={() => onRemove(link.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default P2PPaymentLinks;
