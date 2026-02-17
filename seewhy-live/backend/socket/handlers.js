const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function setupSocketHandlers(io) {
  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    // Join a room
    socket.on('room:join', (roomId) => {
      socket.join(`room:${roomId}`);
      socket.to(`room:${roomId}`).emit('room:user-joined', {
        userId: socket.user.id,
        username: socket.user.username,
      });
    });

    // Leave a room
    socket.on('room:leave', (roomId) => {
      socket.leave(`room:${roomId}`);
      socket.to(`room:${roomId}`).emit('room:user-left', {
        userId: socket.user.id,
        username: socket.user.username,
      });
    });

    // WebRTC signaling - offer
    socket.on('room:offer', ({ roomId, targetUserId, offer }) => {
      io.to(`room:${roomId}`).emit('room:offer', {
        fromUserId: socket.user.id,
        targetUserId,
        offer,
      });
    });

    // WebRTC signaling - answer
    socket.on('room:answer', ({ roomId, targetUserId, answer }) => {
      io.to(`room:${roomId}`).emit('room:answer', {
        fromUserId: socket.user.id,
        targetUserId,
        answer,
      });
    });

    // WebRTC signaling - ICE candidate
    socket.on('room:ice-candidate', ({ roomId, targetUserId, candidate }) => {
      io.to(`room:${roomId}`).emit('room:ice-candidate', {
        fromUserId: socket.user.id,
        targetUserId,
        candidate,
      });
    });

    // Toggle mute
    socket.on('room:toggle-mute', ({ roomId, isMuted }) => {
      socket.to(`room:${roomId}`).emit('room:user-mute-changed', {
        userId: socket.user.id,
        isMuted,
      });
    });

    // Toggle video
    socket.on('room:toggle-video', ({ roomId, isVideoOff }) => {
      socket.to(`room:${roomId}`).emit('room:user-video-changed', {
        userId: socket.user.id,
        isVideoOff,
      });
    });

    // Room chat message
    socket.on('room:chat', ({ roomId, message }) => {
      io.to(`room:${roomId}`).emit('room:chat', {
        userId: socket.user.id,
        username: socket.user.username,
        message,
        timestamp: new Date().toISOString(),
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });
}

module.exports = { setupSocketHandlers };
