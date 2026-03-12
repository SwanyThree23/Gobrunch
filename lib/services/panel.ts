/**
 * Advanced Streaming Layer - 20-Person Panel Grid
 * Spotlight Mode (Bigo-style), Virtual Camera, Screen Share
 */
import { v4 as uuidv4 } from 'uuid';
import type {
  StreamPanel,
  StreamPanelParticipant,
  PanelLayout,
  SpotlightEvent,
  VirtualSourceConfig,
  VerticalCinemaConfig,
} from '@/types';

// ---- In-memory panel store ----
const panels = new Map<string, StreamPanel>();
const MAX_PANEL_PARTICIPANTS = 20;

// ============================================================
// PANEL MANAGEMENT
// ============================================================

/**
 * Create a new stream panel for a room.
 */
export function createPanel(roomId: string, layout: PanelLayout = 'grid'): StreamPanel {
  const panel: StreamPanel = {
    id: uuidv4(),
    roomId,
    layout,
    maxParticipants: MAX_PANEL_PARTICIPANTS,
    participants: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  panels.set(roomId, panel);
  return panel;
}

/**
 * Get panel for a room, creating if it doesn't exist.
 */
export function getPanel(roomId: string): StreamPanel {
  let panel = panels.get(roomId);
  if (!panel) {
    panel = createPanel(roomId);
  }
  return panel;
}

/**
 * Add a participant to the panel grid (up to 20).
 */
export function addPanelParticipant(
  roomId: string,
  userId: string,
  role: StreamPanelParticipant['role'] = 'guest'
): StreamPanelParticipant | null {
  const panel = getPanel(roomId);

  if (panel.participants.length >= panel.maxParticipants) {
    return null; // Panel is full
  }

  // Check if user is already in the panel
  const existing = panel.participants.find(p => p.userId === userId);
  if (existing) return existing;

  const participant: StreamPanelParticipant = {
    id: uuidv4(),
    userId,
    streamId: `stream_${uuidv4().slice(0, 8)}`,
    role,
    audioEnabled: true,
    videoEnabled: true,
    screenSharing: false,
    virtualCamera: false,
    spotlighted: false,
    raisedHand: false,
    joinedAt: new Date().toISOString(),
  };

  panel.participants.push(participant);
  panel.updatedAt = new Date().toISOString();
  return participant;
}

/**
 * Remove a participant from the panel.
 */
export function removePanelParticipant(roomId: string, userId: string): boolean {
  const panel = panels.get(roomId);
  if (!panel) return false;

  const idx = panel.participants.findIndex(p => p.userId === userId);
  if (idx === -1) return false;

  // If removed user was spotlighted, clear spotlight
  if (panel.spotlightUserId === userId) {
    panel.spotlightUserId = undefined;
  }

  panel.participants.splice(idx, 1);
  panel.updatedAt = new Date().toISOString();
  return true;
}

// ============================================================
// SPOTLIGHT MODE (Bigo-style)
// Clicking a guest expands their panel to 70% while others reflow
// ============================================================

/**
 * Set spotlight on a participant (70% of screen, others become thumbnails).
 */
export function setSpotlight(roomId: string, userId: string, triggeredBy: string): SpotlightEvent | null {
  const panel = panels.get(roomId);
  if (!panel) return null;

  const participant = panel.participants.find(p => p.userId === userId);
  if (!participant) return null;

  // Clear previous spotlight
  panel.participants.forEach(p => { p.spotlighted = false; });

  participant.spotlighted = true;
  panel.spotlightUserId = userId;
  panel.layout = 'spotlight';
  panel.updatedAt = new Date().toISOString();

  return {
    type: 'spotlight',
    userId,
    triggeredBy,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Remove spotlight, returning to grid layout.
 */
export function clearSpotlight(roomId: string, triggeredBy: string): SpotlightEvent | null {
  const panel = panels.get(roomId);
  if (!panel || !panel.spotlightUserId) return null;

  const userId = panel.spotlightUserId;
  panel.participants.forEach(p => { p.spotlighted = false; });
  panel.spotlightUserId = undefined;
  panel.layout = 'grid';
  panel.updatedAt = new Date().toISOString();

  return {
    type: 'unspotlight',
    userId,
    triggeredBy,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Change panel layout.
 */
export function setPanelLayout(roomId: string, layout: PanelLayout): StreamPanel | null {
  const panel = panels.get(roomId);
  if (!panel) return null;

  panel.layout = layout;
  panel.updatedAt = new Date().toISOString();
  return panel;
}

// ============================================================
// PARTICIPANT CONTROLS
// ============================================================

/**
 * Toggle audio/video/screen share for a participant.
 */
export function updateParticipantMedia(
  roomId: string,
  userId: string,
  updates: Partial<Pick<StreamPanelParticipant, 'audioEnabled' | 'videoEnabled' | 'screenSharing' | 'virtualCamera' | 'raisedHand'>>
): StreamPanelParticipant | null {
  const panel = panels.get(roomId);
  if (!panel) return null;

  const participant = panel.participants.find(p => p.userId === userId);
  if (!participant) return null;

  Object.assign(participant, updates);
  panel.updatedAt = new Date().toISOString();
  return participant;
}

/**
 * Raise/lower hand for a participant.
 */
export function toggleRaisedHand(roomId: string, userId: string): boolean {
  const panel = panels.get(roomId);
  if (!panel) return false;

  const participant = panel.participants.find(p => p.userId === userId);
  if (!participant) return false;

  participant.raisedHand = !participant.raisedHand;
  return participant.raisedHand;
}

// ============================================================
// VIRTUAL SOURCE SUPPORT
// Browser-native getUserMedia() for Virtual Camera (OBS) and Screen Share
// ============================================================

/**
 * Get supported virtual source configurations for the client.
 */
export function getVirtualSourceOptions(): VirtualSourceConfig[] {
  return [
    {
      type: 'camera',
      label: 'Webcam',
      constraints: { width: 1920, height: 1080, frameRate: 30 },
    },
    {
      type: 'virtual-camera',
      label: 'Virtual Camera (OBS)',
      constraints: { width: 1920, height: 1080, frameRate: 30 },
    },
    {
      type: 'screen-share',
      label: 'Screen Share',
      constraints: { width: 1920, height: 1080, frameRate: 30 },
    },
    {
      type: 'screen-share-audio',
      label: 'Screen Share + Audio',
      constraints: { width: 1920, height: 1080, frameRate: 30, audioCaptureEnabled: true },
    },
  ];
}

// ============================================================
// VERTICAL CINEMA CONFIG
// Server-synced media player at top 50%, panel grid at bottom 50%
// ============================================================

const verticalCinemaConfigs = new Map<string, VerticalCinemaConfig>();

/**
 * Set up vertical cinema layout for a room.
 */
export function setVerticalCinema(roomId: string, config: Partial<VerticalCinemaConfig>): VerticalCinemaConfig {
  const vcConfig: VerticalCinemaConfig = {
    mediaPlayerHeight: config.mediaPlayerHeight ?? 50,
    panelGridHeight: config.panelGridHeight ?? 50,
    mediaSource: config.mediaSource ?? 'youtube',
    mediaUrl: config.mediaUrl ?? '',
    syncEnabled: config.syncEnabled ?? true,
  };

  verticalCinemaConfigs.set(roomId, vcConfig);

  // Also set the panel layout
  const panel = getPanel(roomId);
  panel.layout = 'vertical-cinema';
  panel.updatedAt = new Date().toISOString();

  return vcConfig;
}

/**
 * Get vertical cinema config for a room.
 */
export function getVerticalCinemaConfig(roomId: string): VerticalCinemaConfig | null {
  return verticalCinemaConfigs.get(roomId) ?? null;
}

/**
 * Calculate grid layout positions for N participants.
 * Returns CSS grid template for optimal arrangement.
 */
export function calculateGridLayout(participantCount: number, layout: PanelLayout): {
  gridTemplate: string;
  spotlightSize: string;
  thumbnailSize: string;
} {
  if (layout === 'spotlight') {
    return {
      gridTemplate: 'grid-cols-4 grid-rows-auto',
      spotlightSize: '70%',
      thumbnailSize: '25%',
    };
  }

  // Auto-calculate grid based on participant count
  if (participantCount <= 1) {
    return { gridTemplate: 'grid-cols-1', spotlightSize: '100%', thumbnailSize: '100%' };
  }
  if (participantCount <= 4) {
    return { gridTemplate: 'grid-cols-2 grid-rows-2', spotlightSize: '50%', thumbnailSize: '50%' };
  }
  if (participantCount <= 9) {
    return { gridTemplate: 'grid-cols-3 grid-rows-3', spotlightSize: '33%', thumbnailSize: '33%' };
  }
  if (participantCount <= 16) {
    return { gridTemplate: 'grid-cols-4 grid-rows-4', spotlightSize: '25%', thumbnailSize: '25%' };
  }
  // 17-20 participants
  return { gridTemplate: 'grid-cols-5 grid-rows-4', spotlightSize: '20%', thumbnailSize: '20%' };
}
