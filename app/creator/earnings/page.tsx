'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  ExternalLink,
  Loader2,
  Wallet,
  PiggyBank,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/lib/hooks/useAuthStore';
import { stripeApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  fee: number;
  net: number;
  currency: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function CreatorEarningsPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [lastPayoutDate, setLastPayoutDate] = useState<string | undefined>();
  const [lastPayoutAmount, setLastPayoutAmount] = useState<number | undefined>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState('');

  const fetchEarnings = useCallback(async () => {
    if (!token) return;
    try {
      const data = await stripeApi.getCreatorEarnings();
      setTotalEarnings(data.totalEarnings);
      setAvailableBalance(data.availableBalance);
      setPendingBalance(data.pendingBalance);
      setLastPayoutDate(data.lastPayoutDate);
      setLastPayoutAmount(data.lastPayoutAmount);
      setTransactions(data.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  async function handleOpenDashboard() {
    try {
      const data = await stripeApi.createConnectAccount('dashboard');
      if (data.url) window.open(data.url, '_blank');
    } catch {
      // silently fail
    }
  }

  function formatCurrency(amountCents: number): string {
    return `$${(amountCents / 100).toFixed(2)}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Creator Earnings</h1>
            <p className="text-white/40 mt-1">Track your revenue and payouts</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleOpenDashboard}>
            <ExternalLink size={16} />
            Stripe Dashboard
          </Button>
        </div>

        {error && (
          <Card className="mb-6 !bg-red-500/10 border-red-500/20">
            <p className="text-red-300 text-sm">{error}</p>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/40">Total Earnings</p>
                  <p className="text-2xl font-bold mt-1 text-gold">
                    {formatCurrency(totalEarnings)}
                  </p>
                </div>
                <TrendingUp size={24} className="text-gold" />
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/40">Available Balance</p>
                  <p className="text-2xl font-bold mt-1 text-green-400">
                    {formatCurrency(availableBalance)}
                  </p>
                </div>
                <Wallet size={24} className="text-green-400" />
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/40">Pending</p>
                  <p className="text-2xl font-bold mt-1 text-yellow-400">
                    {formatCurrency(pendingBalance)}
                  </p>
                </div>
                <PiggyBank size={24} className="text-yellow-400" />
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/40">Last Payout</p>
                  <p className="text-2xl font-bold mt-1">
                    {lastPayoutAmount ? formatCurrency(lastPayoutAmount) : '--'}
                  </p>
                  {lastPayoutDate && (
                    <p className="text-xs text-white/30 mt-1">{formatRelativeTime(lastPayoutDate)}</p>
                  )}
                </div>
                <CreditCard size={24} className="text-blue-400" />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Transactions */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Recent Transactions</h2>
            <Badge variant="default">{transactions.length} transactions</Badge>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <DollarSign size={32} className="mx-auto mb-3 text-white/20" />
              <p>No transactions yet</p>
              <p className="text-sm mt-1">Your earnings will appear here once you start receiving payments.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'payout' ? 'bg-blue-500/20' :
                      tx.type === 'tip' ? 'bg-gold/20' :
                      tx.type === 'ticket' ? 'bg-purple-500/20' :
                      'bg-green-500/20'
                    }`}>
                      {tx.type === 'payout' ? (
                        <ArrowUpRight size={18} className="text-blue-400" />
                      ) : (
                        <ArrowDownRight size={18} className={
                          tx.type === 'tip' ? 'text-gold' :
                          tx.type === 'ticket' ? 'text-purple-400' :
                          'text-green-400'
                        } />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={
                          tx.type === 'tip' ? 'gold' :
                          tx.type === 'ticket' ? 'default' :
                          tx.type === 'payout' ? 'default' :
                          'success'
                        }>
                          {tx.type}
                        </Badge>
                        <span className="text-xs text-white/30 flex items-center gap-1">
                          <Clock size={10} />
                          {formatRelativeTime(tx.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-bold ${tx.type === 'payout' ? 'text-blue-400' : 'text-green-400'}`}>
                      {tx.type === 'payout' ? '-' : '+'}{formatCurrency(tx.net)}
                    </p>
                    {tx.fee > 0 && (
                      <p className="text-xs text-white/30">Fee: {formatCurrency(tx.fee)}</p>
                    )}
                    <Badge variant={
                      tx.status === 'completed' ? 'success' :
                      tx.status === 'pending' ? 'warning' :
                      'default'
                    } className="mt-1">
                      {tx.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
