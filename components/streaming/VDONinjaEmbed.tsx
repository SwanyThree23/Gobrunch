'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  Maximize2,
  Minimize2,
  Volume2,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface VDONinjaEmbedProps {
  iframeUrl: string;
  isHost?: boolean;
  className?: string;
  onStats?: (stats: Record<string, unknown>) => void;
}

interface IFrameMessage {
  action: string;
  value?: unknown;
  target?: string;
}

export function VDONinjaEmbed({ iframeUrl, isHost = false, className = '', onStats }: VDONinjaEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [connectionStats, setConnectionStats] = useState<Record<string, unknown> | null>(null);

  // Send a postMessage command to the VDO.Ninja iframe
  const sendCommand = useCallback((action: string, value?: unknown, target?: string) => {
    if (!iframeRef.current?.contentWindow) return;
    const msg: IFrameMessage = { action };
    if (value !== undefined) msg.value = value;
    if (target) msg.target = target;
    iframeRef.current.contentWindow.postMessage(msg, '*');
  }, []);

  // Listen for messages from the VDO.Ninja iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data?.action) return;

      switch (event.data.action) {
        case 'stats':
          setConnectionStats(event.data.value as Record<string, unknown>);
          onStats?.(event.data.value as Record<string, unknown>);
          break;
        case 'loudness':
          // Audio level data
          break;
        case 'guest-connected':
          // A guest connected
          break;
        case 'guest-disconnected':
          // A guest disconnected
          break;
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onStats]);

  // Toggle microphone
  function toggleMic() {
    sendCommand('toggleMic');
    setIsMuted(!isMuted);
  }

  // Toggle camera
  function toggleCamera() {
    sendCommand('toggleCamera');
    setIsVideoOff(!isVideoOff);
  }

  // Toggle fullscreen
  function toggleFullscreen() {
    if (!iframeRef.current) return;
    const container = iframeRef.current.parentElement;
    if (!container) return;

    if (!isFullscreen) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }

  // Request stats
  function requestStats() {
    sendCommand('getStats');
    setShowStats(!showStats);
  }

  // Set bitrate (host only)
  function setBitrate(bitrate: number) {
    sendCommand('bitrate', bitrate);
  }

  // Mute a specific guest (host/director only)
  function muteGuest(guestId: string) {
    sendCommand('mute', true, guestId);
  }

  // Change volume for a specific guest
  function setGuestVolume(guestId: string, volume: number) {
    sendCommand('volume', volume, guestId);
  }

  return (
    <div className={`relative bg-black rounded-xl overflow-hidden ${className}`}>
      {/* VDO.Ninja IFrame */}
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        className="w-full h-full border-0"
        allow="camera;microphone;display-capture;autoplay;clipboard-write"
        allowFullScreen
      />

      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {isHost && (
              <>
                <Button
                  variant={isMuted ? 'danger' : 'ghost'}
                  size="sm"
                  onClick={toggleMic}
                  className={isMuted ? '!bg-red-500/80 hover:!bg-red-500' : ''}
                >
                  {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                </Button>
                <Button
                  variant={isVideoOff ? 'danger' : 'ghost'}
                  size="sm"
                  onClick={toggleCamera}
                  className={isVideoOff ? '!bg-red-500/80 hover:!bg-red-500' : ''}
                >
                  {isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={requestStats}>
              <BarChart3 size={16} />
            </Button>
          </div>

          <div className="flex gap-2">
            {isHost && (
              <Button variant="ghost" size="sm" onClick={() => setBitrate(2500)}>
                <Settings size={16} />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </Button>
          </div>
        </div>

        {/* Stats overlay */}
        {showStats && connectionStats && (
          <div className="mt-3 p-3 rounded-lg bg-black/60 text-xs text-white/60 font-mono">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(connectionStats).slice(0, 8).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <span>{key}:</span>
                  <span className="text-white/80">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
