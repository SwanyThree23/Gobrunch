import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { monetization } from '@/lib/monetization';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import type { SubscriptionTier } from '@/types/database';
import { Check, Crown, Star, Zap } from 'lucide-react';

interface SubscriptionTiersProps {
  communityId: string;
  communityName: string;
}

const tierIcons: Record<number, React.ReactNode> = {
  0: <Star className="w-6 h-6" />,
  1: <Zap className="w-6 h-6" />,
  2: <Crown className="w-6 h-6" />,
};

export const SubscriptionTiers: React.FC<SubscriptionTiersProps> = ({ communityId, communityName }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    monetization.getSubscriptionTiers(communityId).then(setTiers).catch(console.error).finally(() => setLoading(false));
  }, [communityId]);

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (!user) return;
    setSubscribing(tier.id);
    try {
      await monetization.subscribe({ userId: user.id, tierId: tier.id, communityId, billingCycle });
      toast({ title: 'Subscribed!', description: `Now subscribed to ${tier.name} for ${communityName}`, variant: 'success' });
    } catch (error: any) {
      toast({ title: 'Subscription failed', description: error.message, variant: 'destructive' });
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse"><CardHeader><div className="h-6 bg-muted rounded w-1/2" /></CardHeader><CardContent><div className="space-y-2">{[1,2,3].map((j) => <div key={j} className="h-4 bg-muted rounded" />)}</div></CardContent></Card>
        ))}
      </div>
    );
  }

  if (tiers.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Subscription Plans</h2>
        <p className="text-muted-foreground mt-1">Choose a plan to unlock exclusive content</p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <button onClick={() => setBillingCycle('monthly')} className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-primary' : 'text-muted-foreground'}`}>Monthly</button>
          <button onClick={() => setBillingCycle('yearly')} className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-primary' : 'text-muted-foreground'}`}>
            Yearly <Badge variant="success" className="ml-2">Save 20%</Badge>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier, index) => (
          <Card key={tier.id} className={`relative ${index === 1 ? 'border-primary shadow-lg scale-105' : ''}`}>
            {index === 1 && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge>Most Popular</Badge></div>}
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 p-3 rounded-full bg-primary/10 text-primary w-fit">{tierIcons[index] || <Star className="w-6 h-6" />}</div>
              <CardTitle>{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">{formatCurrency(billingCycle === 'monthly' ? tier.price_monthly : tier.price_yearly)}</span>
                <span className="text-muted-foreground">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500 shrink-0" />{feature}</li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant={index === 1 ? 'default' : 'outline'} onClick={() => handleSubscribe(tier)} disabled={subscribing === tier.id}>
                {subscribing === tier.id ? 'Processing...' : 'Subscribe'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
