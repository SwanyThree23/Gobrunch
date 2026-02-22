import { describe, it, expect } from 'vitest';
import {
  createRoom,
  getRoomById,
  listRooms,
  updateRoom,
  deleteRoom,
  incrementViewers,
  decrementViewers,
} from '@/lib/services/rooms';

const HOST_ID = 'test-host-id';

describe('Room Service', () => {
  it('creates a room', () => {
    const room = createRoom(HOST_ID, {
      title: 'Test Room',
      description: 'A test room',
      visibility: 'public',
    });

    expect(room.id).toBeDefined();
    expect(room.title).toBe('Test Room');
    expect(room.hostId).toBe(HOST_ID);
    expect(room.status).toBe('live');
    expect(room.currentViewers).toBe(0);
  });

  it('gets a room by ID', () => {
    const room = createRoom(HOST_ID, { title: 'Get Room', description: '', visibility: 'public' });
    const found = getRoomById(room.id);
    expect(found).not.toBeNull();
    expect(found!.title).toBe('Get Room');
  });

  it('returns null for non-existent room', () => {
    expect(getRoomById('non-existent-id')).toBeNull();
  });

  it('lists rooms', () => {
    const result = listRooms({ hostId: HOST_ID });
    expect(result.rooms.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
  });

  it('updates a room', () => {
    const room = createRoom(HOST_ID, { title: 'Update Me', description: '', visibility: 'public' });
    const updated = updateRoom(room.id, HOST_ID, { title: 'Updated Title' });
    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('Updated Title');
  });

  it('rejects update from non-host', () => {
    const room = createRoom(HOST_ID, { title: 'No Update', description: '', visibility: 'public' });
    const result = updateRoom(room.id, 'other-user', { title: 'Hacked' });
    expect(result).toBeNull();
  });

  it('tracks status transitions', () => {
    const room = createRoom(HOST_ID, {
      title: 'Status Room',
      description: '',
      visibility: 'public',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(room.status).toBe('scheduled');

    const live = updateRoom(room.id, HOST_ID, { status: 'live' });
    expect(live!.status).toBe('live');
    expect(live!.startedAt).toBeDefined();

    const ended = updateRoom(room.id, HOST_ID, { status: 'ended' });
    expect(ended!.status).toBe('ended');
    expect(ended!.endedAt).toBeDefined();
  });

  it('deletes a room', () => {
    const room = createRoom(HOST_ID, { title: 'Delete Me', description: '', visibility: 'public' });
    const deleted = deleteRoom(room.id, HOST_ID);
    expect(deleted).toBe(true);
    expect(getRoomById(room.id)).toBeNull();
  });

  it('increments and decrements viewers', () => {
    const room = createRoom(HOST_ID, { title: 'Viewers', description: '', visibility: 'public' });
    expect(incrementViewers(room.id)).toBe(1);
    expect(incrementViewers(room.id)).toBe(2);
    expect(decrementViewers(room.id)).toBe(1);
    expect(decrementViewers(room.id)).toBe(0);
    expect(decrementViewers(room.id)).toBe(0); // Should not go below 0
  });
});
