'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { WS_EVENTS } from '@/lib/constants';
import { useRoomStore } from '@/lib/hooks/useRoomStore';
import { useWatchPartyStore } from '@/lib/hooks/useWatchPartyStore';
import type { ChatMessage, WatchPartySyncEvent } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

interface UseSocketOptions {
  roomId?: string;
  watchPartyId?: string;
  token?: string;
}

export function useSocket({ roomId, watchPartyId, token }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const { setConnected, addChatMessage, setViewerCount } = useRoomStore();
  const { addSyncEvent, updatePartyState } = useWatchPartyStore();

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);

      if (roomId) {
        socket.emit(WS_EVENTS.ROOM_JOIN, { roomId });
      }
      if (watchPartyId) {
        socket.emit(WS_EVENTS.WATCHPARTY_PARTICIPANT_JOIN, { watchPartyId });
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Chat events
    socket.on(WS_EVENTS.CHAT_MESSAGE, (message: ChatMessage) => {
      addChatMessage(message);
    });

    // Viewer count
    socket.on(WS_EVENTS.VIEWER_COUNT, (data: { count: number }) => {
      setViewerCount(data.count);
    });

    // Watch party sync events
    socket.on(WS_EVENTS.WATCHPARTY_SYNC, (event: WatchPartySyncEvent) => {
      addSyncEvent(event);
      if (event.data.currentTime !== undefined) {
        updatePartyState({ currentTime: event.data.currentTime });
      }
      if (event.type === 'play') updatePartyState({ status: 'playing' });
      if (event.type === 'pause') updatePartyState({ status: 'paused' });
    });

    // Watch party participant events
    socket.on(WS_EVENTS.WATCHPARTY_PARTICIPANT_JOIN, (data: { userId: string }) => {
      // Handled by store updates
    });

    socket.on(WS_EVENTS.WATCHPARTY_PARTICIPANT_LEAVE, (data: { userId: string }) => {
      // Handled by store updates
    });

    // Error handling
    socket.on(WS_EVENTS.ERROR, (error: { message: string }) => {
      console.error('Socket error:', error.message);
    });

    return () => {
      if (roomId) {
        socket.emit(WS_EVENTS.ROOM_LEAVE, { roomId });
      }
      if (watchPartyId) {
        socket.emit(WS_EVENTS.WATCHPARTY_PARTICIPANT_LEAVE, { watchPartyId });
      }
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [roomId, watchPartyId, token, setConnected, addChatMessage, setViewerCount, addSyncEvent, updatePartyState]);

  const sendMessage = useCallback(
    (content: string, type: string = 'text') => {
      socketRef.current?.emit(WS_EVENTS.CHAT_MESSAGE, {
        roomId,
        content,
        type,
      });
    },
    [roomId]
  );

  const sendTyping = useCallback(() => {
    socketRef.current?.emit(WS_EVENTS.CHAT_TYPING, { roomId });
  }, [roomId]);

  const sendSync = useCallback(
    (event: Omit<WatchPartySyncEvent, 'timestamp' | 'userId'>) => {
      socketRef.current?.emit(WS_EVENTS.WATCHPARTY_SYNC, {
        watchPartyId,
        ...event,
      });
    },
    [watchPartyId]
  );

  const sendReaction = useCallback(
    (reaction: string) => {
      socketRef.current?.emit(WS_EVENTS.WATCHPARTY_REACTION, {
        watchPartyId,
        reaction,
      });
    },
    [watchPartyId]
  );

  return {
    socket: socketRef.current,
    sendMessage,
    sendTyping,
    sendSync,
    sendReaction,
  };
}
