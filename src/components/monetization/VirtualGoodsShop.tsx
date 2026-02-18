import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { monetization } from '@/lib/monetization';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getRarityColor, getRarityBgColor } from '@/lib/utils';
import type { VirtualGood } from '@/types/database';
import { ShoppingBag, Sparkles, Award, Palette, Frame, Type } from 'lucide-react';

const CATEGORIES = [
  { value: 'badge', label: 'Badges', icon: Award },
  { value: 'emoji', label: 'Emojis', icon: Sparkles },
  { value: 'effect', label: 'Effects', icon: Palette },
  { value: 'frame', label: 'Frames', icon: Frame },
  { value: 'title', label: 'Titles', icon: Type },
];

export const VirtualGoodsShop: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [goods, setGoods] = useState<VirtualGood[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('badge');

  useEffect(() => {
    setLoading(true);
    monetization.getVirtualGoods(activeCategory).then(setGoods).catch(console.error).finally(() => setLoading(false));
  }, [activeCategory]);

  const handlePurchase = async (good: VirtualGood) => {
    if (!user) return;
    if ((profile?.wallet_balance || 0) < good.price) {
      toast({ title: 'Insufficient Balance', description: 'Please add funds to your wallet.', variant: 'destructive' });
      return;
    }
    setPurchasing(good.id);
    try {
      await monetization.purchaseVirtualGood(user.id, good.id);
      toast({ title: 'Purchase Successful!', description: `You now own "${good.name}"`, variant: 'success' });
      const updated = await monetization.getVirtualGoods(activeCategory);
      setGoods(updated);
    } catch (error: any) {
      toast({ title: 'Purchase failed', description: error.message, variant: 'destructive' });
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><ShoppingBag className="w-6 h-6" />Shop</h2>
          <p className="text-muted-foreground mt-1">Collect unique items and show off your style</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Your Balance</p>
          <p className="text-xl font-bold">{formatCurrency(profile?.wallet_balance || 0)}</p>
        </div>
      </div>
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full justify-start">
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value} className="gap-2"><cat.icon className="w-4 h-4" />{cat.label}</TabsTrigger>
          ))}
        </TabsList>
        {CATEGORIES.map((cat) => (
          <TabsContent key={cat.value} value={cat.value}>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4].map((i) => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-20 bg-muted rounded mb-3" /><div className="h-4 bg-muted rounded w-3/4" /></CardContent></Card>)}
              </div>
            ) : goods.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><cat.icon className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No {cat.label.toLowerCase()} available yet</p></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {goods.map((good) => (
                  <Card key={good.id} className={`overflow-hidden hover:shadow-md transition-shadow ${getRarityBgColor(good.rarity)}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <img src={good.icon_url} alt={good.name} className="w-16 h-16 object-contain" />
                        <Badge variant="outline" className={getRarityColor(good.rarity)}>{good.rarity}</Badge>
                      </div>
                      <h3 className="font-semibold text-sm">{good.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{good.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-sm">{formatCurrency(good.price)}</span>
                        {good.is_limited && good.stock !== null && <span className="text-xs text-orange-500">{good.stock} left</span>}
                      </div>
                      <Button className="w-full mt-3" size="sm" onClick={() => handlePurchase(good)} disabled={purchasing === good.id}>
                        {purchasing === good.id ? 'Buying...' : 'Buy Now'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
