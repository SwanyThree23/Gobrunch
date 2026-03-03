/**
 * WebSocket server for SeeWhy LIVE
 * Run separately: npx tsx server/websocket.ts
 *
 * Handles real-time events: rooms, chat, watch parties, stream lifecycle,
 * and fires automation webhook events for n8n/Zapier integration.
 */
import { createServer } from 'http';
import { Server, type Socket } from 'socket.io';

const PORT = parseInt(process.env.WS_PORT || '3001');
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: APP_URL,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Track room membership and viewer counts
const roomViewers = new Map<string, Set<string>>();
const watchPartyMembers = new Map<string, Set<string>>();

// Track room hosts for stream lifecycle
const roomHosts = new Map<string, string>(); // roomId -> userId

/**
 * Fire an automation event via the internal API.
 * This calls the Next.js server-side fireAutomationEvent service.
 */
async function fireAutomationWebhook(event: {
  trigger: string;
  timestamp: string;
  roomId?: string;
  userId?: string;
  data: Record<string, unknown>;
}): Promise<void> {
  try {
    await fetch(`${APP_URL}/api/automation/fire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': process.env.INTERNAL_SECRET || 'ws-internal' },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.error(`[WS] Failed to fire automation event: ${event.trigger}`, err);
  }
}

io.on('connection', (socket: Socket) => {
  const userId = socket.handshake.auth?.token || socket.id;
  console.log(`[WS] Connected: ${socket.id} (user: ${userId})`);

  // ---- Room Events ----
  socket.on('room:join', (data: { roomId: string; isHost?: boolean }) => {
    const { roomId, isHost } = data;
    socket.join(`room:${roomId}`);

    if (!roomViewers.has(roomId)) {
      roomViewers.set(roomId, new Set());
    }
    roomViewers.get(roomId)!.add(socket.id);

    if (isHost) {
      roomHosts.set(roomId, userId);
    }

    const count = roomViewers.get(roomId)!.size;
    io.to(`room:${roomId}`).emit('viewer:count', { count });
    console.log(`[WS] ${socket.id} joined room ${roomId} (${count} viewers)`);

    // Fire automation: viewer.joined
    fireAutomationWebhook({
      trigger: 'viewer.joined',
      timestamp: new Date().toISOString(),
      roomId,
      userId,
      data: { viewerCount: count },
    });
  });

  socket.on('room:leave', (data: { roomId: string }) => {
    const { roomId } = data;
    socket.leave(`room:${roomId}`);

    roomViewers.get(roomId)?.delete(socket.id);
    const count = roomViewers.get(roomId)?.size || 0;
    io.to(`room:${roomId}`).emit('viewer:count', { count });

    // Fire automation: viewer.left
    fireAutomationWebhook({
      trigger: 'viewer.left',
      timestamp: new Date().toISOString(),
      roomId,
      userId,
      data: { viewerCount: count },
    });
  });

  // ---- Stream Lifecycle Events ----
  socket.on('stream:start', (data: { roomId: string; title?: string }) => {
    const { roomId, title } = data;

    // Broadcast to all viewers in the room
    io.to(`room:${roomId}`).emit('stream:started', {
      roomId,
      userId,
      timestamp: new Date().toISOString(),
    });

    console.log(`[WS] Stream started in room ${roomId} by ${userId}`);

    // Fire automation: stream.started
    fireAutomationWebhook({
      trigger: 'stream.started',
      timestamp: new Date().toISOString(),
      roomId,
      userId,
      data: { title: title || '', viewerCount: roomViewers.get(roomId)?.size || 0 },
    });
  });

  socket.on('stream:end', (data: { roomId: string; title?: string }) => {
    const { roomId, title } = data;
    const peakViewers = roomViewers.get(roomId)?.size || 0;

    io.to(`room:${roomId}`).emit('stream:ended', {
      roomId,
      userId,
      timestamp: new Date().toISOString(),
    });

    console.log(`[WS] Stream ended in room ${roomId} by ${userId}`);

    // Fire automation: stream.ended
    fireAutomationWebhook({
      trigger: 'stream.ended',
      timestamp: new Date().toISOString(),
      roomId,
      userId,
      data: { title: title || '', peakViewers },
    });
  });

  // ---- Payment Events (broadcast to room) ----
  socket.on('tip:received', (data: { roomId: string; amount: number; fromUser: string; message?: string }) => {
    const { roomId, amount, fromUser, message } = data;

    // Broadcast tip notification to the room
    io.to(`room:${roomId}`).emit('tip:received', {
      roomId,
      amount,
      fromUser,
      message: message || '',
      timestamp: new Date().toISOString(),
    });

    console.log(`[WS] Tip $${(amount / 100).toFixed(2)} in room ${roomId} from ${fromUser}`);

    // Fire automation: tip.received
    fireAutomationWebhook({
      trigger: 'tip.received',
      timestamp: new Date().toISOString(),
      roomId,
      userId: roomHosts.get(roomId),
      data: { amount, fromUser, message: message || '', currency: 'usd' },
    });
  });

  socket.on('ticket:purchased', (data: { roomId: string; buyerId: string; amount: number }) => {
    const { roomId, buyerId, amount } = data;

    // Notify the host
    io.to(`room:${roomId}`).emit('ticket:purchased', {
      roomId,
      buyerId,
      amount,
      timestamp: new Date().toISOString(),
    });

    // Fire automation: ticket.purchased
    fireAutomationWebhook({
      trigger: 'ticket.purchased',
      timestamp: new Date().toISOString(),
      roomId,
      userId: roomHosts.get(roomId),
      data: { buyerId, amount },
    });
  });

  // ---- Chat Events ----
  socket.on('chat:message', (data: { roomId: string; content: string; type: string }) => {
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      roomId: data.roomId,
      userId,
      type: data.type || 'text',
      content: data.content,
      isPinned: false,
      reactions: {},
      createdAt: new Date().toISOString(),
    };

    io.to(`room:${data.roomId}`).emit('chat:message', message);

    // Fire automation: chat.message
    fireAutomationWebhook({
      trigger: 'chat.message',
      timestamp: new Date().toISOString(),
      roomId: data.roomId,
      userId,
      data: { content: data.content, type: data.type || 'text' },
    });
  });

  socket.on('chat:typing', (data: { roomId: string }) => {
    socket.to(`room:${data.roomId}`).emit('chat:typing', { userId });
  });

  socket.on('chat:reaction', (data: { roomId: string; messageId: string; reaction: string }) => {
    io.to(`room:${data.roomId}`).emit('chat:reaction', {
      messageId: data.messageId,
      userId,
      reaction: data.reaction,
    });
  });

  // ---- Watch Party Events ----
  socket.on('watchparty:participant_join', (data: { watchPartyId: string }) => {
    const { watchPartyId } = data;
    socket.join(`wp:${watchPartyId}`);

    if (!watchPartyMembers.has(watchPartyId)) {
      watchPartyMembers.set(watchPartyId, new Set());
    }
    watchPartyMembers.get(watchPartyId)!.add(socket.id);

    io.to(`wp:${watchPartyId}`).emit('watchparty:participant_join', { userId });
  });

  socket.on('watchparty:participant_leave', (data: { watchPartyId: string }) => {
    const { watchPartyId } = data;
    socket.leave(`wp:${watchPartyId}`);
    watchPartyMembers.get(watchPartyId)?.delete(socket.id);

    io.to(`wp:${watchPartyId}`).emit('watchparty:participant_leave', { userId });
  });

  socket.on('watchparty:sync', (data: { watchPartyId: string; type: string; data: Record<string, unknown> }) => {
    const event = {
      type: data.type,
      timestamp: Date.now(),
      userId,
      data: data.data,
    };

    // Broadcast sync to all participants except sender
    socket.to(`wp:${data.watchPartyId}`).emit('watchparty:sync', event);
  });

  socket.on('watchparty:reaction', (data: { watchPartyId: string; reaction: string }) => {
    io.to(`wp:${data.watchPartyId}`).emit('watchparty:reaction', {
      userId,
      reaction: data.reaction,
    });
  });

  socket.on('watchparty:start', (data: { watchPartyId: string; videoUrl: string }) => {
    io.to(`wp:${data.watchPartyId}`).emit('watchparty:started', {
      watchPartyId: data.watchPartyId,
      userId,
      videoUrl: data.videoUrl,
      timestamp: new Date().toISOString(),
    });

    // Fire automation: watchparty.started
    fireAutomationWebhook({
      trigger: 'watchparty.started',
      timestamp: new Date().toISOString(),
      userId,
      data: { watchPartyId: data.watchPartyId, videoUrl: data.videoUrl },
    });
  });

  // ---- Disconnect ----
  socket.on('disconnect', () => {
    console.log(`[WS] Disconnected: ${socket.id}`);

    // Clean up room viewers and fire automation events
    for (const [roomId, viewers] of Array.from(roomViewers.entries())) {
      if (viewers.has(socket.id)) {
        viewers.delete(socket.id);
        const count = viewers.size;
        io.to(`room:${roomId}`).emit('viewer:count', { count });

        // Fire automation: viewer.left (on disconnect)
        fireAutomationWebhook({
          trigger: 'viewer.left',
          timestamp: new Date().toISOString(),
          roomId,
          userId,
          data: { viewerCount: count, reason: 'disconnect' },
        });
      }
    }

    // Clean up watch party members
    for (const [wpId, members] of Array.from(watchPartyMembers.entries())) {
      if (members.has(socket.id)) {
        members.delete(socket.id);
        io.to(`wp:${wpId}`).emit('watchparty:participant_leave', { userId });
      }
    }

    // Clean up host tracking
    for (const [roomId, hostId] of Array.from(roomHosts.entries())) {
      if (hostId === userId) {
        roomHosts.delete(roomId);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[WS] SeeWhy LIVE WebSocket server running on port ${PORT}`);
});
