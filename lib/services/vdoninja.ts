import type { VDONinjaConfig, VDONinjaRole, VDONinjaRoom, VDONinjaCommand } from '@/types';

const VDO_NINJA_BASE = 'https://vdo.ninja';
const VDO_API_BASE = 'https://api.vdo.ninja';
const MESHCAST_BASE = 'https://meshcast.io';
const SOCIAL_STREAM_BASE = 'https://socialstream.ninja';
const CAPTION_NINJA_BASE = 'https://caption.ninja';

// ---- URL Parameter Builder ----

/**
 * Build a VDO.Ninja URL with the given config parameters.
 * This is the core URL routing engine.
 */
export function buildVDONinjaUrl(config: VDONinjaConfig, role: VDONinjaRole): string {
  const params = new URLSearchParams();

  // Room configuration
  params.set('room', config.roomId);

  if (config.password) {
    params.set('password', config.password);
  }

  // Role-specific parameters
  switch (role) {
    case 'director':
      params.set('director', config.roomId);
      break;
    case 'publisher':
      if (config.pushId) params.set('push', config.pushId);
      break;
    case 'viewer':
      if (config.viewId) params.set('view', config.viewId);
      break;
  }

  // Quality settings
  if (config.quality !== undefined) {
    params.set('quality', String(config.quality));
  }
  if (config.bitrate !== undefined) {
    params.set('bitrate', String(config.bitrate));
  }
  if (config.audiobitrate !== undefined) {
    params.set('audiobitrate', String(config.audiobitrate));
  }

  // Audio configuration
  if (config.stereo) params.set('stereo', '1');
  if (config.proaudio) params.set('proaudio', '1');

  // Scalability: use Meshcast for large audiences
  if (config.meshcast) params.set('meshcast', '1');

  // Display customization
  if (config.label) params.set('label', config.label);
  if (config.transparent) params.set('transparent', '1');

  return `${VDO_NINJA_BASE}/?${params.toString()}`;
}

/**
 * Build an IFrame-compatible URL for embedding VDO.Ninja.
 */
export function buildIFrameUrl(config: VDONinjaConfig, role: VDONinjaRole): string {
  const baseUrl = buildVDONinjaUrl(config, role);
  // Add iframe-specific parameters
  const url = new URL(baseUrl);
  url.searchParams.set('cleanoutput', '1'); // Clean output for iframes
  url.searchParams.set('noheader', '1'); // Remove header
  return url.toString();
}

/**
 * Generate a complete VDO.Ninja room setup with all role URLs.
 */
export function createVDONinjaRoom(params: {
  roomName: string;
  password?: string;
  meshcast?: boolean;
  apiKey?: string;
}): VDONinjaRoom & { urls: { director: string; publisher: string; viewer: string } } {
  const config: VDONinjaConfig = {
    roomId: params.roomName,
    password: params.password,
    meshcast: params.meshcast,
    proaudio: true,
    quality: 2, // 1080p
  };

  const directorUrl = buildVDONinjaUrl(config, 'director');
  const publisherUrl = buildVDONinjaUrl({ ...config, pushId: `host_${params.roomName}` }, 'publisher');
  const viewerUrl = buildIFrameUrl(config, 'viewer');

  let apiUrl = directorUrl;
  if (params.apiKey) {
    const url = new URL(directorUrl);
    url.searchParams.set('api', params.apiKey);
    apiUrl = url.toString();
  }

  return {
    roomName: params.roomName,
    apiKey: params.apiKey,
    role: 'director',
    config,
    iframeUrl: viewerUrl,
    urls: {
      director: apiUrl,
      publisher: publisherUrl,
      viewer: viewerUrl,
    },
  };
}

// ---- HTTP API Control ----

/**
 * Send a command to a VDO.Ninja room via the HTTP API.
 * Requires an API key set on the director URL (&api=KEY).
 */
