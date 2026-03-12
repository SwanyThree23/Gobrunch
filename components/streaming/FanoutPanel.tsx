'use client';

/**
 * FanoutPanel - Guest Destinations & Multi-Platform RTMP Fanout
 * Each guest can stream to up to 5 platforms simultaneously
 * 20 guests × 5 platforms = 100 concurrent streams (Reach Multiplier)
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FANOUT_PLATFORMS } from '@/lib/constants';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { GuestFanoutTarget, FanoutPlatform, ReachMultiplierStats } from '@/types';

interface FanoutPanelProps {
  roomId: string;
  userId: string;
  targets: GuestFanoutTarget[];
  reachStats: ReachMultiplierStats;
  onAddTarget: (platform: FanoutPlatform, displayName: string, rtmpUrl: string, streamKey: string) => void;
  onValidate: (targetId: string) => void;
  onStart: (targetId: string) => void;
  onStop: (targetId: string) => void;
  onRemove: (targetId: string) => void;
}

export function FanoutPanel({
  targets,
  reachStats,
  onAddTarget,
  onValidate,
  onStart,
  onStop,
  onRemove,
}: FanoutPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlatform, setNewPlatform] = useState<FanoutPlatform>('youtube');
  const [newName, setNewName] = useState('');
  const [newRtmpUrl, setNewRtmpUrl] = useState('');
  const [newStreamKey, setNewStreamKey] = useState('');

  const handleAdd = () => {
    if (!newRtmpUrl || !newStreamKey) return;
    const platformLabel = FANOUT_PLATFORMS.find(p => p.id === newPlatform)?.label || newPlatform;
    onAddTarget(newPlatform, newName || platformLabel, newRtmpUrl, newStreamKey);
    setNewName('');
    setNewRtmpUrl('');
    setNewStreamKey('');
    setShowAddForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'connected': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'validating': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'error': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-white/40 bg-white/5 border-white/10';
    }
  };

  return (
    <div className="glass-card p-4 space-y-4">
      {/* Header with Reach Multiplier */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            📡 Guest Destinations
            <Badge variant="gold">{targets.length}/5</Badge>
          </h3>
          <p className="text-xs text-white/40 mt-0.5">Stream to multiple platforms simultaneously</p>
        </div>
        {targets.length < 5 && (
          <Button
            variant="gold"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            + Add Platform
          </Button>
        )}
      </div>

      {/* Reach Multiplier Stats */}
      {reachStats.totalConcurrentStreams > 0 && (
        <div className="bg-gradient-to-r from-gold/10 to-burgundy/10 rounded-lg p-3 border border-gold/20">
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-white/50">Concurrent Streams</span>
              <p className="text-lg font-bold text-gold">{reachStats.totalConcurrentStreams}</p>
            </div>
            <div>
              <span className="text-white/50">Platforms</span>
              <p className="text-lg font-bold text-white">{reachStats.totalPlatforms}</p>
            </div>
            <div>
              <span className="text-white/50">Est. Viewers</span>
              <p className="text-lg font-bold text-green-400">{reachStats.estimatedTotalViewers.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Target Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 p-3 bg-white/5 rounded-lg border border-white/10">
              {/* Platform Selector */}
              <div className="flex flex-wrap gap-2">
                {FANOUT_PLATFORMS.map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => setNewPlatform(platform.id as FanoutPlatform)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                      newPlatform === platform.id
                        ? 'bg-white/10 border-gold/50 text-gold'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {platform.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Display name (optional)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input-field text-sm"
              />
              <input
                type="text"
                placeholder="RTMP Server URL"
                value={newRtmpUrl}
                onChange={(e) => setNewRtmpUrl(e.target.value)}
                className="input-field text-sm"
              />
              <input
                type="password"
                placeholder="Stream Key"
                value={newStreamKey}
                onChange={(e) => setNewStreamKey(e.target.value)}
                className="input-field text-sm"
              />

              <div className="flex gap-2">
                <Button variant="gold" size="sm" onClick={handleAdd}>
                  Add Destination
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Targets List */}
      <div className="space-y-2">
        {targets.map(target => (
          <div
            key={target.id}
            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
          >
            {/* Status Badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase border ${getStatusColor(target.status)}`}>
              {target.status === 'live' && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              )}
              {target.status}
            </span>

            {/* Platform Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{target.displayName}</p>
              <p className="text-xs text-white/40 truncate">{target.platform}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-1">
              {target.status === 'idle' && (
                <button
                  onClick={() => onValidate(target.id)}
                  className="px-2 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded transition-colors"
                >
                  Test
                </button>
              )}
              {(target.status === 'connected' || target.status === 'idle') && (
                <button
                  onClick={() => onStart(target.id)}
                  className="px-2 py-1 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors"
                >
                  Go Live
                </button>
              )}
              {target.status === 'live' && (
                <button
                  onClick={() => onStop(target.id)}
                  className="px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                >
                  Stop
                </button>
              )}
              <button
                onClick={() => onRemove(target.id)}
                className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-white/40 rounded transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        {targets.length === 0 && (
          <p className="text-center text-sm text-white/30 py-4">
            No destinations configured. Add a platform to start broadcasting.
          </p>
        )}
      </div>
    </div>
  );
}

export default FanoutPanel;
