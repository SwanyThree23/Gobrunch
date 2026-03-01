'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Shield,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/lib/hooks/useAuthStore';
import { stripeApi } from '@/lib/api';

type ConnectStatus = 'not_created' | 'onboarding' | 'active' | 'restricted' | 'disabled';

export default function CreatorOnboardingPage() {
  const searchParams = useSearchParams();
  const { user, token } = useAuthStore();
  const [status, setStatus] = useState<ConnectStatus>('not_created');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [chargesEnabled, setChargesEnabled] = useState(false);
  const [payoutsEnabled, setPayoutsEnabled] = useState(false);
  const [currentlyDue, setCurrentlyDue] = useState<string[]>([]);

  const success = searchParams.get('success');
  const refresh = searchParams.get('refresh');

  const fetchStatus = useCallback(async () => {
    if (!token) return;
    try {
      const data = await stripeApi.getConnectStatus();
      setStatus(data.status as ConnectStatus);
      setChargesEnabled(data.chargesEnabled ?? false);
      setPayoutsEnabled(data.payoutsEnabled ?? false);
      setCurrentlyDue(data.currentlyDue ?? []);
    } catch {
      // Not connected yet
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  async function handleStartOnboarding() {
    setActionLoading(true);
    setError('');
    try {
      const data = await stripeApi.createConnectAccount('create');
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start onboarding');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleContinueOnboarding() {
    setActionLoading(true);
    setError('');
    try {
      const data = await stripeApi.createConnectAccount('refresh');
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to continue onboarding');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleViewDashboard() {
    setActionLoading(true);
    try {
      const data = await stripeApi.createConnectAccount('dashboard');
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open dashboard');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Creator <span className="gradient-text">Payments</span>
          </h1>
          <p className="text-white/50 max-w-lg mx-auto">
            Set up your payment account to receive tips, sell tickets, and earn from your live streams.
          </p>
        </div>

        {/* Success banner */}
        {success && (
          <Card className="mb-6 !bg-green-500/10 border-green-500/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-400" size={20} />
              <p className="text-green-300">
                Onboarding completed! Your account is being reviewed.
              </p>
            </div>
          </Card>
        )}

        {refresh && (
          <Card className="mb-6 !bg-yellow-500/10 border-yellow-500/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-yellow-400" size={20} />
              <p className="text-yellow-300">
                Your onboarding link expired. Please continue below.
              </p>
            </div>
          </Card>
        )}

        {error && (
          <Card className="mb-6 !bg-red-500/10 border-red-500/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-400" size={20} />
              <p className="text-red-300">{error}</p>
            </div>
          </Card>
        )}

        {/* Status Card */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-burgundy/20 flex items-center justify-center">
                <CreditCard className="text-gold" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Payment Account</h2>
                <p className="text-sm text-white/40">{user?.email}</p>
              </div>
            </div>
            <Badge
              variant={
                status === 'active' ? 'success' :
                status === 'onboarding' ? 'warning' :
                status === 'restricted' ? 'warning' :
                'default'
              }
            >
              {status === 'active' ? 'Active' :
               status === 'onboarding' ? 'Onboarding' :
               status === 'restricted' ? 'Action Required' :
               status === 'disabled' ? 'Disabled' :
               'Not Connected'}
            </Badge>
          </div>

          {status === 'active' && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-xs text-white/40 mb-1">Charges</p>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className={chargesEnabled ? 'text-green-400' : 'text-red-400'} />
                  <span className="text-sm font-medium">{chargesEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-xs text-white/40 mb-1">Payouts</p>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className={payoutsEnabled ? 'text-green-400' : 'text-red-400'} />
                  <span className="text-sm font-medium">{payoutsEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>
          )}

          {currentlyDue.length > 0 && (
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-6">
              <p className="text-sm font-medium text-yellow-300 mb-2">Action Required</p>
              <p className="text-xs text-yellow-300/70">
                Please complete the following: {currentlyDue.join(', ')}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {status === 'not_created' && (
              <Button
                variant="gold"
                onClick={handleStartOnboarding}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                Set Up Payments
                <ArrowRight size={16} />
              </Button>
            )}

            {(status === 'onboarding' || status === 'restricted') && (
              <Button
                variant="gold"
                onClick={handleContinueOnboarding}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                Continue Onboarding
                <ArrowRight size={16} />
              </Button>
            )}

            {status === 'active' && (
              <>
                <Button variant="gold" onClick={handleViewDashboard} disabled={actionLoading}>
                  <ExternalLink size={16} />
                  Stripe Dashboard
                </Button>
                <Button variant="secondary" onClick={() => window.location.href = '/creator/earnings'}>
                  <DollarSign size={16} />
                  View Earnings
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: DollarSign,
              title: 'Accept Tips',
              description: 'Viewers can tip you during live streams with one click.',
            },
            {
              icon: CreditCard,
              title: 'Sell Tickets',
              description: 'Monetize premium events with paid access tickets.',
            },
            {
              icon: Shield,
              title: 'Secure Payouts',
              description: 'Daily payouts direct to your bank with Stripe security.',
            },
          ].map((benefit) => (
            <Card key={benefit.title}>
              <benefit.icon className="text-gold mb-3" size={24} />
              <h3 className="font-semibold text-sm mb-1">{benefit.title}</h3>
              <p className="text-xs text-white/40">{benefit.description}</p>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
