'use client';

import { useState } from 'react';
import {
  MessageSquare,
  ExternalLink,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface SocialStreamPanelProps {
  feedUrl: string;
  dockUrl: string;
  session: string;
  className?: string;
}

export function SocialStreamPanel({ feedUrl, dockUrl, session, className = '' }: SocialStreamPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-gold" />
          <span className="text-sm font-semibold">Social Chat</span>
          <Badge variant="default">Live</Badge>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title={ttsEnabled ? 'Disable TTS' : 'Enable TTS'}
          >
            {ttsEnabled ? <Volume2 size={14} className="text-gold" /> : <VolumeX size={14} className="text-white/40" />}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
          >
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <a
            href={feedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
          >
            <ExternalLink size={14} className="text-white/40" />
          </a>
        </div>
      </div>

      {/* Social Stream Iframe */}
      <div className={`flex-1 ${expanded ? 'min-h-[400px]' : 'min-h-[200px]'}`}>
        <iframe
          src={`${dockUrl}${ttsEnabled ? '&tts=1' : ''}`}
          className="w-full h-full border-0"
          allow="autoplay"
        />
      </div>
    </div>
  );
}
