'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PRICING_PLANS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      {/* Header */}
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Badge variant="gold" className="mb-4">
          <Sparkles size={12} />
          Simple Pricing
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
          Choose Your <span className="gradient-text">Plan</span>
        </h1>
        <p className="text-white/50 max-w-xl mx-auto">
          Start free, scale as you grow. All plans include core streaming features.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className={cn('text-sm', !annual ? 'text-white' : 'text-white/40')}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={cn(
              'relative w-12 h-6 rounded-full transition-colors',
              annual ? 'bg-gold' : 'bg-white/20'
            )}
          >
            <div
              className={cn(
                'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform',
                annual ? 'translate-x-6' : 'translate-x-0.5'
              )}
            />
          </button>
          <span className={cn('text-sm', annual ? 'text-white' : 'text-white/40')}>
            Annual
            <Badge variant="success" className="ml-2">Save 17%</Badge>
          </span>
        </div>
      </motion.div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PRICING_PLANS.map((plan, i) => {
          const price = annual ? plan.priceYearly : plan.priceMonthly;
          const isPopular = plan.tier === 'pro';

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <Card
                className={cn(
                  'relative h-full flex flex-col',
                  isPopular && 'ring-2 ring-gold/50 bg-gold/5'
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="gold">Most Popular</Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">
                      ${annual ? Math.round(price / 12) : price}
                    </span>
                    <span className="text-white/40">/mo</span>
                  </div>
                  {annual && price > 0 && (
                    <p className="text-xs text-white/30 mt-1">
                      Billed ${price}/year
                    </p>
                  )}
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check size={16} className="text-gold mt-0.5 shrink-0" />
                      <span className="text-sm text-white/60">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.tier === 'free' ? '/auth/register' : '/auth/register'}>
                  <Button
                    variant={isPopular ? 'gold' : 'secondary'}
                    className="w-full"
                  >
                    {plan.tier === 'free' ? 'Get Started' : 'Start Free Trial'}
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
