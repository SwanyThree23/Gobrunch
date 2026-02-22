import { useState, useEffect, useRef } from 'react';
import T from '@/constants/colors.js';
import { WATCH_VIDS } from '@/constants/data.js';
import { Avatar, MonoTag, WaveBars } from '@/components/primitives/index.jsx';
import { durToSec, fmtMMSS } from '@/utils/format.js';

const EMOJIS = ['🔥', '👏', '😂', '❤️', '🙌', '💯', '👑', '🎉'];

export function WatchPartyPanel({ onClose }) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [selVid, setSelVid] = useState(WATCH_VIDS[0]);
  const [msgs, setMsgs] = useState([
    { id: 1, user: 'queenmo', text: 'Amazing room! 👏', t: '2m' },
    { id: 2, user: 'cedlinus', text: 'Censorship is not Political', t: '1m' },
    { id: 3, user: 'Me', text: 'Hey hey Techmunity', t: 'now' },
  ]);
  const [msg, setMsg] = useState('');
  const [reactions, setReactions] = useState([]);
  const ivRef = useRef(null);
  const chatRef = useRef(null);
  const totalSec = durToSec(selVid.dur);

  useEffect(() => {
    if (playing) {
      ivRef.current = setInterval(() => setTime(t => Math.min(t + 1, totalSec)), 1000);
    } else {
      clearInterval(ivRef.current);
    }
    return () => clearInterval(ivRef.current);
  }, [playing, totalSec]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  const addReaction = emoji => {
    const id = Date.now();
    setReactions(r => [...r, { id, emoji, x: 15 + Math.random() * 70 }]);
    setTimeout(() => setReactions(r => r.filter(x => x.id !== id)), 2400);
  };

  const sendMsg = () => {
    if (!msg.trim()) return;
    setMsgs(m => [...m, { id: Date.now(), user: 'Me', text: msg, t: 'now' }]);
    setMsg('');
  };

  const pct = (time / totalSec) * 100;

  return (
    <div className="card-flat fade-up" style={{ marginBottom: 12, border: `1px solid ${T.v}40` }}>
      {/* Header */}
      <div style={{
        background: T.panel, padding: '10px 12px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 1 }}>🎬 WATCH PARTY</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <MonoTag color={T.cyan}>👥 20 SYNCED</MonoTag>
          <div className="live-badge live-badge-sm">LIVE</div>
          <button onClick={onClose} style={{ background: T.dim, border: `1px solid ${T.border}`, color: T.muted, width: 22, height: 22, borderRadius: 2, fontSize: 10, cursor: 'pointer' }}>✕</button>
        </div>
      </div>

      {/* Video area */}
      <div style={{
        aspectRatio: '16/9', background: `linear-gradient(135deg,${T.panel},${T.void})`,
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {!playing ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: T.muted, marginBottom: 10 }}>
              {selVid.title}
            </div>
            <button
              onClick={() => setPlaying(true)}
              style={{
                width: 52, height: 52, borderRadius: '50%',
                background: `${T.v}cc`, border: `3px solid ${T.vb}`,
                color: '#fff', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: `0 0 24px ${T.v}50`,
              }}
            >
              ▶
            </button>
          </div>
        ) : (
          <WaveBars color={T.vb} bars={14} active />
        )}

        {/* Floating reactions */}
        {reactions.map(r => (
          <div
            key={r.id}
            className="reaction-float"
            style={{ bottom: '30%', left: `${r.x}%` }}
          >
            {r.emoji}
          </div>
        ))}

        {/* Synced badge */}
        {playing && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            background: `${T.acid}cc`, borderRadius: 2, padding: '2px 7px',
            fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.obs, letterSpacing: 1.5,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <div style={{ width: 4, height: 4, background: T.obs, borderRadius: '50%', animation: 'pulseRed 1s infinite' }} />
            SYNCED
          </div>
        )}

        {/* Quick reactions */}
        <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 3 }}>
          {EMOJIS.slice(0, 4).map(e => (
            <button
              key={e}
              onClick={() => addReaction(e)}
              style={{ background: 'rgba(0,0,0,.7)', border: `1px solid ${T.border}`, borderRadius: 2, width: 26, height: 26, fontSize: 12, cursor: 'pointer' }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{ background: T.panel, padding: '8px 12px' }}>
        <div className="progress-bar" style={{ marginBottom: 6 }}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, marginBottom: 8 }}>
          <span>{fmtMMSS(time)}</span>
          <span>{selVid.dur}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          <button onClick={() => setTime(t => Math.max(0, t - 10))} style={{ background: T.dim, border: `1px solid ${T.border}`, color: T.muted, width: 30, height: 30, borderRadius: 2, fontSize: 12, cursor: 'pointer' }}>⏮</button>
          <button onClick={() => setPlaying(!playing)} style={{ background: T.v, border: 'none', color: '#fff', width: 38, height: 38, borderRadius: 2, fontSize: 14, cursor: 'pointer' }}>
            {playing ? '⏸' : '▶'}
          </button>
          <button onClick={() => setTime(t => Math.min(totalSec, t + 10))} style={{ background: T.dim, border: `1px solid ${T.border}`, color: T.muted, width: 30, height: 30, borderRadius: 2, fontSize: 12, cursor: 'pointer' }}>⏭</button>
          <button style={{ background: `${T.acid}18`, border: `1px solid ${T.acid}38`, color: T.acid, borderRadius: 2, padding: '0 10px', fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: 1.5, cursor: 'pointer' }}>
            📡 SYNC
          </button>
        </div>

        {/* Video selector */}
        <div style={{ display: 'flex', gap: 5, overflowX: 'auto' }}>
          {WATCH_VIDS.map(v => (
            <button
              key={v.id}
              onClick={() => { setSelVid(v); setPlaying(false); setTime(0); }}
              className={`tab-pill ${selVid.id === v.id ? 'active' : ''}`}
              style={{ flexShrink: 0, fontSize: 8 }}
            >
              {v.title.slice(0, 16)}…
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div style={{ padding: '8px 10px' }}>
        <div ref={chatRef} style={{ maxHeight: 80, overflowY: 'auto', marginBottom: 7, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {msgs.map(m => (
            <div key={m.id} className="chat-msg">
              <Avatar initials={m.user} color={T.v} size={20} />
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: T.vb }}>{m.user}</span>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, marginLeft: 4 }}>{m.text}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <input
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMsg()}
            placeholder="Watch party chat..."
            className="field-input"
            style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
          />
          {EMOJIS.slice(4).map(e => (
            <button key={e} onClick={() => addReaction(e)} style={{ background: T.dim, border: `1px solid ${T.border}`, borderRadius: 2, width: 26, height: 26, fontSize: 11, cursor: 'pointer' }}>
              {e}
            </button>
          ))}
          <button onClick={sendMsg} style={{ background: T.v, border: 'none', color: '#fff', width: 26, height: 26, borderRadius: 2, fontSize: 11, cursor: 'pointer' }}>➤</button>
        </div>
      </div>
    </div>
  );
}

export default WatchPartyPanel;
