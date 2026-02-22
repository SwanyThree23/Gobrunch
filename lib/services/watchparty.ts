import { v4 as uuidv4 } from 'uuid';
import type {
  WatchParty,
  WatchPartyCreatePayload,
  WatchPartyParticipant,
  WatchPartySyncEvent,
  WatchPartyStatus,
} from '@/types';
import { generateInviteCode } from '@/lib/utils';

// In-memory watch party store (replace with database in production)
const watchParties = new Map<string, WatchParty>();
const inviteCodeIndex = new Map<string, string>(); // inviteCode -> watchPartyId

/**
 * Create a new watch party.
 */
export function createWatchParty(hostId: string, payload: WatchPartyCreatePayload): WatchParty {
  const now = new Date().toISOString();
  const inviteCode = generateInviteCode();
  const roomId = uuidv4(); // Associated room

  const watchParty: WatchParty = {
    id: uuidv4(),
    roomId,
    hostId,
    title: payload.title,
    videoUrl: payload.videoUrl,
    videoSource: payload.videoSource,
    status: 'waiting',
    currentTime: 0,
    playbackRate: 1,
    participants: [
      {
        userId: hostId,
        joinedAt: now,
        isReady: true,
      },
    ],
    maxParticipants: payload.maxParticipants || 10,
    inviteCode,
    chatEnabled: payload.chatEnabled ?? true,
    aiAssistantEnabled: payload.aiAssistantEnabled ?? false,
    createdAt: now,
    updatedAt: now,
  };

  watchParties.set(watchParty.id, watchParty);
  inviteCodeIndex.set(inviteCode, watchParty.id);

  return watchParty;
}

/**
 * Get a watch party by ID.
 */
export function getWatchPartyById(id: string): WatchParty | null {
  return watchParties.get(id) ?? null;
}

/**
 * Get a watch party by invite code.
 */
export function getWatchPartyByInviteCode(code: string): WatchParty | null {
  const id = inviteCodeIndex.get(code.toUpperCase());
  if (!id) return null;
  return watchParties.get(id) ?? null;
}

/**
 * Join a watch party.
 */
export function joinWatchParty(watchPartyId: string, userId: string): WatchParty | null {
  const party = watchParties.get(watchPartyId);
  if (!party) return null;

  // Check if already joined
  if (party.participants.some((p) => p.userId === userId)) {
    return party;
  }

  // Check capacity
  if (party.participants.length >= party.maxParticipants) {
    throw new WatchPartyError('Watch party is full');
  }

  if (party.status === 'ended') {
    throw new WatchPartyError('Watch party has ended');
  }

  const participant: WatchPartyParticipant = {
    userId,
    joinedAt: new Date().toISOString(),
    isReady: false,
  };

  party.participants.push(participant);
  party.updatedAt = new Date().toISOString();

  return party;
}

/**
 * Leave a watch party.
 */
export function leaveWatchParty(watchPartyId: string, userId: string): WatchParty | null {
  const party = watchParties.get(watchPartyId);
  if (!party) return null;

  party.participants = party.participants.filter((p) => p.userId !== userId);
  party.updatedAt = new Date().toISOString();

  // If host leaves, end the party
  if (userId === party.hostId) {
    party.status = 'ended';
  }

  // If no participants left, end the party
  if (party.participants.length === 0) {
    party.status = 'ended';
  }

  return party;
}

/**
 * Handle a sync event (play, pause, seek, etc.).
 */
export function handleSyncEvent(
  watchPartyId: string,
  userId: string,
  event: WatchPartySyncEvent
): WatchParty | null {
  const party = watchParties.get(watchPartyId);
  if (!party) return null;

  // Only host can control playback (except ready/reaction)
  if (
    userId !== party.hostId &&
    event.type !== 'ready' &&
    event.type !== 'reaction'
  ) {
    throw new WatchPartyError('Only the host can control playback');
  }

  switch (event.type) {
    case 'play':
      party.status = 'playing';
      if (event.data.currentTime !== undefined) {
        party.currentTime = event.data.currentTime;
      }
      break;

    case 'pause':
      party.status = 'paused';
      if (event.data.currentTime !== undefined) {
        party.currentTime = event.data.currentTime;
      }
      break;

    case 'seek':
      if (event.data.currentTime !== undefined) {
        party.currentTime = event.data.currentTime;
      }
      break;

    case 'rate_change':
      if (event.data.playbackRate !== undefined) {
        party.playbackRate = event.data.playbackRate;
      }
      break;

    case 'ready': {
      const participant = party.participants.find((p) => p.userId === userId);
      if (participant) {
        participant.isReady = true;
      }
      break;
    }

    case 'reaction': {
      const reactor = party.participants.find((p) => p.userId === userId);
      if (reactor && event.data.reaction) {
        reactor.reaction = event.data.reaction;
        // Clear reaction after 3 seconds
        setTimeout(() => {
          if (reactor.reaction === event.data.reaction) {
            reactor.reaction = undefined;
          }
        }, 3000);
      }
      break;
    }
  }

  party.updatedAt = new Date().toISOString();
  return party;
}

/**
 * Update watch party status.
 */
export function updateWatchPartyStatus(
  id: string,
  hostId: string,
  status: WatchPartyStatus
): WatchParty | null {
  const party = watchParties.get(id);
  if (!party || party.hostId !== hostId) return null;

  party.status = status;
  party.updatedAt = new Date().toISOString();
  return party;
}

/**
 * List active watch parties for a user.
 */
export function listUserWatchParties(userId: string): WatchParty[] {
  return Array.from(watchParties.values()).filter(
    (p) =>
      p.status !== 'ended' &&
      p.participants.some((participant) => participant.userId === userId)
  );
}

/**
 * Check if all participants are ready.
 */
export function allParticipantsReady(watchPartyId: string): boolean {
  const party = watchParties.get(watchPartyId);
  if (!party) return false;
  return party.participants.every((p) => p.isReady);
}

/** Custom error class for watch party errors */
export class WatchPartyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WatchPartyError';
  }
}
