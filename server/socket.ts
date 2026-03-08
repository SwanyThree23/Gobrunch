import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { calculateElo } from '../lib/domino';

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

const httpServer = createServer();
export const io = new Server(httpServer, { cors: { origin: '*' } });

interface GameState {
    roomId: string;
    players: string[]; // socket ids or profile ids
    board: any[];
    hands: Record<string, any[]>;
    currentTurn: string;
}

io.on('connection', socket => {
    console.log('socket connected', socket.id);

    socket.on('joinRoom', async ({ roomId, profileId }) => {
        socket.join(roomId);
        // load or create state
        let state: GameState | null = null;
        const stored = await redisClient.get(`domino:${roomId}`);
        if (stored) state = JSON.parse(stored);
        if (!state) {
            state = {
                roomId,
                players: [],
                board: [],
                hands: {},
                currentTurn: ''
            };
        }
        if (!state.players.includes(profileId)) state.players.push(profileId);
        await redisClient.set(`domino:${roomId}`, JSON.stringify(state));
        io.to(roomId).emit('stateUpdate', state);
    });

    socket.on('makeMove', async ({ roomId, profileId, move }) => {
        const stored = await redisClient.get(`domino:${roomId}`);
        if (!stored) return;
        const state: GameState = JSON.parse(stored);
        // apply move
        state.board = [...state.board, move];
        // rotate turn
        const idx = state.players.indexOf(profileId);
        state.currentTurn = state.players[(idx + 1) % state.players.length];
        await redisClient.set(`domino:${roomId}`, JSON.stringify(state));
        io.to(roomId).emit('stateUpdate', state);
    });

    socket.on('gameEnd', async ({ roomId, winnerId, loserId }) => {
        // compute elo changes, pay out via stripe
        const stored = await redisClient.get(`domino:${roomId}`);
        if (!stored) return;
        const state: GameState = JSON.parse(stored);
        // simple elo update
        const winnerRating = 1500;
        const loserRating = 1500;
        const { newA, newB } = calculateElo(winnerRating, loserRating);
        // broadcast end
        io.to(roomId).emit('gameOver', { winnerId, newRating: newA });
        // cleanup
        await redisClient.del(`domino:${roomId}`);
    });
});

const PORT = process.env.SOCKET_PORT ? parseInt(process.env.SOCKET_PORT, 10) : 4000;
httpServer.listen(PORT, () => {
    console.log('Socket server listening on', PORT);
});