'use client';

/**
 * Creator Store Page - Manage subscriptions, products, and P2P payment links
 */
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/hooks/useAuthStore';
import { CreatorStore } from '@/components/payments/CreatorStore';
import { P2PPaymentLinks } from '@/components/payments/P2PPaymentLinks';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import type { CreatorMarketplace, P2PPaymentLink, P2PPaymentProvider, CreatorProduct } from '@/types';

export default function CreatorStorePage() {
  const { user } = useAuthStore();
  const [marketplace, setMarketplace] = useState<CreatorMarketplace | null>(null);
  const [p2pLinks, setP2PLinks] = useState<P2PPaymentLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [mpRes, linksRes] = await Promise.all([
        fetch(`/api/marketplace/${user.id}`),
        fetch(`/api/marketplace/${user.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-p2p-links' }),
        }),
      ]);

      if (mpRes.ok) {
        const mpData = await mpRes.json();
        setMarketplace(mpData.data);
      }

      if (linksRes.ok) {
        const linksData = await linksRes.json();
        setP2PLinks(linksData.data || []);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const initSubPlans = async () => {
    if (!user) return;
    await fetch(`/api/marketplace/${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'init-sub-plans' }),
    });
    fetchData();
  };

  const addP2PLink = async (provider: P2PPaymentProvider, handle: string) => {
    if (!user) return;
    await fetch(`/api/marketplace/${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add-p2p-link', provider, handle }),
    });
    fetchData();
  };

  const removeP2PLink = async (linkId: string) => {
    if (!user) return;
    await fetch(`/api/marketplace/${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove-p2p-link', linkId }),
    });
    fetchData();
  };

  const addProduct = async (product: Omit<CreatorProduct, 'id' | 'creatorId' | 'stripePriceId' | 'soldCount' | 'enabled' | 'createdAt'>) => {
    if (!user) return;
    await fetch(`/api/marketplace/${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add-product', ...product }),
    });
    fetchData();
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">Creator Store</h1>
          <p className="text-white/50 mt-2">Manage subscriptions, products, and payment links</p>
          <p className="text-sm text-gold mt-1">90% of all revenue goes directly to you</p>
        </div>

        {/* P2P Payment Links Section */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">💰 Direct Payment Links (Zero Fees)</h2>
          <P2PPaymentLinks
            links={p2pLinks}
            isOwner={true}
            creatorName={user?.displayName || 'Creator'}
            onAdd={addP2PLink}
            onRemove={removeP2PLink}
          />
        </div>

        {/* Store */}
        {marketplace ? (
          <CreatorStore
            marketplace={marketplace}
            isOwner={true}
            onSubscribe={() => {}}
            onPurchaseProduct={() => {}}
            onAddProduct={addProduct}
          />
        ) : (
          <div className="glass-card p-8 text-center">
            <p className="text-white/50 mb-4">Set up your store to start selling</p>
            <Button variant="gold" onClick={initSubPlans}>
              Initialize Store
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
