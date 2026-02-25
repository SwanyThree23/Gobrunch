'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  Users,
  Send,
  Copy,
  Check,
  Brain,
  PartyPopper,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useWatchPartyStore } from '@/lib/hooks/useWatchPartyStore';
import { useAuthStore } from '@/lib/hooks/useAuthStore';
import { useSocket } from '@/lib/hooks/useSocket';
import { formatDuration, formatRelativeTime } from '@/lib/utils';
import type { WatchParty } from '@/types';

const reactionEmojis = ['❤️', '🎉', '😂', '🔥', '👏', '😮'];

export default function WatchPartyPage({ params }: { params: { id: string } }) {
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [party, setParty] = useState<WatchParty | null>(null);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { token, user } = useAuthStore();
  const { party: storeParty, chatMessages, isHost, setParty: setStoreParty, setIsHost } = useWatchPartyStore();
  const { sendMessage, sendSync, sendReaction } = useSocket({
    watchPartyId: params.id,
    token: token || undefined,
  });

  const fetchParty = useCallback(async () => {
    try {
      const res = await fetch(`/api/watchparty/${params.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setParty(data.data);
        setStoreParty(data.data);
        if (user && data.data.hostId === user.id) {
          setIsHost(true);
        }
      }
    } catch {
      // party not found
    } finally {
      setLoading(false);
    }
  }, [params.id, token, user, setStoreParty, setIsHost]);

  useEffect(() => {
    fetchParty();
  }, [fetchParty]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const activeParty = storeParty || party;
  const isPlaying = activeParty?.status === 'playing';
  const currentTime = activeParty?.currentTime || 0;
  const totalDuration = 3600;
  const inviteCode = activeParty?.inviteCode || '--------';
  const participants = activeParty?.participants || [];

  function handleCopyCode() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePlayPause() {
    if (!isHost) return;
    sendSync({
      type: isPlaying ? 'pause' : 'play',
      data: { currentTime },
    });
  }

  function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput('');
  }

  function handleReaction(emoji: string) {
    sendReaction(emoji);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Video Player */}
        <div className="relative flex-1 bg-black/50 flex items-center justify-center min-h-[300px]">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-dark flex items-center justify-center">
            <div className="text-center">
              <PartyPopper size={48} className="text-purple-400 mx-auto mb-4 animate-float" />
              <h2 className="text-xl font-bold">{activeParty?.title || 'Watch Party'}</h2>
              <p className="text-white/40 mt-1">Watch Party - Synced Playback</p>
            </div>
          </div>

          {/* Top overlay */}
          <div className="absolute top-4 left-4 flex items-center gap-3">
            <Badge variant="success">{isPlaying ? 'PLAYING' : 'SYNCED'}</Badge>
            <Badge variant="default">
              <Users size={12} />
              {participants.length} watching
            </Badge>
          </div>

          <div className="absolute top-4 right-4">
            <button className="p-2 rounded-lg bg-black/40 text-white/70 hover:text-white transition-colors">
              <Maximize2 size={18} />
            </button>
          </div>

          {/* Reactions floating */}
          <div className="absolute bottom-20 left-4 flex flex-wrap gap-2">
            {reactionEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-lg transition-all hover:scale-110"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Playback controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer group">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-gold rounded-full relative"
                style={{ width: `${(currentTime / totalDuration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  disabled={!isHost}
                  className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <SkipForward size={18} />
                </button>
                <button className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <Volume2 size={18} />
                </button>
                <span className="text-sm text-white/60 font-mono">
                  {formatDuration(currentTime)} / {formatDuration(totalDuration)}
                </span>
              </div>
              {!isHost && (
                <span className="text-xs text-white/30">Host controls playback</span>
              )}
            </div>
          </div>
        </div>

        {/* Invite bar */}
        <div className="p-3 border-t border-white/5 bg-dark-600/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/40">Invite Code:</span>
            <code className="px-3 py-1 bg-white/5 rounded-lg text-sm font-mono text-gold">
              {inviteCode}
            </code>
            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowAI(!showAI)}>
            <Brain size={16} />
            AI
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-96 border-l border-white/5 flex flex-col bg-dark-600/30 max-h-[50vh] lg:max-h-full">
        {/* Participants */}
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Users size={14} />
            Participants ({participants.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <div key={p.userId} className="relative">
                <Avatar name={p.user?.displayName || p.userId.slice(0, 6)} size="sm" />
                {p.isReady && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-dark" />
                )}
                {p.reaction && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 text-sm"
                  >
                    {p.reaction}
                  </motion.span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AI Panel */}
        {showAI && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="border-b border-white/5"
          >
            <Card className="m-3 !p-3 bg-gradient-to-br from-purple-500/10 to-transparent">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={14} className="text-gold" />
                <span className="text-xs font-semibold text-gold">AI Assistant</span>
              </div>
              <p className="text-xs text-white/50">
                I can help with trivia about the movie, explain scenes, or
                suggest discussion topics for the group!
              </p>
            </Card>
          </motion.div>
        )}

        {/* Chat */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.length === 0 ? (
            <p className="text-center text-white/20 text-sm py-8">No messages yet</p>
          ) : (
            chatMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2">
                <Avatar name={msg.user?.displayName || msg.userId} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-purple-300">
                      {msg.user?.displayName || msg.userId.slice(0, 8)}
                    </span>
                    <span className="text-xs text-white/30">
                      {formatRelativeTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-white/70 break-words">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat input */}
        <div className="p-3 border-t border-white/5">
          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={user ? 'Chat with the group...' : 'Login to chat'}
              disabled={!user}
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/40 disabled:opacity-50"
            />
            <Button type="submit" variant="primary" size="sm" disabled={!chatInput.trim() || !user}>
              <Send size={14} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
