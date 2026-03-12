'use client';

/**
 * CreatorStore - 3-Tier Subscriptions (Bronze/Silver/Gold) + Product Marketplace
 * Integrated with Stripe Connect for 90/10 revenue split
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CREATOR_SUB_TIERS } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { CreatorSubscriptionPlan, CreatorProduct, CreatorMarketplace } from '@/types';

interface CreatorStoreProps {
  marketplace: CreatorMarketplace;
  isOwner: boolean;
  onSubscribe: (planId: string) => void;
  onPurchaseProduct: (productId: string) => void;
  onAddProduct: (product: Omit<CreatorProduct, 'id' | 'creatorId' | 'stripePriceId' | 'soldCount' | 'enabled' | 'createdAt'>) => void;
}

export function CreatorStore({
  marketplace,
  isOwner,
  onSubscribe,
  onPurchaseProduct,
  onAddProduct,
}: CreatorStoreProps) {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'products'>('subscriptions');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<{
    name: string;
    description: string;
    type: 'digital' | 'physical' | 'service';
    priceInCents: number;
  }>({
    name: '',
    description: '',
    type: 'digital',
    priceInCents: 499,
  });

  return (
    <div className="space-y-6">
      {/* Store Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold gradient-text">{marketplace.storeName}</h2>
        {marketplace.storeDescription && (
          <p className="text-white/60 mt-1">{marketplace.storeDescription}</p>
        )}
        {isOwner && (
          <div className="flex justify-center gap-4 mt-2 text-sm text-white/40">
            <span>Revenue: ${(marketplace.totalRevenue / 100).toFixed(2)}</span>
            <span>Sales: {marketplace.totalSales}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'subscriptions'
              ? 'bg-gold/20 text-gold border border-gold/30'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Subscriptions
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'products'
              ? 'bg-gold/20 text-gold border border-gold/30'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Products
        </button>
      </div>

      {/* Subscription Plans */}
      {activeTab === 'subscriptions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marketplace.subscriptionPlans.map((plan) => {
            const tierConfig = CREATOR_SUB_TIERS[plan.tier as keyof typeof CREATOR_SUB_TIERS];
            return (
              <motion.div
                key={plan.id}
                whileHover={{ y: -4 }}
                className="glass-card p-6 text-center border transition-colors"
                style={{ borderColor: `${tierConfig?.color}40` }}
              >
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${tierConfig?.color}20` }}
                >
                  {plan.tier === 'bronze' ? '🥉' : plan.tier === 'silver' ? '🥈' : '🥇'}
                </div>
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-2xl font-bold mt-2" style={{ color: tierConfig?.color }}>
                  ${(plan.priceMonthly / 100).toFixed(2)}
                  <span className="text-sm text-white/40">/mo</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-white/60 text-left">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span style={{ color: tierConfig?.color }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                {!isOwner && (
                  <Button
                    variant="gold"
                    className="w-full mt-4"
                    onClick={() => onSubscribe(plan.id)}
                  >
                    Subscribe
                  </Button>
                )}
                {isOwner && (
                  <p className="text-xs text-white/30 mt-4">
                    {plan.subscriberCount} subscribers
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Products */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {isOwner && (
            <div className="flex justify-end">
              <Button variant="gold" size="sm" onClick={() => setShowAddProduct(!showAddProduct)}>
                + Add Product
              </Button>
            </div>
          )}

          {showAddProduct && isOwner && (
            <div className="glass-card p-4 space-y-3">
              <input
                type="text"
                placeholder="Product name"
                value={newProduct.name}
                onChange={(e) => setNewProduct(p => ({ ...p, name: e.target.value }))}
                className="input-field text-sm"
              />
              <textarea
                placeholder="Description"
                value={newProduct.description}
                onChange={(e) => setNewProduct(p => ({ ...p, description: e.target.value }))}
                className="input-field text-sm min-h-[60px]"
              />
              <div className="flex gap-2">
                <select
                  value={newProduct.type}
                  onChange={(e) => setNewProduct(p => ({ ...p, type: e.target.value as 'digital' | 'physical' | 'service' }))}
                  className="input-field text-sm flex-1"
                >
                  <option value="digital">Digital</option>
                  <option value="physical">Physical</option>
                  <option value="service">Service</option>
                </select>
                <input
                  type="number"
                  placeholder="Price (cents)"
                  value={newProduct.priceInCents}
                  onChange={(e) => setNewProduct(p => ({ ...p, priceInCents: parseInt(e.target.value) || 0 }))}
                  className="input-field text-sm w-32"
                />
              </div>
              <Button variant="gold" size="sm" onClick={() => {
                onAddProduct(newProduct);
                setNewProduct({ name: '', description: '', type: 'digital', priceInCents: 499 });
                setShowAddProduct(false);
              }}>
                Add Product
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketplace.products.map(product => (
              <motion.div
                key={product.id}
                whileHover={{ y: -2 }}
                className="glass-card overflow-hidden"
              >
                {product.imageUrl && (
                  <div className="h-40 bg-gradient-to-br from-burgundy/20 to-purple-900/20" />
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white">{product.name}</h4>
                    <Badge variant={product.type === 'digital' ? 'default' : product.type === 'physical' ? 'warning' : 'gold'}>
                      {product.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-white/50 mt-1">{product.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-gold">
                      ${(product.priceInCents / 100).toFixed(2)}
                    </span>
                    {!isOwner && (
                      <Button variant="gold" size="sm" onClick={() => onPurchaseProduct(product.id)}>
                        Buy Now
                      </Button>
                    )}
                    {isOwner && (
                      <span className="text-xs text-white/30">{product.soldCount} sold</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {marketplace.products.length === 0 && (
            <p className="text-center text-white/30 py-8">No products yet</p>
          )}
        </div>
      )}
    </div>
  );
}

export default CreatorStore;
