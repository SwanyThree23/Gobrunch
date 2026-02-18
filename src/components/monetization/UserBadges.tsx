import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { monetization } from '@/lib/monetization';
import { useAuth } from '@/hooks/useAuth';
import type { UserPurchase } from '@/types/database';
import { Award, Check } from 'lucide-react';

export const UserBadges: React.FC<{ userId?: string }> = ({ userId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) monetization.getUserPurchases(targetUserId).then(setPurchases).catch(console.error).finally(() => setLoading(false));
  }, [targetUserId]);

  const handleToggleEquip = async (purchase: UserPurchase) => {
    try {
      await monetization.toggleEquipGood(purchase.id, !purchase.is_equipped);
      setPurchases(purchases.map((p) => p.id === purchase.id ? { ...p, is_equipped: !p.is_equipped } : p));
      toast({ title: purchase.is_equipped ? 'Unequipped' : 'Equipped' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map((i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>;
  if (purchases.length === 0) return <div className="text-center py-6 text-muted-foreground"><Award className="w-10 h-10 mx-auto mb-2 opacity-50" /><p className="text-sm">No items collected yet</p></div>;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2"><Award className="w-5 h-5" />Collection ({purchases.length})</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {purchases.map((purchase) => (
          <Card key={purchase.id} className={`cursor-pointer transition-all hover:shadow-md ${purchase.is_equipped ? 'ring-2 ring-primary' : ''}`} onClick={() => handleToggleEquip(purchase)}>
            <CardContent className="p-3 text-center relative">
              {purchase.is_equipped && <div className="absolute top-1 right-1"><Check className="w-4 h-4 text-primary" /></div>}
              <div className="w-10 h-10 mx-auto mb-1.5 flex items-center justify-center"><Award className="w-8 h-8 text-primary" /></div>
              <p className="text-xs font-medium truncate">Item #{purchase.good_id.slice(0, 6)}</p>
              {purchase.is_equipped && <Badge variant="default" className="mt-1 text-[10px]">Equipped</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