export async function sendVDOCommand(
  apiKey: string,
  command: VDONinjaCommand
): Promise<boolean> {
  try {
    const url = `${VDO_API_BASE}/${apiKey}/${command.action}${command.value !== undefined ? `/${command.value}` : ''}`;
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Mute/unmute a specific guest in a VDO.Ninja room.
 */
export async function muteGuest(apiKey: string, guestId: string, mute: boolean): Promise<boolean> {
  return sendVDOCommand(apiKey, {
    action: mute ? 'mute' : 'unmute',
    target: guestId,
  });
}

/**
 * Toggle a guest's video on/off.
 */
export async function toggleGuestVideo(apiKey: string, guestId: string, hide: boolean): Promise<boolean> {
  return sendVDOCommand(apiKey, {
    action: hide ? 'hideVideo' : 'showVideo',
    target: guestId,
  });
}

/**
 * Change the scene/layout in a VDO.Ninja room.
 */
export async function changeScene(apiKey: string, sceneId: number): Promise<boolean> {
  return sendVDOCommand(apiKey, {
    action: 'scene',
    value: sceneId,
  });
}

// ---- IFrame postMessage Communication ----

/**
 * Generate the JavaScript code for postMessage communication with VDO.Ninja iframe.
 * This is used client-side to control the embedded VDO.Ninja instance.
 */
export function getPostMessageScript(): string {
  return `
    // VDO.Ninja IFrame Control API
    const VDONinja = {
      iframe: null,

      init(iframeElement) {
        this.iframe = iframeElement;
        window.addEventListener('message', this._handleMessage.bind(this));
      },

      send(action, value, target) {
        if (!this.iframe?.contentWindow) return;
        const msg = { action, value, target };
        this.iframe.contentWindow.postMessage(msg, '*');
      },

      mute(target) { this.send('mute', true, target); },
      unmute(target) { this.send('mute', false, target); },
      toggleMic(target) { this.send('toggleMic', null, target); },
      toggleCamera(target) { this.send('toggleCamera', null, target); },
      setBitrate(value) { this.send('bitrate', value); },
      getStats() { this.send('getStats'); },
      hangup(target) { this.send('hangup', null, target); },
      changeVolume(target, volume) { this.send('volume', volume, target); },

      _listeners: {},
      on(event, callback) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(callback);
      },

      _handleMessage(event) {
        if (!event.data?.action) return;
        const { action, value, target } = event.data;
        const listeners = this._listeners[action] || [];
        listeners.forEach(cb => cb({ action, value, target }));
      },

      destroy() {
        window.removeEventListener('message', this._handleMessage);
        this.iframe = null;
        this._listeners = {};
      }
    };
  `;
}

// ---- Meshcast Integration ----

/**
 * Build a Meshcast URL for distributing a VDO.Ninja stream to large audiences.
 * Meshcast acts as a server relay, offloading P2P distribution.
 */
export function buildMeshcastUrl(streamId: string): string {
  return `${MESHCAST_BASE}/?view=${streamId}`;
}

/**
 * Build a VDO.Ninja URL with Meshcast enabled for scalable broadcasting.
 */
export function buildScalableBroadcastUrl(config: VDONinjaConfig): {
  publisherUrl: string;
  viewerUrl: string;
} {
  const publisherConfig = { ...config, meshcast: true };
  return {
    publisherUrl: buildVDONinjaUrl(publisherConfig, 'publisher'),
    viewerUrl: buildIFrameUrl(publisherConfig, 'viewer'),
  };
}

// ---- Social Stream Ninja Integration ----

/**
 * Build a Social Stream Ninja URL for consolidating chat from multiple platforms.
 */
export function buildSocialStreamUrl(params: {
  session: string;
  platforms?: string[];
  overlayMode?: boolean;
}): string {
  const url = new URL(`${SOCIAL_STREAM_BASE}/`);
  url.searchParams.set('session', params.session);
  if (params.overlayMode) url.searchParams.set('overlay', '1');
  return url.toString();
}

/**
 * Build the Social Stream dock/featured chat overlay URL for OBS or embedded use.
 */
export function buildSocialStreamDockUrl(session: string): string {
  return `${SOCIAL_STREAM_BASE}/dock.html?session=${session}`;
}

// ---- Caption.Ninja Integration ----

/**
 * Build a Caption.Ninja URL for real-time captions.
 */
export function buildCaptionUrl(params: {
  room?: string;
  language?: string;
  fontSize?: number;
}): { senderUrl: string; displayUrl: string } {
  const room = params.room || `sw_${Date.now()}`;

  const senderUrl = new URL(`${CAPTION_NINJA_BASE}/`);
  senderUrl.searchParams.set('room', room);
  if (params.language) senderUrl.searchParams.set('lang', params.language);

  const displayUrl = new URL(`${CAPTION_NINJA_BASE}/overlay`);
  displayUrl.searchParams.set('room', room);
  if (params.fontSize) displayUrl.searchParams.set('fontsize', String(params.fontSize));

  return {
    senderUrl: senderUrl.toString(),
    displayUrl: displayUrl.toString(),
  };
}

// ---- Room Configuration Helper ----

/**
 * Generate a complete streaming toolkit for a room.
 * Includes VDO.Ninja URLs, Social Stream, and Caption.Ninja.
 */
export function generateStreamingToolkit(params: {
  roomId: string;
  roomName: string;
  hostName: string;
  password?: string;
  enableMeshcast?: boolean;
  enableCaptions?: boolean;
  enableSocialStream?: boolean;
  socialPlatforms?: string[];
}) {
  const vdoRoom = createVDONinjaRoom({
    roomName: `sw_${params.roomId.slice(0, 8)}`,
    password: params.password,
    meshcast: params.enableMeshcast,
  });

  const toolkit: Record<string, unknown> = {
    vdoninja: vdoRoom,
  };

  if (params.enableSocialStream) {
    const socialSession = `sw_chat_${params.roomId.slice(0, 8)}`;
    toolkit.socialStream = {
      feedUrl: buildSocialStreamUrl({
        session: socialSession,
        platforms: params.socialPlatforms,
      }),
      dockUrl: buildSocialStreamDockUrl(socialSession),
      session: socialSession,
    };
  }

  if (params.enableCaptions) {
    toolkit.captions = buildCaptionUrl({
      room: `sw_cap_${params.roomId.slice(0, 8)}`,
    });
  }

  return toolkit;
}
