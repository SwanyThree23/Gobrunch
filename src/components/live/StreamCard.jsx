import T from '@/constants/colors.js';
import { Avatar, MonoTag } from '@/components/primitives/index.jsx';
import { durToSec } from '@/utils/format.js';

// ── Stream Card ───────────────────────────────────────────────────────────────
export function StreamCard({ stream, onOpen }) {
  return (
    <div className="card-base" onClick={() => onOpen(stream)} style={{ cursor: 'pointer', marginBottom: 10 }}>
      <div style={{
        height: 120,
        background: `linear-gradient(135deg,${stream.color}22,${T.void})`,
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Avatar initials={stream.initials} color={stream.color} size={52} online />
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <div className="live-badge">LIVE</div>
        </div>
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <MonoTag color={stream.color}>{stream.category}</MonoTag>
          {stream.paid && <MonoTag color={T.gold}>${stream.price}</MonoTag>}
          {stream.screenShare && <MonoTag color={T.cyan}>🖥</MonoTag>}
          {stream.watchParty && <MonoTag color={T.acid}>🎬</MonoTag>}
        </div>
        <div style={{
          position: 'absolute', bottom: 8, left: 8,
          fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(255,255,255,.7)', letterSpacing: 1,
        }}>
          👁{stream.viewers} · 🎙{stream.guests}
        </div>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, lineHeight: 1.3, marginBottom: 4 }}>
          {stream.title}
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted, letterSpacing: 1 }}>
          {stream.host} · {stream.totalJoined} JOINED
        </div>
      </div>
    </div>
  );
}

// ── Video Card ────────────────────────────────────────────────────────────────
export function VideoCard({ video, onPaywall }) {
  const pct = (durToSec(video.duration) / durToSec(video.maxDur)) * 100;

  return (
    <div
      className="card-base"
      style={{ cursor: 'pointer' }}
      onClick={() => video.paid ? onPaywall(video) : null}
    >
      <div style={{
        aspectRatio: '16/9',
        background: `linear-gradient(135deg,${video.color}22,${T.void})`,
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        <Avatar initials={video.initials} color={video.color} size={44} />
        {video.paid && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🔐</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: T.gold }}>${video.price}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 1.5 }}>PREMIUM</div>
            </div>
          </div>
        )}
        <div style={{
          position: 'absolute', bottom: 5, right: 5,
          background: 'rgba(0,0,0,.8)', borderRadius: 2, padding: '2px 7px',
          fontFamily: "'DM Mono',monospace", fontSize: 9,
        }}>
          {video.duration}
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: T.dim }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: `linear-gradient(90deg,${video.color},${video.color}77)`, borderRadius: 2,
          }} />
        </div>
      </div>
      <div style={{ padding: '9px 10px' }}>
        <div style={{
          fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 600,
          lineHeight: 1.3, marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {video.title}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 1 }}>{video.author}</div>
          <div style={{ display: 'flex', gap: 8, fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted }}>
            <span>👁{video.views}</span><span>❤️{video.likes}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Audio Room Card ───────────────────────────────────────────────────────────
export function AudioRoomCard({ room, onToast }) {
  return (
    <div
      className="card-base"
      onClick={() => onToast(`🎙 JOINING ${room.title.toUpperCase()}!`)}
      style={{ cursor: 'pointer', marginBottom: 10 }}
    >
      <div style={{ background: `${room.color}10`, borderBottom: `1px solid ${room.color}22`, padding: '14px 14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Avatar initials={room.initials} color={room.color} size={42} online />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700 }}>{room.title}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted, letterSpacing: 1 }}>by {room.host}</div>
          </div>
          {/* Wave bars */}
          <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 20 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 3, background: room.color, borderRadius: 2,
                  animation: `waveBar ${0.45 + (i % 4) * 0.15}s ${i * 0.08}s infinite alternate`,
                  minHeight: 2,
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <MonoTag color={room.color}>🎙 {room.speakers} SPEAKING</MonoTag>
          <MonoTag color={T.muted}>👂 {room.listeners} LISTENING</MonoTag>
        </div>
      </div>
      <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex' }}>
          {Array.from({ length: Math.min(room.speakers, 4) }, (_, i) => (
            <div key={i} style={{ marginLeft: i > 0 ? -8 : 0, borderRadius: '50%', border: `2px solid ${T.card}` }}>
              <Avatar initials={'ABCDEFGHIJ'[i]} color={[T.vb, T.gold, T.cyan, T.sig][i % 4]} size={28} />
            </div>
          ))}
        </div>
        <button style={{
          background: room.color, border: 'none', color: '#000', borderRadius: 2,
          padding: '5px 14px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, letterSpacing: 1, cursor: 'pointer',
        }}>
          JOIN ROOM
        </button>
      </div>
    </div>
  );
}
