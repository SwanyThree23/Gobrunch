'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Users,
  Eye,
  Settings,
  Share2,
  Heart,
  ThumbsUp,
  Laugh,
  Flame,
  Brain,
  Maximize2,
  Volume2,
  DollarSign,
  Video,
  MessageSquare,
  Subtitles,
  Ticket,
  Lock,
  Radio,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { VDONinjaEmbed } from '@/components/streaming/VDONinjaEmbed';
import { SocialStreamPanel } from '@/components/streaming/SocialStreamPanel';
import { CaptionOverlay } from '@/components/streaming/CaptionOverlay';
import { TipModal } from '@/components/payments/TipModal';
import { useRoomStore } from '@/lib/hooks/useRoomStore';
import { useAuthStore } from '@/lib/hooks/useAuthStore';
import { useSocket } from '@/lib/hooks/useSocket';
import { formatViewerCount, formatRelativeTime } from '@/lib/utils';
import type { Room } from '@/types';

const reactions = [
  { emoji: '\u2764\uFE0F', icon: Heart },
  { emoji: '\uD83D\uDC4D', icon: ThumbsUp },
  { emoji: '\uD83D\uDE02', icon: Laugh },
  { emoji: '\uD83D\uDD25', icon: Flame },
];

interface StreamingToolkit {
  vdoninja?: {
    iframeUrl: string;
    urls: { director: string; publisher: string; viewer: string };
  };
  socialStream?: {
    feedUrl: string;
    dockUrl: string;
    session: string;
  };
  captions?: {
    senderUrl: string;
    displayUrl: string;
  };
  isHost?: boolean;
}

