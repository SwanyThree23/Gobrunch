/**
 * WebSocket server for SeeWhy LIVE
 * Run separately: npx tsx server/websocket.ts
 */
import { createServer } from 'http';
import { Server, type Socket } from 'socket.io';

const PORT = parseInt(process.env.WS_PORT || '3001');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Track room membership and viewer counts
const roomViewers = new Map<string, Set<string>>();
const watchPartyMembers = new Map<string, Set<string>>();

io.on('connection', (socket: Socket) => {
  const userId = socket.handshake.auth?.token || socket.id;
  console.log(`[WS] Connected: ${socket.id} (user: ${userId})`);

  // ---- Room Events ----
  socket.on('room:join', (data: { roomId: string }) => {
    const { roomId } = data;
    socket.join(`room:${roomId}`);

    if (!roomViewers.has(roomId)) {
      roomViewers.set(roomId, new Set());
    }
    roomViewers.get(roomId)!.add(socket.id);

    const count = roomViewers.get(roomId)!.size;
    io.to(`room:${roomId}`).emit('viewer:count', { count });
    console.log(`[WS] ${socket.id} joined room ${roomId} (${count} viewers)`);
  });

  socket.on('room:leave', (data: { roomId: string }) => {
    const { roomId } = data;
    socket.leave(`room:${roomId}`);

    roomViewers.get(roomId)?.delete(socket.id);
    const count = roomViewers.get(roomId)?.size || 0;
    io.to(`room:${roomId}`).emit('viewer:count', { count });
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

  // ---- Disconnect ----
  socket.on('disconnect', () => {
    console.log(`[WS] Disconnected: ${socket.id}`);

    // Clean up room viewers
    for (const [roomId, viewers] of Array.from(roomViewers.entries())) {
      if (viewers.has(socket.id)) {
        viewers.delete(socket.id);
        io.to(`room:${roomId}`).emit('viewer:count', { count: viewers.size });
      }
    }

    // Clean up watch party members
    for (const [wpId, members] of Array.from(watchPartyMembers.entries())) {
      if (members.has(socket.id)) {
        members.delete(socket.id);
        io.to(`wp:${wpId}`).emit('watchparty:participant_leave', { userId });
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[WS] SeeWhy LIVE WebSocket server running on port ${PORT}`);
});
