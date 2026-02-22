import { v4 as uuidv4 } from 'uuid';
import type { Room, RoomCreatePayload, RoomUpdatePayload, RoomStatus } from '@/types';

// In-memory room store (replace with database in production)
const rooms = new Map<string, Room>();

/**
 * Create a new room.
 */
export function createRoom(hostId: string, payload: RoomCreatePayload): Room {
  const now = new Date().toISOString();

  const room: Room = {
    id: uuidv4(),
    title: payload.title,
    description: payload.description || '',
    hostId,
    status: payload.scheduledAt ? 'scheduled' : 'live',
    visibility: payload.visibility || 'public',
    maxViewers: payload.maxViewers || 1000,
    currentViewers: 0,
    scheduledAt: payload.scheduledAt,
    tags: payload.tags || [],
    chatEnabled: payload.chatEnabled ?? true,
    recordingEnabled: payload.recordingEnabled ?? false,
    createdAt: now,
    updatedAt: now,
  };

  rooms.set(room.id, room);
  return room;
}

/**
 * Get a room by ID.
 */
export function getRoomById(id: string): Room | null {
  return rooms.get(id) ?? null;
}

/**
 * List rooms with optional filters.
 */
export function listRooms(options: {
  status?: RoomStatus;
  hostId?: string;
  visibility?: string;
  page?: number;
  pageSize?: number;
} = {}): { rooms: Room[]; total: number } {
  const { status, hostId, visibility, page = 1, pageSize = 20 } = options;

  let filtered = Array.from(rooms.values());

  if (status) filtered = filtered.filter((r) => r.status === status);
  if (hostId) filtered = filtered.filter((r) => r.hostId === hostId);
  if (visibility) filtered = filtered.filter((r) => r.visibility === visibility);

  // Sort by creation date descending
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return { rooms: paginated, total };
}

/**
 * Update a room.
 */
export function updateRoom(id: string, hostId: string, payload: RoomUpdatePayload): Room | null {
  const room = rooms.get(id);
  if (!room || room.hostId !== hostId) return null;

  const updated: Room = {
    ...room,
    ...payload,
    tags: payload.tags ?? room.tags,
    updatedAt: new Date().toISOString(),
  };

  // Track status transitions
  if (payload.status === 'live' && room.status !== 'live') {
    updated.startedAt = new Date().toISOString();
  }
  if (payload.status === 'ended' && room.status === 'live') {
    updated.endedAt = new Date().toISOString();
  }

  rooms.set(id, updated);
  return updated;
}

/**
 * Delete a room.
 */
export function deleteRoom(id: string, hostId: string): boolean {
  const room = rooms.get(id);
  if (!room || room.hostId !== hostId) return false;
  return rooms.delete(id);
}

/**
 * Increment viewer count for a room.
 */
export function incrementViewers(id: string): number {
  const room = rooms.get(id);
  if (!room) return 0;
  room.currentViewers += 1;
  return room.currentViewers;
}

/**
 * Decrement viewer count for a room.
 */
export function decrementViewers(id: string): number {
  const room = rooms.get(id);
  if (!room) return 0;
  room.currentViewers = Math.max(0, room.currentViewers - 1);
  return room.currentViewers;
}

/**
 * Get public live rooms for the browse/discovery page.
 */
export function getPublicLiveRooms(): Room[] {
  return Array.from(rooms.values())
    .filter((r) => r.status === 'live' && r.visibility === 'public')
    .sort((a, b) => b.currentViewers - a.currentViewers);
}

/**
 * Seed initial demo rooms for development.
 */
export function seedDemoRooms(hostId: string): void {
  const demoRooms: RoomCreatePayload[] = [
    {
      title: 'Tech Talk: Building Real-time Apps',
      description: 'Deep dive into WebSocket architecture and real-time communication patterns.',
      visibility: 'public',
      tags: ['tech', 'webdev', 'tutorial'],
      chatEnabled: true,
    },
    {
      title: 'Music Production Workshop',
      description: 'Live music production session using modern DAW tools.',
      visibility: 'public',
      tags: ['music', 'production', 'workshop'],
      chatEnabled: true,
    },
    {
      title: 'Game Night: Community Play',
      description: 'Join us for a fun community gaming session!',
      visibility: 'public',
      tags: ['gaming', 'community', 'fun'],
      chatEnabled: true,
    },
  ];

  for (const payload of demoRooms) {
    createRoom(hostId, payload);
  }
}