export default function RoomPage({ params }: { params: { id: string } }) {
  const [chatInput, setChatInput] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showSocialStream, setShowSocialStream] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [toolkit, setToolkit] = useState<StreamingToolkit | null>(null);
  const [loading, setLoading] = useState(true);
  const [useVDO, setUseVDO] = useState(false);
  const [ticketAccess, setTicketAccess] = useState(false);
  const [purchasingTicket, setPurchasingTicket] = useState(false);
  const [goingLive, setGoingLive] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { token, user } = useAuthStore();
  const { viewerCount, chatMessages } = useRoomStore();
  const { sendMessage } = useSocket({ roomId: params.id, token: token || undefined });

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${params.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) setRoom(data.data);
    } catch {
      // room not found
    } finally {
      setLoading(false);
    }
  }, [params.id, token]);

  const fetchToolkit = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/rooms/${params.id}/streaming`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setToolkit(data.data as StreamingToolkit);
      }
    } catch {
      // streaming toolkit not available
    }
  }, [params.id, token]);

  // Check ticket access when room loads
  useEffect(() => {
    if (!room) return;
    // Host always has access
    if (room.hostId === user?.id) {
      setTicketAccess(true);
      return;
    }
    // Room doesn't require a ticket
    if (!room.requiresTicket) {
      setTicketAccess(true);
      return;
    }
    // Check if user has purchased a ticket
    if (token) {
      fetch(`/api/rooms/${params.id}/ticket-status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.hasTicket) {
            setTicketAccess(true);
          }
        })
        .catch(() => {});
    }
  }, [room, user?.id, token, params.id]);

  async function handlePurchaseTicket() {
    if (!room || !token) return;
    setPurchasingTicket(true);
    try {
      const res = await fetch('/api/stripe/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ roomId: room.id, amount: room.ticketPrice }),
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch {
      // handle error silently
    } finally {
      setPurchasingTicket(false);
    }
  }

  async function handleGoLive() {
    if (!room || !token) return;
    setGoingLive(true);
    try {
      const res = await fetch(`/api/rooms/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'live' }),
      });
      const data = await res.json();
      if (data.success) {
        setRoom(data.data);
      }
    } catch {
      // handle error
    } finally {
      setGoingLive(false);
    }
  }

  async function handleEndStream() {
    if (!room || !token) return;
    try {
      const res = await fetch(`/api/rooms/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'ended' }),
      });
      const data = await res.json();
      if (data.success) {
        setRoom(data.data);
      }
    } catch {
      // handle error
    }
  }

  useEffect(() => {
    fetchRoom();
    fetchToolkit();
  }, [fetchRoom, fetchToolkit]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput('');
  }

  const currentViewers = viewerCount || room?.currentViewers || 0;
  const roomTitle = room?.title || 'Loading...';
  const isHost = toolkit?.isHost || room?.hostId === user?.id;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Ticket gate: show purchase screen if viewer doesn't have access
  if (room?.requiresTicket && !ticketAccess) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full mx-4">
          <Card>
            <div className="text-center p-6">
              <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-6">
                <Lock className="text-gold" size={32} />
              </div>
              <h1 className="text-2xl font-bold mb-2">{room.title}</h1>
              <p className="text-white/50 mb-2">{room.description}</p>
              {room.status === 'live' && (
                <Badge variant="live" className="mb-4">LIVE NOW</Badge>
              )}
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Ticket size={18} className="text-gold" />
                  <span className="text-lg font-bold text-gold">
                    ${((room.ticketPrice || 0) / 100).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-white/40">One-time ticket purchase for access</p>
              </div>
              {user ? (
                <Button
                  variant="gold"
                  className="w-full"
                  onClick={handlePurchaseTicket}
                  loading={purchasingTicket}
                >
                  <Ticket size={16} />
                  Purchase Ticket
                </Button>
              ) : (
                <Link href="/auth/login">
                  <Button variant="primary" className="w-full">
                    Sign in to Purchase
                  </Button>
                </Link>
              )}
              <p className="text-xs text-white/30 mt-4">
                Powered by Stripe Connect. Funds go directly to the creator.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
      {/* Video Area */}
      <div className="flex-1 flex flex-col">
        {/* Video Player */}
        <div className="relative flex-1 bg-black/50 flex items-center justify-center min-h-[300px]">
          {useVDO && toolkit?.vdoninja ? (
            /* VDO.Ninja embed */
            <VDONinjaEmbed
              iframeUrl={toolkit.vdoninja.iframeUrl}
              isHost={isHost}
              className="absolute inset-0"
            />
          ) : (
            /* Default stream placeholder */
            <div className="absolute inset-0 bg-gradient-to-br from-burgundy/10 to-dark flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 animate-glow-pulse">
                  <Volume2 size={32} className="text-gold" />
                </div>
                <h2 className="text-xl font-bold">{roomTitle}</h2>
                <p className="text-white/40 mt-1">
                  {room?.status === 'live' ? 'Stream is live' : room?.status || 'Loading'}
                </p>
                {isHost && room?.status !== 'live' && (
                  <div className="flex gap-2 justify-center mt-4">
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={handleGoLive}
                      loading={goingLive}
                    >
                      <Radio size={14} />
                      Go Live
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUseVDO(true)}
                    >
                      <Video size={14} />
                      VDO.Ninja
                    </Button>
                  </div>
                )}
                {isHost && room?.status === 'live' && (
                  <div className="flex gap-2 justify-center mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUseVDO(true)}
                    >
                      <Video size={14} />
                      Open VDO.Ninja
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleEndStream}
                    >
                      End Stream
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Caption overlay */}
          {showCaptions && toolkit?.captions && (
            <CaptionOverlay
              senderUrl={toolkit.captions.senderUrl}
              displayUrl={toolkit.captions.displayUrl}
              isHost={isHost}
              className="absolute bottom-16 left-4 right-4 z-10"
            />
          )}

          {/* Overlay controls */}
          <div className="absolute top-4 left-4 flex items-center gap-3">
            {room?.status === 'live' && <Badge variant="live">LIVE</Badge>}
            <Badge variant="default">
              <Eye size={12} />
              {formatViewerCount(currentViewers)}
            </Badge>
          </div>

          <div className="absolute top-4 right-4 flex gap-2">
            <button className="p-2 rounded-lg bg-black/40 text-white/70 hover:text-white hover:bg-black/60 transition-colors">
              <Share2 size={18} />
            </button>
            <button className="p-2 rounded-lg bg-black/40 text-white/70 hover:text-white hover:bg-black/60 transition-colors">
              <Maximize2 size={18} />
            </button>
          </div>

          {/* Reactions overlay */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            {reactions.map((r) => (
              <button
                key={r.emoji}
                className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-lg transition-all hover:scale-110"
              >
                {r.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Stream info bar */}
        <div className="p-4 border-t border-white/5 bg-dark-600/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={room?.host?.displayName || 'Host'} size="md" showStatus status="online" />
              <div>
                <h3 className="font-semibold text-sm">{room?.host?.displayName || 'Host'}</h3>
                <p className="text-xs text-white/40">
                  {room?.description || 'Stream host'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {/* Tip button */}
              {!isHost && room?.hostId && (
                <Button variant="gold" size="sm" onClick={() => setShowTipModal(true)}>
                  <DollarSign size={14} />
                  Tip
                </Button>
              )}
              {/* Ticket info for viewers */}
              {room?.requiresTicket && room?.ticketPrice && !isHost && (
                <Badge variant="default">
                  <Ticket size={10} />
                  ${(room.ticketPrice / 100).toFixed(2)} ticket
                </Badge>
              )}
              {/* Social Stream toggle */}
              {toolkit?.socialStream && (
                <Button
                  variant={showSocialStream ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setShowSocialStream(!showSocialStream)}
                >
                  <MessageSquare size={16} />
                </Button>
              )}
              {/* Caption toggle */}
              {toolkit?.captions && (
                <Button
                  variant={showCaptions ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setShowCaptions(!showCaptions)}
                >
                  <Subtitles size={16} />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setShowAI(!showAI)}>
                <Brain size={16} />
                AI
              </Button>
              {/* Stream settings for host */}
              {isHost && (
                <Link href={`/room/${params.id}/settings`}>
                  <Button variant="ghost" size="sm">
                    <Settings size={16} />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="w-full lg:w-96 border-l border-white/5 flex flex-col bg-dark-600/30 max-h-[50vh] lg:max-h-full">
        {/* Chat header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Live Chat</h3>
            <Badge variant="default">
              <Users size={10} />
              {formatViewerCount(currentViewers)}
            </Badge>
          </div>
        </div>

        {/* Social Stream Panel (collapsible) */}
        {showSocialStream && toolkit?.socialStream && (
          <div className="border-b border-white/5 max-h-[200px]">
            <SocialStreamPanel
              feedUrl={toolkit.socialStream.feedUrl}
              dockUrl={toolkit.socialStream.dockUrl}
              session={toolkit.socialStream.session}
            />
          </div>
        )}

        {/* AI Panel */}
        {showAI && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/5"
          >
            <Card className="m-3 !p-3 bg-gradient-to-br from-burgundy/10 to-transparent">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={14} className="text-gold" />
                <span className="text-xs font-semibold text-gold">AI Assistant</span>
              </div>
              <p className="text-xs text-white/50">
                Ask me anything about the stream! I can summarize discussions,
                answer questions, and provide context.
              </p>
            </Card>
          </motion.div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.length === 0 ? (
            <p className="text-center text-white/20 text-sm py-8">
              No messages yet. Say hello!
            </p>
          ) : (
            chatMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2">
                <Avatar name={msg.user?.displayName || msg.userId} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-gold-300">
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
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={user ? 'Send a message...' : 'Login to chat'}
              disabled={!user}
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold/40 disabled:opacity-50"
            />
            <Button type="submit" variant="primary" size="sm" disabled={!chatInput.trim() || !user}>
              <Send size={14} />
            </Button>
          </form>
        </div>
      </div>

      {/* Tip Modal */}
      {room?.hostId && (
        <TipModal
          isOpen={showTipModal}
          onClose={() => setShowTipModal(false)}
          creatorId={room.hostId}
          creatorName={room.host?.displayName || 'Creator'}
          roomId={room.id}
        />
      )}
    </div>
  );
}
