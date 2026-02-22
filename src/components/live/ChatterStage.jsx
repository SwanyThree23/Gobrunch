import { useState } from 'react';
import T from '@/constants/colors.js';
import { Avatar, WaveBars } from '@/components/primitives/index.jsx';
import WatchPartyPanel from './WatchPartyPanel.jsx';

export function ChatterStage({ guests, stream }) {
  const [featured, setFeatured] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [muteAll, setMuteAll] = useState(false);
  const [wpOpen, setWpOpen] = useState(false);

  const screensharer = guests.find(g => g.screenShare);
  const visible = expanded ? guests : guests.slice(0, 8);

  return (
    <div style={{ marginBottom: 12 }}>
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 600 }}>
            Stage <span style={{ color: T.textD }}>{guests.length}</span>
          </div>
          {stream?.watchParty && (
            <button
              onClick={() => setWpOpen(!wpOpen)}
              className={`tab-pill ${wpOpen ? 'active' : ''}`}
              style={{ fontSize: 9 }}
            >
              🎬 PARTY
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => setMuteAll(!muteAll)}
            style={{ background: 'none', border: 'none', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: muteAll ? T.sig : T.muted, cursor: 'pointer' }}
          >
            mute all 🔇
          </button>
          <button onClick={() => setExpanded(!expanded)} className="tab-pill" style={{ fontSize: 9 }}>
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Watch Party */}
      {wpOpen && <WatchPartyPanel onClose={() => setWpOpen(false)} />}

      {/* Featured spotlight */}
      {featured && (
        <div
          onClick={() => setFeatured(null)}
          style={{
            width: '100%', aspectRatio: '16/9', marginBottom: 7,
            background: `linear-gradient(135deg,${featured.color}18,${T.panel})`,
            border: `2px solid ${featured.color}`,
            borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <Avatar initials={featured.initials} color={featured.color} size={56} />
            {!featured.muted && <div style={{ marginTop: 8 }}><WaveBars color={T.acid} bars={7} /></div>}
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 1, marginTop: 6 }}>{featured.name}</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, color: T.muted }}>Click to exit spotlight</div>
          </div>
        </div>
      )}

      {/* Screen share preview */}
      {screensharer && !featured && (
        <div style={{
          width: '100%', aspectRatio: '16/9', marginBottom: 7,
          background: '#000', border: `2px solid ${T.cyan}`,
          borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 20px ${T.cyan}20`,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🖥️</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: T.cyan }}>
              {screensharer.name} is sharing
            </div>
          </div>
        </div>
      )}

      {/* Guest grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3,1fr)',
        gap: 1, background: T.border, borderRadius: 3, overflow: 'hidden',
      }}>
        {visible.map(g => (
          <div
            key={g.id}
            className={`guest-tile ${g.id === 1 ? 'host-glow' : ''}`}
            onClick={() => setFeatured(f => f?.id === g.id ? null : g)}
            style={{ background: `linear-gradient(135deg,${g.color}18,#000)` }}
          >
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Avatar initials={g.initials} color={g.color} size={32} />
            </div>

            {/* Speaking indicator */}
            {!g.muted && !muteAll && (
              <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)' }}>
                <WaveBars color={T.acid} bars={4} />
              </div>
            )}

            {/* Mute icon */}
            <div style={{
              position: 'absolute', top: 3, right: 3,
              background: 'rgba(0,0,0,.7)', borderRadius: 1, width: 14, height: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7,
            }}>
              {g.muted || muteAll ? '🔇' : '🎤'}
            </div>

            {/* Name label */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent,rgba(0,0,0,.9))',
              padding: '10px 4px 4px',
            }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {g.name.slice(0, 10)}
              </div>
              {g.role !== 'Guest' && (
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 7, color: g.id === 1 ? T.gold : T.cyan }}>
                  {g.role}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Request to join slot */}
        <div
          style={{
            aspectRatio: '1', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: T.panel, cursor: 'pointer', transition: 'background 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.lift; }}
          onMouseLeave={e => { e.currentTarget.style.background = T.panel; }}
        >
          <span style={{ fontSize: 16, color: T.muted }}>＋</span>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 8, color: T.muted, marginTop: 3 }}>REQUEST</span>
        </div>
      </div>

      {/* Expand toggle */}
      {guests.length > 8 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: '100%', marginTop: 4, padding: '7px 0',
            background: 'none', border: `1px solid ${T.border}`, borderRadius: 2,
            color: T.muted, fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 2, cursor: 'pointer',
          }}
        >
          {expanded ? 'COLLAPSE' : `SHOW ALL ${guests.length} ON STAGE`}
        </button>
      )}
    </div>
  );
}

export default ChatterStage;
