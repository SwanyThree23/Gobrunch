'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/lib/hooks/useAuthStore';
import { formatViewerCount, formatRelativeTime } from '@/lib/utils';
import type { Room, WatchParty } from '@/types';

export default function DashboardPage() {
  const { user, token, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'rooms' | 'watchparties'>('rooms');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [watchParties, setWatchParties] = useState<WatchParty[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [roomsRes, wpRes] = await Promise.all([
        fetch('/api/rooms?hostId=' + (user?.id || ''), { headers }),
        fetch('/api/watchparty', { headers }),
      ]);
      const roomsData = await roomsRes.json();
      const wpData = await wpRes.json();
      if (roomsData.success) setRooms(roomsData.data || []);
      if (wpData.success) setWatchParties(wpData.data || []);
    } catch {
      // silently fail — empty dashboard
    } finally {
      setLoading(false);
    }
  }, [token, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeRooms = rooms.filter((r) => r.status === 'live').length;
  const totalViewers = rooms.reduce((sum, r) => sum + r.currentViewers, 0);

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
          { label: 'Active Rooms', value: activeRooms, icon: Radio, color: 'text-green-400' },
          { label: 'Total Viewers', value: formatViewerCount(totalViewers), icon: Eye, color: 'text-blue-400' },
          { label: 'Watch Parties', value: watchParties.length, icon: Users, color: 'text-purple-400' },
          { label: 'Total Rooms', value: rooms.length, icon: TrendingUp, color: 'text-gold' },
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
      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : activeTab === 'rooms' ? (
        <div className="grid gap-4">
          {rooms.length === 0 ? (
            <Card>
              <div className="text-center py-8 text-white/40">
                <Tv size={32} className="mx-auto mb-3 text-white/20" />
                <p>No rooms yet. Create your first stream!</p>
              </div>
            </Card>
          ) : (
            rooms.map((room) => (
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
            ))
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {watchParties.length === 0 ? (
            <Card>
              <div className="text-center py-8 text-white/40">
                <PartyPopper size={32} className="mx-auto mb-3 text-white/20" />
                <p>No watch parties yet. Start one!</p>
              </div>
            </Card>
          ) : (
            watchParties.map((party) => (
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
                              {party.participants.length}/{party.maxParticipants} participants
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
            ))
          )}
        </div>
      )}
    </div>
  );
}
