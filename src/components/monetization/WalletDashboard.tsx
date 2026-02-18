import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { monetization } from '@/lib/monetization';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { WalletTransaction } from '@/types/database';
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Plus, TrendingUp, TrendingDown,
  ShoppingBag, Heart, CreditCard, Gift, RotateCcw,
} from 'lucide-react';

const transactionIcons: Record<string, React.ReactNode> = {
  deposit: <Plus className="w-4 h-4 text-green-500" />,
  withdrawal: <ArrowUpRight className="w-4 h-4 text-red-500" />,
  tip_sent: <Heart className="w-4 h-4 text-pink-500" />,
  tip_received: <ArrowDownLeft className="w-4 h-4 text-green-500" />,
  purchase: <ShoppingBag className="w-4 h-4 text-blue-500" />,
  subscription: <CreditCard className="w-4 h-4 text-purple-500" />,
  refund: <RotateCcw className="w-4 h-4 text-orange-500" />,
  reward: <Gift className="w-4 h-4 text-yellow-500" />,
};

export const WalletDashboard: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [addAmount, setAddAmount] = useState(10);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (user) monetization.getWalletTransactions(user.id).then(setTransactions).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const handleAddFunds = async () => {
    if (!user || addAmount <= 0) return;
    setAdding(true);
    try {
      await monetization.addFunds(user.id, addAmount);
      await refreshProfile();
      const data = await monetization.getWalletTransactions(user.id);
      setTransactions(data);
      toast({ title: 'Funds Added', description: `${formatCurrency(addAmount)} added to your wallet`, variant: 'success' });
      setAddFundsOpen(false);
    } catch (error: any) {
      toast({ title: 'Failed to add funds', description: error.message, variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  const totalReceived = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Wallet className="w-6 h-6" />Wallet</h2>
        <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />Add Funds</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Funds to Wallet</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[10, 25, 50, 100, 250, 500].map((amt) => (
                  <Button key={amt} variant={addAmount === amt ? 'default' : 'outline'} size="sm" onClick={() => setAddAmount(amt)}>{formatCurrency(amt)}</Button>
                ))}
              </div>
              <Input type="number" min="1" value={addAmount} onChange={(e) => setAddAmount(parseFloat(e.target.value) || 0)} placeholder="Custom amount" />
            </div>
            <DialogFooter><Button onClick={handleAddFunds} disabled={adding}>{adding ? 'Processing...' : `Add ${formatCurrency(addAmount)}`}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Current Balance</p><p className="text-3xl font-bold">{formatCurrency(profile?.wallet_balance || 0)}</p></div><div className="p-3 rounded-full bg-primary/10"><Wallet className="w-6 h-6 text-primary" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Received</p><p className="text-3xl font-bold text-green-500">{formatCurrency(totalReceived)}</p></div><div className="p-3 rounded-full bg-green-500/10"><TrendingUp className="w-6 h-6 text-green-500" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Spent</p><p className="text-3xl font-bold text-red-500">{formatCurrency(totalSpent)}</p></div><div className="p-3 rounded-full bg-red-500/10"><TrendingDown className="w-6 h-6 text-red-500" /></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="flex items-center gap-3 animate-pulse"><div className="w-10 h-10 bg-muted rounded-full" /><div className="flex-1"><div className="h-4 bg-muted rounded w-1/3 mb-1" /><div className="h-3 bg-muted rounded w-1/4" /></div></div>)}</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No transactions yet</p></div>
          ) : (
            <div className="space-y-1">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="p-2 rounded-full bg-muted">{transactionIcons[tx.type] || <CreditCard className="w-4 h-4" />}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(tx.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>{tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}</p>
                    <p className="text-xs text-muted-foreground">Bal: {formatCurrency(tx.balance_after)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
