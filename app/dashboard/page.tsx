'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus,
  Tv,
  Users,
  Eye,
  TrendingUp,
  Radio,
  PartyPopper,
  BarChart3,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/lib/hooks/useAuthStore';
import { formatViewerCount, formatRelativeTime } from '@/lib/utils';

// Demo data for the dashboard
const demoStats = {
  totalRooms: 5,
  activeRooms: 2,
  totalViewers: 1234,
  totalWatchParties: 3,
  revenueThisMonth: 2890,
  viewerGrowth: 15.3,
};

const demoRooms = [
  {
    id: '1',
    title: 'Tech Talk: Building Real-time Apps',
    status: 'live' as const,
    currentViewers: 847,
    tags: ['tech', 'webdev'],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    title: 'Music Production Workshop',
    status: 'live' as const,
    currentViewers: 234,
    tags: ['music', 'workshop'],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3',
    title: 'Game Night: Community Play',
    status: 'scheduled' as const,
    currentViewers: 0,
    tags: ['gaming', 'community'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const demoWatchParties = [
  {
    id: '1',
    title: 'Movie Night: Sci-Fi Marathon',
    participants: 8,
    maxParticipants: 10,
    status: 'playing' as const,
  },
  {
    id: '2',
    title: 'Tutorial Watch: React 19 Features',
    participants: 4,
    maxParticipants: 15,
    status: 'waiting' as const,
  },
];

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'rooms' | 'watchparties'>('rooms');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {isAuthenticated ? `Welcome, ${user?.displayName}` : 'Dashboard'}
          </h1>
          <p className="text-white/40 mt-1">Manage your streams and watch parties</p>
        </div>
        <div className="flex gap-3">
          <Link href="/watchparty/new">
            <Button variant="secondary" size="sm">
              <PartyPopper size={16} />
              New Watch Party
            </Button>
          </Link>
          <Link href="/room/new">
            <Button variant="primary" size="sm">
              <Plus size={16} />
              Go Live
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Rooms', value: demoStats.activeRooms, icon: Radio, color: 'text-green-400' },
          { label: 'Total Viewers', value: formatViewerCount(demoStats.totalViewers), icon: Eye, color: 'text-blue-400' },
          { label: 'Watch Parties', value: demoStats.totalWatchParties, icon: Users, color: 'text-purple-400' },
          { label: 'Growth', value: `+${demoStats.viewerGrowth}%`, icon: TrendingUp, color: 'text-gold' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/40">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon size={24} className={stat.color} />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit">
        {(['rooms', 'watchparties'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-burgundy text-white'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab === 'rooms' ? 'My Rooms' : 'Watch Parties'}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'rooms' ? (
        <div className="grid gap-4">
          {demoRooms.map((room) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Link href={`/room/${room.id}`}>
                <Card hover>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-burgundy/50 to-dark-400 flex items-center justify-center">
                        <Tv size={20} className="text-gold" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{room.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          {room.status === 'live' ? (
                            <Badge variant="live">LIVE</Badge>
                          ) : (
                            <Badge variant="default">{room.status}</Badge>
                          )}
                          <span className="text-xs text-white/40 flex items-center gap-1">
                            <Clock size={12} />
                            {formatRelativeTime(room.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {room.status === 'live' && (
                        <div className="flex items-center gap-1.5 text-sm text-white/60">
                          <Eye size={14} />
                          {formatViewerCount(room.currentViewers)}
                        </div>
                      )}
                      <div className="flex gap-1.5 mt-2">
                        {room.tags.map((tag) => (
                          <Badge key={tag} variant="default">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {demoWatchParties.map((party) => (
            <motion.div
              key={party.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Link href={`/watchparty/${party.id}`}>
                <Card hover>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-dark-400 flex items-center justify-center">
                        <PartyPopper size={20} className="text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{party.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge
                            variant={party.status === 'playing' ? 'success' : 'warning'}
                          >
                            {party.status}
                          </Badge>
                          <span className="text-xs text-white/40">
                            {party.participants}/{party.maxParticipants} participants
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Join
                    </Button>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
