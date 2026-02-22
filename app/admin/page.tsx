'use client';

import { motion } from 'framer-motion';
import {
  Users,
  Tv,
  Activity,
  DollarSign,
  TrendingUp,
  Shield,
  BarChart3,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatViewerCount } from '@/lib/utils';

const adminStats = [
  { label: 'Total Users', value: '2,847', icon: Users, change: '+12%', color: 'text-blue-400' },
  { label: 'Active Streams', value: '34', icon: Tv, change: '+5%', color: 'text-green-400' },
  { label: 'Revenue (MTD)', value: '$12,450', icon: DollarSign, change: '+18%', color: 'text-gold' },
  { label: 'System Health', value: '99.9%', icon: Activity, change: 'Stable', color: 'text-emerald-400' },
];

const recentActivity = [
  { type: 'user', message: 'New user registered: alice@example.com', time: '2 min ago' },
  { type: 'stream', message: 'Room "Tech Talk" went live', time: '5 min ago' },
  { type: 'payment', message: 'Pro subscription: bob@example.com', time: '12 min ago' },
  { type: 'watchparty', message: 'Watch party created with 8 participants', time: '20 min ago' },
  { type: 'system', message: 'Automated backup completed', time: '1 hour ago' },
];

export default function AdminPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield size={28} className="text-gold" />
            Admin Dashboard
          </h1>
          <p className="text-white/40 mt-1">Platform overview and management</p>
        </div>
        <Badge variant="gold">Admin Access</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {adminStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/40">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <TrendingUp size={10} />
                    {stat.change}
                  </p>
                </div>
                <stat.icon size={22} className={stat.color} />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity size={18} />
              Recent Activity
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((item, i) => (
              <div
                key={i}
                className="flex items-start justify-between p-3 bg-white/5 rounded-xl"
              >
                <p className="text-sm text-white/70">{item.message}</p>
                <span className="text-xs text-white/30 whitespace-nowrap ml-4">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 size={18} />
              Platform Analytics
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Server Load', value: 42, color: 'bg-green-500' },
                { label: 'Bandwidth Usage', value: 68, color: 'bg-blue-500' },
                { label: 'Storage Used', value: 35, color: 'bg-purple-500' },
                { label: 'API Rate Limit', value: 12, color: 'bg-gold' },
              ].map((metric) => (
                <div key={metric.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/60">{metric.label}</span>
                    <span className="text-white/40">{metric.value}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${metric.color}`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
