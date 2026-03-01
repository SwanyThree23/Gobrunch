'use client';

import { useState } from 'react';
import { Subtitles, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CaptionOverlayProps {
  senderUrl: string;
  displayUrl: string;
  isHost?: boolean;
  className?: string;
}

export function CaptionOverlay({ senderUrl, displayUrl, isHost = false, className = '' }: CaptionOverlayProps) {
  const [showCaptions, setShowCaptions] = useState(true);
  const [fontSize, setFontSize] = useState(24);

  const displayUrlWithSize = `${displayUrl}&fontsize=${fontSize}`;

  return (
    <div className={`relative ${className}`}>
      {/* Caption display iframe */}
      {showCaptions && (
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10">
          <iframe
            src={displayUrlWithSize}
            className="w-full h-24 border-0 bg-transparent"
            allow="autoplay"
          />
        </div>
      )}

      {/* Control bar */}
      <div className="flex items-center gap-2">
        <Button
          variant={showCaptions ? 'gold' : 'ghost'}
          size="sm"
          onClick={() => setShowCaptions(!showCaptions)}
        >
          <Subtitles size={14} />
          {showCaptions ? 'CC On' : 'CC Off'}
        </Button>

        {showCaptions && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize(Math.max(14, fontSize - 2))}
              className="px-2 py-1 text-xs bg-white/10 rounded hover:bg-white/20 transition-colors"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize(Math.min(40, fontSize + 2))}
              className="px-2 py-1 text-xs bg-white/10 rounded hover:bg-white/20 transition-colors"
            >
              A+
            </button>
          </div>
        )}

        {isHost && (
          <a
            href={senderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            <ExternalLink size={12} />
            Caption Source
          </a>
        )}
      </div>
    </div>
  );
}
