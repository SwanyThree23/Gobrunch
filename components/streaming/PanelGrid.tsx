'use client';

/**
 * PanelGrid - 20-Person Interactive Panel Grid with Spotlight Mode
 * Supports grid, spotlight (Bigo-style 70%), vertical-cinema, and sidebar layouts
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StreamPanel, StreamPanelParticipant, PanelLayout } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

interface PanelGridProps {
  panel: StreamPanel;
  currentUserId: string;
  isHost: boolean;
  onSpotlight: (userId: string) => void;
  onClearSpotlight: () => void;
  onLayoutChange: (layout: PanelLayout) => void;
  onToggleMedia: (userId: string, updates: Partial<Pick<StreamPanelParticipant, 'audioEnabled' | 'videoEnabled' | 'screenSharing'>>) => void;
  onRaiseHand: () => void;
}

export function PanelGrid({
  panel,
  currentUserId,
  isHost,
  onSpotlight,
  onClearSpotlight,
  onLayoutChange,
  onToggleMedia,
  onRaiseHand,
}: PanelGridProps) {
  const [hoveredParticipant, setHoveredParticipant] = useState<string | null>(null);

  const getGridClass = useCallback(() => {
    const count = panel.participants.length;
    if (panel.layout === 'spotlight' && panel.spotlightUserId) {
      return 'grid-cols-1'; // Spotlight handled separately
    }
    if (count <= 1) return 'grid-cols-1';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    if (count <= 16) return 'grid-cols-4';
    return 'grid-cols-5';
  }, [panel.participants.length, panel.layout, panel.spotlightUserId]);

  const spotlighted = panel.participants.find(p => p.userId === panel.spotlightUserId);
  const others = panel.participants.filter(p => p.userId !== panel.spotlightUserId);

  return (
    <div className="flex flex-col h-full">
      {/* Layout Controls */}
      <div className="flex items-center gap-2 p-2 border-b border-white/10">
        <span className="text-xs text-white/50">Layout:</span>
        {(['grid', 'spotlight', 'vertical-cinema', 'sidebar'] as PanelLayout[]).map(layout => (
          <button
            key={layout}
            onClick={() => onLayoutChange(layout)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              panel.layout === layout
                ? 'bg-gold/20 text-gold border border-gold/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {layout === 'vertical-cinema' ? 'Cinema' : layout.charAt(0).toUpperCase() + layout.slice(1)}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="default">
            {panel.participants.length}/{panel.maxParticipants}
          </Badge>
          {!isHost && (
            <button
              onClick={onRaiseHand}
              className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded transition-colors"
              title="Raise Hand"
            >
              ✋
            </button>
          )}
        </div>
      </div>

      {/* Panel Grid */}
      <div className="flex-1 overflow-hidden">
        {panel.layout === 'spotlight' && spotlighted ? (
          /* SPOTLIGHT MODE: 70% main + thumbnails */
          <div className="h-full flex flex-col">
            {/* Spotlighted participant - 70% */}
            <div className="flex-[7] p-1">
              <ParticipantTile
                participant={spotlighted}
                isSpotlighted
                isCurrentUser={spotlighted.userId === currentUserId}
                isHost={isHost}
                hovered={hoveredParticipant === spotlighted.userId}
                onMouseEnter={() => setHoveredParticipant(spotlighted.userId)}
                onMouseLeave={() => setHoveredParticipant(null)}
                onSpotlight={() => onClearSpotlight()}
                onToggleMedia={onToggleMedia}
              />
            </div>
            {/* Others - 30% in horizontal scroll */}
            <div className="flex-[3] flex gap-1 p-1 overflow-x-auto">
              {others.map(p => (
                <div key={p.id} className="min-w-[120px] flex-shrink-0 h-full">
                  <ParticipantTile
                    participant={p}
                    isCurrentUser={p.userId === currentUserId}
                    isHost={isHost}
                    hovered={hoveredParticipant === p.userId}
                    onMouseEnter={() => setHoveredParticipant(p.userId)}
                    onMouseLeave={() => setHoveredParticipant(null)}
                    onSpotlight={() => onSpotlight(p.userId)}
                    onToggleMedia={onToggleMedia}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* GRID MODE */
          <div className={`grid ${getGridClass()} gap-1 h-full p-1`}>
            <AnimatePresence>
              {panel.participants.map(p => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <ParticipantTile
                    participant={p}
                    isCurrentUser={p.userId === currentUserId}
                    isHost={isHost}
                    hovered={hoveredParticipant === p.userId}
                    onMouseEnter={() => setHoveredParticipant(p.userId)}
                    onMouseLeave={() => setHoveredParticipant(null)}
                    onSpotlight={() => onSpotlight(p.userId)}
                    onToggleMedia={onToggleMedia}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Individual Participant Tile ----
interface ParticipantTileProps {
  participant: StreamPanelParticipant;
  isSpotlighted?: boolean;
  isCurrentUser: boolean;
  isHost: boolean;
  hovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onSpotlight: () => void;
  onToggleMedia: (userId: string, updates: Partial<Pick<StreamPanelParticipant, 'audioEnabled' | 'videoEnabled' | 'screenSharing'>>) => void;
}

function ParticipantTile({
  participant,
  isSpotlighted,
  isCurrentUser,
  isHost,
  hovered,
  onMouseEnter,
  onMouseLeave,
  onSpotlight,
  onToggleMedia,
}: ParticipantTileProps) {
  const showControls = hovered && (isCurrentUser || isHost);

  return (
    <div
      className={`relative h-full rounded-lg overflow-hidden cursor-pointer transition-all ${
        isSpotlighted
          ? 'ring-2 ring-gold shadow-lg shadow-gold/20'
          : 'ring-1 ring-white/10 hover:ring-white/30'
      } bg-gradient-to-br from-gray-900 to-gray-800`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onSpotlight}
    >
      {/* Video placeholder / Avatar */}
      <div className="absolute inset-0 flex items-center justify-center">
        {participant.videoEnabled ? (
          <div className="w-full h-full bg-gradient-to-br from-burgundy/20 to-purple-900/20 flex items-center justify-center">
            <Avatar
              name={participant.user?.displayName || participant.userId}
              size="lg"
              showStatus
              status="online"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Avatar
              name={participant.user?.displayName || participant.userId}
              size="lg"
            />
            <span className="text-xs text-white/50">Camera Off</span>
          </div>
        )}
      </div>

      {/* Name & Role Badge */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-white font-medium truncate">
            {participant.user?.displayName || participant.userId.slice(0, 8)}
          </span>
          {participant.role === 'host' && (
            <Badge variant="gold">Host</Badge>
          )}
          {participant.role === 'co-host' && (
            <Badge variant="warning">Co-Host</Badge>
          )}
          {participant.virtualCamera && (
            <span className="text-xs text-purple-400" title="Virtual Camera">📹</span>
          )}
          {participant.screenSharing && (
            <span className="text-xs text-blue-400" title="Screen Share">🖥️</span>
          )}
        </div>
      </div>

      {/* Status Indicators */}
      <div className="absolute top-1 right-1 flex gap-1">
        {!participant.audioEnabled && (
          <span className="w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center text-[10px]">🔇</span>
        )}
        {participant.raisedHand && (
          <motion.span
            className="w-5 h-5 bg-yellow-500/80 rounded-full flex items-center justify-center text-[10px]"
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            ✋
          </motion.span>
        )}
      </div>

      {/* Hover Controls */}
      {showControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2"
        >
          {(isCurrentUser || isHost) && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleMedia(participant.userId, { audioEnabled: !participant.audioEnabled }); }}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-sm transition-colors"
              >
                {participant.audioEnabled ? '🎤' : '🔇'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleMedia(participant.userId, { videoEnabled: !participant.videoEnabled }); }}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-sm transition-colors"
              >
                {participant.videoEnabled ? '📷' : '📷'}
              </button>
            </>
          )}
        </motion.div>
      )}

      {/* Spotlight indicator */}
      {isSpotlighted && (
        <div className="absolute top-1 left-1">
          <Badge variant="gold">Spotlight</Badge>
        </div>
      )}
    </div>
  );
}

export default PanelGrid;
