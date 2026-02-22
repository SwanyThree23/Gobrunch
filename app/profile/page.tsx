'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Globe, Shield, CreditCard, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/lib/hooks/useAuthStore';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || 'Demo User');
  const [bio, setBio] = useState('Streaming enthusiast and tech lover');

  const demoUser = {
    displayName: user?.displayName || 'Demo User',
    username: user?.username || 'demouser',
    email: user?.email || 'demo@seewhy.live',
    subscription: user?.subscription || 'free',
    totalStreams: 24,
    totalViewers: 15800,
    totalWatchParties: 12,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      <div className="grid gap-6">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar name={demoUser.displayName} size="lg" />
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-xl font-bold">{demoUser.displayName}</h2>
                <p className="text-white/40 text-sm">@{demoUser.username}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2 justify-center sm:justify-start">
                  <Badge variant="gold">{demoUser.subscription} plan</Badge>
                  <span className="text-xs text-white/30">{demoUser.totalStreams} streams</span>
                  <span className="text-xs text-white/30">{demoUser.totalViewers.toLocaleString()} viewers</span>
                </div>
              </div>
              <Button variant="secondary" size="sm">
                Change Avatar
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Edit Profile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User size={18} />
                Edit Profile
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                id="displayName"
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/70">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <Input id="email" label="Email" value={demoUser.email} disabled />
              <Button variant="primary" size="sm">
                <Save size={16} />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard size={18} />
                Subscription
              </h3>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <p className="font-semibold">
                    {demoUser.subscription === 'free' ? 'Starter' : 'Professional'} Plan
                  </p>
                  <p className="text-sm text-white/40 mt-0.5">
                    {demoUser.subscription === 'free'
                      ? 'Upgrade to unlock AI, recordings, and more'
                      : 'Your plan renews on Mar 1, 2026'}
                  </p>
                </div>
                <Button variant="gold" size="sm">
                  {demoUser.subscription === 'free' ? 'Upgrade' : 'Manage'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield size={18} />
                Security
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <p className="font-medium text-sm">Password</p>
                  <p className="text-xs text-white/40">Last changed 30 days ago</p>
                </div>
                <Button variant="ghost" size="sm">Change</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <p className="font-medium text-sm">Two-Factor Authentication</p>
                  <p className="text-xs text-white/40">Not enabled</p>
                </div>
                <Button variant="ghost" size="sm">Enable</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
