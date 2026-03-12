'use client';

/**
 * VerticalCinema - Server-synced media player (top 50%) + panel grid (bottom 50%)
 * Supports YouTube, Vimeo, RTMP, and direct video sources
 */
import { useState } from 'react';
import type { VerticalCinemaConfig } from '@/types';

interface VerticalCinemaProps {
  config: VerticalCinemaConfig;
  roomId: string;
  isHost: boolean;
  children: React.ReactNode; // Panel grid goes here
  onConfigChange: (config: Partial<VerticalCinemaConfig>) => void;
}

export function VerticalCinema({
  config,
  roomId,
  isHost,
  children,
  onConfigChange,
}: VerticalCinemaProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const getEmbedUrl = (): string => {
    const url = config.mediaUrl;
    if (!url) return '';

    switch (config.mediaSource) {
      case 'youtube': {
        const videoId = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
        return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1` : '';
      }
      case 'vimeo': {
        const vimeoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
        return vimeoId ? `https://player.vimeo.com/video/${vimeoId}?autoplay=1` : '';
      }
      default:
        return url;
    }
  };

  const embedUrl = getEmbedUrl();

  return (
    <div className="flex flex-col h-full">
      {/* Media Player - Top section */}
      <div
        className="relative bg-black border-b border-white/10"
        style={{ height: `${config.mediaPlayerHeight}%` }}
      >
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-gray-900 to-black">
            <div className="text-6xl">🎬</div>
            <h3 className="text-lg font-semibold text-white/80">Vertical Cinema Mode</h3>
            <p className="text-sm text-white/40">No media source configured</p>
            {isHost && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste YouTube, Vimeo, or video URL..."
                  className="input-field w-80 text-sm"
                  onChange={(e) => {
                    const url = e.target.value;
                    let source: VerticalCinemaConfig['mediaSource'] = 'custom';
                    if (url.includes('youtube.com') || url.includes('youtu.be')) source = 'youtube';
                    else if (url.includes('vimeo.com')) source = 'vimeo';
                    else if (url.startsWith('rtmp://')) source = 'rtmp';
                    onConfigChange({ mediaUrl: url, mediaSource: source });
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Sync Status Badge */}
        {config.syncEnabled && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              SYNCED
            </span>
          </div>
        )}

        {/* Playback Controls (Host only) */}
        {isHost && embedUrl && (
          <div className="absolute bottom-2 left-2 flex gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1 text-xs bg-black/60 hover:bg-black/80 text-white rounded transition-colors"
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
          </div>
        )}
      </div>

      {/* Panel Grid - Bottom section */}
      <div
        className="flex-1 overflow-hidden"
        style={{ height: `${config.panelGridHeight}%` }}
      >
        {children}
      </div>
    </div>
  );
}

export default VerticalCinema;
