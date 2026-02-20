import { describe, it, expect } from 'vitest';
import {
  createWatchParty,
  getWatchPartyById,
  getWatchPartyByInviteCode,
  joinWatchParty,
  leaveWatchParty,
  handleSyncEvent,
  allParticipantsReady,
  WatchPartyError,
} from '@/lib/services/watchparty';

const HOST_ID = 'wp-host-id';
const USER_ID = 'wp-user-id';

describe('WatchParty Service', () => {
  it('creates a watch party', () => {
    const party = createWatchParty(HOST_ID, {
      title: 'Test Watch Party',
      videoUrl: 'https://youtube.com/watch?v=test123',
      videoSource: 'youtube',
    });

    expect(party.id).toBeDefined();
    expect(party.title).toBe('Test Watch Party');
    expect(party.hostId).toBe(HOST_ID);
    expect(party.status).toBe('waiting');
    expect(party.inviteCode).toHaveLength(8);
    expect(party.participants).toHaveLength(1);
    expect(party.participants[0].userId).toBe(HOST_ID);
  });

  it('gets a watch party by ID', () => {
    const party = createWatchParty(HOST_ID, {
      title: 'Find Me',
      videoUrl: 'https://youtube.com/watch?v=find',
      videoSource: 'youtube',
    });

    const found = getWatchPartyById(party.id);
    expect(found).not.toBeNull();
    expect(found!.title).toBe('Find Me');
  });

  it('gets a watch party by invite code', () => {
    const party = createWatchParty(HOST_ID, {
      title: 'Code Party',
      videoUrl: 'https://youtube.com/watch?v=code',
      videoSource: 'youtube',
    });

    const found = getWatchPartyByInviteCode(party.inviteCode);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(party.id);
  });

  it('allows users to join', () => {
    const party = createWatchParty(HOST_ID, {
      title: 'Join Party',
      videoUrl: 'https://youtube.com/watch?v=join',
      videoSource: 'youtube',
    });

    const updated = joinWatchParty(party.id, USER_ID);
    expect(updated!.participants).toHaveLength(2);
  });

  it('prevents duplicate joins', () => {
    const party = createWatchParty(HOST_ID, {
      title: 'Dup Join',
      videoUrl: 'https://youtube.com/watch?v=dup',
      videoSource: 'youtube',
    });

    joinWatchParty(party.id, USER_ID);
    const again = joinWatchParty(party.id, USER_ID);
    expect(again!.participants).toHaveLength(2); // Still 2, not 3
  });

  it('enforces max participants', () => {
    const party = createWatchParty(HOST_ID, {
      title: 'Full Party',
      videoUrl: 'https://youtube.com/watch?v=full',
      videoSource: 'youtube',
      maxParticipants: 2,
    });

    joinWatchParty(party.id, 'user-2');
    expect(() => joinWatchParty(party.id, 'user-3')).toThrow(WatchPartyError);
  });

  it('allows users to leave', () => {
    const party = createWatchParty(HOST_ID, {
      title: 'Leave Party',
      videoUrl: 'https://youtube.com/watch?v=leave',
      videoSource: 'youtube',
    });

    joinWatchParty(party.id, USER_ID);
    const updated = leaveWatchParty(party.id, USER_ID);
    expect(updated!.participants).toHaveLength(1);
  });

  it('ends party when host leaves', () => {
    const party = createWatchParty(HOST_ID, {
      title: 'Host Leaves',
      videoUrl: 'https://youtube.com/watch?v=hostleave',
      videoSource: 'youtube',
    });

    const updated = leaveWatchParty(party.id, HOST_ID);
    expect(updated!.status).toBe('ended');
  });

  it('handles play sync event', () => {
    const party = createWatchParty(HOST_ID, {
      title: 'Sync Party',
      videoUrl: 'https://youtube.com/watch?v=sync',
      videoSource: 'youtube',
    });

    const result = handleSyncEvent(party.id, HOST_ID, {
      type: 'play',
      timestamp: Date.now(),
      userId: HOST_ID,
      data: { currentTime: 120 },
    });

    expect(result!.status).toBe('playing');
    expect(result!.currentTime).toBe(120);
  });

  it('handles pause sync event', () => {
    const party = createWatchParty(HOST_ID, {
      title: 'Pause Party',
      videoUrl: 'https://youtube.com/watch?v=pause',
      videoSource: 'youtube',
    });

    handleSyncEvent(party.id, HOST_ID, {
      type: 'play',
      timestamp: Date.now(),
      userId: HOST_ID,
      data: { currentTime: 60 },
    });

    const result = handleSyncEvent(party.id, HOST_ID, {
      type: 'pause',
      timestamp: Date.now(),
      userId: HOST_ID,
      data: { currentTime: 90 },
    });

    expect(result!.status).toBe('paused');
    expect(result!.currentTime).toBe(90);
  });

  it('rejects non-host playback control', () => {
    const party = createWatchParty(HOST_ID, {
      title: 'Auth Party',
      videoUrl: 'https://youtube.com/watch?v=auth',
      videoSource: 'youtube',
    });

    joinWatchParty(party.id, USER_ID);

    expect(() =>
      handleSyncEvent(party.id, USER_ID, {
        type: 'play',
        timestamp: Date.now(),
        userId: USER_ID,
        data: { currentTime: 0 },
      })
    ).toThrow(WatchPartyError);
  });

  it('allows non-host ready and reaction events', () => {
    const party = createWatchParty(HOST_ID, {
      title: 'Ready Party',
      videoUrl: 'https://youtube.com/watch?v=ready',
      videoSource: 'youtube',
    });

    joinWatchParty(party.id, USER_ID);

    const result = handleSyncEvent(party.id, USER_ID, {
      type: 'ready',
      timestamp: Date.now(),
      userId: USER_ID,
      data: {},
    });

    const userParticipant = result!.participants.find((p) => p.userId === USER_ID);
    expect(userParticipant!.isReady).toBe(true);
  });

  it('checks all participants ready', () => {
    const party = createWatchParty(HOST_ID, {
      title: 'All Ready',
      videoUrl: 'https://youtube.com/watch?v=allready',
      videoSource: 'youtube',
    });

    joinWatchParty(party.id, USER_ID);
    expect(allParticipantsReady(party.id)).toBe(false);

    handleSyncEvent(party.id, USER_ID, {
      type: 'ready',
      timestamp: Date.now(),
      userId: USER_ID,
      data: {},
    });

    expect(allParticipantsReady(party.id)).toBe(true);
  });
});
