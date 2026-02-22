import { useState } from 'react';
import T from '@/constants/colors.js';
import { AUDIO_ROOMS_DATA, STREAMS_DATA } from '@/constants/data.js';
import { AudioRoomCard } from '@/components/live/StreamCard.jsx';
import { StreamCard } from '@/components/live/StreamCard.jsx';

const ROOM_CATS = ['ALL', 'LIVE ROOMS', 'AUDIO ONLY'];

export function RoomsTab({ onStreamOpen, onToast }) {
  const [filter, setFilter] = useState('ALL');

  const showRooms = filter !== 'LIVE ROOMS';
  const showStreams = filter !== 'AUDIO ONLY';

  return (
    <div className="fade-up">
      {/* Filter bar */}
      <div style={{
        padding: '12px 16px 0',
        borderBottom: `1px solid ${T.border}`,
        display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 10,
      }}>
        {ROOM_CATS.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`tab-pill ${filter === c ? 'active' : ''}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Create room CTA */}
      <div style={{ padding: '14px 16px 0' }}>
        <div
          onClick={() => onToast('🎙 AUDIO ROOM LAUNCHING SOON!')}
          style={{
            background: T.card,
            border: `2px dashed ${T.borderB}`,
            borderRadius: 3, padding: '16px 14px',
            display: 'flex', alignItems: 'center', gap: 14,
            cursor: 'pointer', transition: 'all .2s', marginBottom: 14,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.vb; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderB; }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 3,
            background: `${T.vb}18`, border: `1px solid ${T.vb}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
          }}>
            🎙
          </div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: 2, color: T.vb }}>
              START AN AUDIO ROOM
            </div>
            <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 12, color: T.muted, fontStyle: 'italic' }}>
              Up to 9 guests · Chat · Direct payments
            </div>
          </div>
        </div>

        {/* Audio Rooms */}
        {showRooms && (
          <>
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 2,
              color: T.muted, marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: T.vb,
                display: 'inline-block', animation: 'pulseRed 1.2s infinite',
              }} />
              LIVE AUDIO ROOMS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {AUDIO_ROOMS_DATA.map(room => (
                <AudioRoomCard
                  key={room.id}
                  room={room}
                  onJoin={() => onToast(`🎙 JOINING "${room.title.toUpperCase()}"!`)}
                />
              ))}
            </div>
          </>
        )}

        {/* Live Streams in Room format */}
        {showStreams && (
          <>
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 2,
              color: T.muted, marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: T.sig,
                display: 'inline-block', animation: 'pulseRed 1.2s infinite',
              }} />
              VIDEO ROOMS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {STREAMS_DATA.filter(s => s.guests > 0).map(s => (
                <StreamCard key={s.id} stream={s} onOpen={onStreamOpen} />
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ height: 100 }} />
    </div>
  );
}

export default RoomsTab;
