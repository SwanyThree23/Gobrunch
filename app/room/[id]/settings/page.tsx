'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Radio,
  Plus,
  Trash2,
  Settings,
  ExternalLink,
  Loader2,
  Monitor,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/lib/hooks/useAuthStore';
import type { ExternalPlatform, MultistreamTarget } from '@/types';

const PLATFORMS: { id: ExternalPlatform; name: string; color: string }[] = [
  { id: 'prism', name: 'PRISM Live Studio', color: 'text-purple-400' },
  { id: 'obs', name: 'OBS Studio', color: 'text-blue-400' },
  { id: 'streamlabs', name: 'Streamlabs', color: 'text-green-400' },
  { id: 'vmix', name: 'vMix', color: 'text-yellow-400' },
  { id: 'xsplit', name: 'XSplit', color: 'text-red-400' },
  { id: 'restream', name: 'Restream', color: 'text-cyan-400' },
  { id: 'custom', name: 'Custom RTMP', color: 'text-white/60' },
];

export default function StreamSettingsPage({ params }: { params: { id: string } }) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<ExternalPlatform>('prism');
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');

  // Stream config
  const [streamKey, setStreamKey] = useState('');
  const [rtmpUrl, setRtmpUrl] = useState('');
  const [rtmpFullUrl, setRtmpFullUrl] = useState('');
  const [whipUrl, setWhipUrl] = useState('');
  const [playbackUrl, setPlaybackUrl] = useState('');
  const [streamStatus, setStreamStatus] = useState('idle');
  const [platformInstructions, setPlatformInstructions] = useState('');

  // Multistream
  const [multistreamTargets, setMultistreamTargets] = useState<MultistreamTarget[]>([]);
  const [showAddTarget, setShowAddTarget] = useState(false);
  const [newTarget, setNewTarget] = useState({ platform: 'custom' as ExternalPlatform, name: '', rtmpUrl: '', streamKey: '' });

  const fetchConfig = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/rooms/${params.id}/stream-config?platform=${selectedPlatform}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const { stream, multistream, platformConfig } = data.data;
        setStreamKey(stream.streamKey);
        setRtmpUrl(stream.rtmpIngestUrl);
        setRtmpFullUrl(stream.rtmpFullUrl);
        setWhipUrl(stream.whipUrl || '');
        setPlaybackUrl(stream.playbackUrl);
        setStreamStatus(stream.status);
        setMultistreamTargets(multistream);
        setPlatformInstructions(platformConfig.instructions);
      } else {
        setError(data.error || 'Failed to load stream config');
      }
    } catch {
      setError('Failed to load stream settings');
    } finally {
      setLoading(false);
    }
  }, [params.id, token, selectedPlatform]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  async function handleCopy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/rooms/${params.id}/stream-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'regenerate-key' }),
      });
      const data = await res.json();
      if (data.success) {
        setStreamKey(data.data.streamKey);
        setRtmpFullUrl(data.data.rtmpFullUrl);
      }
    } catch {
      setError('Failed to regenerate key');
    } finally {
      setRegenerating(false);
    }
  }

  async function handleAddTarget() {
    if (!newTarget.name || !newTarget.rtmpUrl || !newTarget.streamKey) return;
    try {
      const res = await fetch(`/api/rooms/${params.id}/stream-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'add-multistream', ...newTarget }),
      });
      const data = await res.json();
      if (data.success) {
        setMultistreamTargets([...multistreamTargets, data.data]);
        setNewTarget({ platform: 'custom', name: '', rtmpUrl: '', streamKey: '' });
        setShowAddTarget(false);
      }
    } catch {
      setError('Failed to add target');
    }
  }

  async function handleRemoveTarget(targetId: string) {
    try {
      await fetch(`/api/rooms/${params.id}/stream-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'remove-multistream', targetId }),
      });
      setMultistreamTargets(multistreamTargets.filter((t) => t.id !== targetId));
    } catch {
      // silently fail
    }
  }

  function CopyButton({ text, label }: { text: string; label: string }) {
    const isCopied = copied === label;
    return (
      <button
        onClick={() => handleCopy(text, label)}
        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors shrink-0"
        title={`Copy ${label}`}
      >
        {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-white/40" />}
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href={`/room/${params.id}`} className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} />
        Back to Room
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Settings size={24} className="text-gold" />
              Stream Settings
            </h1>
            <p className="text-white/40 text-sm mt-1">Configure your stream for external broadcasting software</p>
          </div>
          <Badge variant={streamStatus === 'live' ? 'live' : 'default'}>
            {streamStatus === 'live' ? 'LIVE' : 'Offline'}
          </Badge>
        </div>

        {error && (
          <Card className="mb-6 !bg-red-500/10 border-red-500/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-400" size={18} />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </Card>
        )}

        {/* Stream Key & URL Section */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Radio size={18} className="text-gold" />
              Stream Key & Server URL
            </h2>
            <p className="text-xs text-white/40 mt-1">Copy these into your streaming software</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Server URL */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Server URL (RTMP)</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm font-mono text-white/80 overflow-x-auto">
                    {rtmpUrl}
                  </div>
                  <CopyButton text={rtmpUrl} label="Server URL" />
                </div>
              </div>

              {/* Stream Key */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Stream Key</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm font-mono text-white/80 overflow-x-auto">
                    {showKey ? streamKey : '\u2022'.repeat(40)}
                  </div>
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    {showKey ? <EyeOff size={14} className="text-white/40" /> : <Eye size={14} className="text-white/40" />}
                  </button>
                  <CopyButton text={streamKey} label="Stream Key" />
                </div>
              </div>

              {/* Full RTMP URL */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Full RTMP URL (Server + Key combined)</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm font-mono text-white/80 overflow-x-auto">
                    {showKey ? rtmpFullUrl : `${rtmpUrl}/\u2022\u2022\u2022\u2022\u2022\u2022`}
                  </div>
                  <CopyButton text={rtmpFullUrl} label="Full URL" />
                </div>
              </div>

              {/* WHIP URL */}
              {whipUrl && (
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">WHIP URL (for browser-based publishing)</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm font-mono text-white/80 overflow-x-auto">
                      {whipUrl}
                    </div>
                    <CopyButton text={whipUrl} label="WHIP URL" />
                  </div>
                </div>
              )}

              {/* Playback URL */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Playback URL (HLS)</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm font-mono text-white/80 overflow-x-auto">
                    {playbackUrl}
                  </div>
                  <CopyButton text={playbackUrl} label="Playback URL" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="danger" size="sm" onClick={handleRegenerate} disabled={regenerating}>
                  {regenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Regenerate Key
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform-Specific Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Monitor size={18} className="text-gold" />
              Setup Instructions
            </h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedPlatform === p.id
                      ? 'bg-gold/20 text-gold ring-1 ring-gold/30'
                      : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <pre className="text-sm text-white/70 whitespace-pre-wrap font-mono leading-relaxed">
                {platformInstructions}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Multistream Targets */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Zap size={18} className="text-gold" />
                Multistream Targets
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddTarget(true)}>
                <Plus size={14} />
                Add Target
              </Button>
            </div>
            <p className="text-xs text-white/40 mt-1">Rebroadcast your stream to YouTube, Twitch, and more</p>
          </CardHeader>
          <CardContent>
            {multistreamTargets.length === 0 && !showAddTarget ? (
              <p className="text-white/30 text-sm text-center py-6">
                No multistream targets configured. Add one to broadcast to multiple platforms simultaneously.
              </p>
            ) : (
              <div className="space-y-3">
                {multistreamTargets.map((target) => (
                  <div key={target.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <Badge variant={target.enabled ? 'success' : 'default'}>
                        {target.platform}
                      </Badge>
                      <span className="text-sm font-medium">{target.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveTarget(target.id)}
                      className="p-1.5 rounded hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showAddTarget && (
              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex gap-2">
                  <select
                    value={newTarget.platform}
                    onChange={(e) => setNewTarget({ ...newTarget, platform: e.target.value as ExternalPlatform })}
                    className="input-field w-40"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <Input
                    id="target-name"
                    placeholder="Target name (e.g. YouTube)"
                    value={newTarget.name}
                    onChange={(e) => setNewTarget({ ...newTarget, name: e.target.value })}
                  />
                </div>
                <Input
                  id="target-rtmp"
                  placeholder="RTMP URL (e.g. rtmp://a.rtmp.youtube.com/live2)"
                  value={newTarget.rtmpUrl}
                  onChange={(e) => setNewTarget({ ...newTarget, rtmpUrl: e.target.value })}
                />
                <Input
                  id="target-key"
                  placeholder="Stream Key"
                  value={newTarget.streamKey}
                  onChange={(e) => setNewTarget({ ...newTarget, streamKey: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button variant="gold" size="sm" onClick={handleAddTarget}>Add</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddTarget(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Receive External Stream */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ExternalLink size={18} className="text-gold" />
              Receive External Stream
            </h2>
            <p className="text-xs text-white/40 mt-1">Paste a stream URL from another platform to embed in your room</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/50 mb-3">
              If you have a stream URL or key from another platform (YouTube Live, Twitch, etc.),
              you can paste it here to display that stream in your SeeWhy LIVE room.
            </p>
            <div className="p-4 rounded-xl bg-gold/5 border border-gold/20">
              <p className="text-sm text-gold/80">
                To embed an external stream, go to your room and use the Video settings to paste
                an HLS (.m3u8), DASH (.mpd), or RTMP playback URL.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
