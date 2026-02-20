import { useState, useRef } from 'react';
import T from '@/constants/colors.js';
import { STAGE_GUESTS, AUDIENCE } from '@/constants/data.js';
import { Avatar, MonoTag, WaveBars } from '@/components/primitives/index.jsx';
import { PaymentModal } from '@/components/modals/PaymentModal.jsx';
import { ShareModal } from '@/components/modals/ShareModal.jsx';
import ChatterStage from './ChatterStage.jsx';

const EMOJIS = ['🔥', '👏', '😂', '❤️', '🙌', '💯'];

function TikTokStage({ stream }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ background: '#000', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        {/* Main host view */}
        <div style={{
          width: '100%', aspectRatio: '4/3',
          background: `linear-gradient(180deg,${stream.color}18 0%,#000 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        }}>
          <Avatar initials={stream.initials} color={stream.color} size={80} online />

          {/* Info overlay */}
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Avatar initials={stream.initials} color={stream.color} size={28} online />
            <div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700 }}>{stream.host}</div>
              <div style={{ display: 'flex', gap: 4 }}>
                <div className="live-badge live-badge-sm">LIVE</div>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, color: T.textD }}>♥ 2,547</span>
              </div>
            </div>
          </div>

          <button style={{
            position: 'absolute', top: 8, right: 8,
            background: T.sig, border: 'none', color: '#fff', borderRadius: 4,
            padding: '5px 12px', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            + Follow
          </button>

          <div style={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
            fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: 'rgba(255,255,255,.7)',
          }}>
            {stream.totalJoined} joined · {stream.viewers} here now
          </div>
        </div>

        {/* Guest grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: T.border }}>
          {STAGE_GUESTS.slice(1, 7).map((g, i) => (
            <div key={g.id} style={{
              position: 'relative', aspectRatio: '1',
              background: `linear-gradient(135deg,${g.color}18,#000)`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            }}>
              <Avatar initials={g.initials} color={g.color} size={28} />
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
                {g.name.slice(0, 9)}
              </div>
              <div style={{ position: 'absolute', top: 3, right: 3, fontSize: 8 }}>{g.muted ? '🔇' : '🎤'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LiveRoom({ stream, onBack, onToast }) {
  const [stageMode, setStageMode] = useState('chatter');
  const [msgs, setMsgs] = useState([
    { id: 1, user: 'queenmo', text: "Let's gooo!! 🔥", t: '2m', avatar: T.sig },
    { id: 2, user: 'cedlinus', text: 'Real talk on stage tonight', t: '1m', avatar: T.vb },
    { id: 3, user: 'Me', text: 'Great energy in here!', t: 'now', avatar: T.v },
  ]);
  const [msg, setMsg] = useState('');
  const [reactions, setReactions] = useState([]);
  const [payOpen, setPayOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [showAudience, setShowAudience] = useState(false);
  const chatRef = useRef(null);

  const sendMsg = () => {
    if (!msg.trim()) return;
    setMsgs(m => [...m, { id: Date.now(), user: 'Me', text: msg, t: 'now', avatar: T.v }]);
    setMsg('');
    setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, 50);
  };

  const addReaction = emoji => {
    const id = Date.now();
    setReactions(r => [...r, { id, emoji, x: 10 + Math.random() * 80 }]);
    setTimeout(() => setReactions(r => r.filter(x => x.id !== id)), 2400);
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: T.obs }}>
      {/* Header */}
      <div className="top-bar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onBack} style={{ background: T.dim, border: `1px solid ${T.border}`, color: T.text, width: 28, height: 28, borderRadius: 2, fontSize: 13, cursor: 'pointer' }}>←</button>
          <Avatar initials={stream.initials} color={stream.color} size={28} online />
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 700, lineHeight: 1 }}>{stream.host}</div>
            <div className="live-badge live-badge-sm">LIVE</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted }}>👁{stream.viewers}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setStageMode('chatter')} className={`tab-pill ${stageMode === 'chatter' ? 'active' : ''}`} style={{ fontSize: 8 }}>GRID</button>
            <button onClick={() => setStageMode('tiktok')} className={`tab-pill ${stageMode === 'tiktok' ? 'active' : ''}`} style={{ fontSize: 8 }}>STAGE</button>
          </div>
          <MonoTag color={stream.color}>{stream.category}</MonoTag>
        </div>
      </div>

      <div style={{ padding: '12px 14px 0', position: 'relative' }}>
        {/* Stage */}
        {stageMode === 'chatter'
          ? <ChatterStage guests={STAGE_GUESTS} stream={stream} />
          : <TikTokStage stream={stream} />
        }

        {/* Audience strip */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted, letterSpacing: 1.5 }}>
              AUDIENCE · {AUDIENCE.length}
            </div>
            <button onClick={() => setShowAudience(!showAudience)} style={{ background: 'none', border: 'none', fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, cursor: 'pointer' }}>
              {showAudience ? '▲' : '▼ VIEW ALL'}
            </button>
          </div>
          <div style={{ display: 'flex' }}>
            {(showAudience ? AUDIENCE : AUDIENCE.slice(0, 6)).map((a, i) => (
              <div key={a.name} title={a.name} style={{ marginLeft: i > 0 ? -8 : 0, borderRadius: '50%', border: `2px solid ${T.obs}` }}>
                <Avatar initials={a.initials} color={a.color} size={34} />
              </div>
            ))}
            {!showAudience && AUDIENCE.length > 6 && (
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: T.dim, border: `2px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, marginLeft: -8,
              }}>
                +{AUDIENCE.length - 6}
              </div>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="card-flat" style={{ marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${T.border}`, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 1 }}>
            LIVE CHAT
          </div>
          <div
            ref={chatRef}
            style={{ maxHeight: 120, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}
          >
            {msgs.map(m => (
              <div key={m.id} className="chat-msg">
                <Avatar initials={m.user} color={m.avatar || T.v} size={22} />
                <div>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: T.vb }}>{m.user} </span>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13 }}>{m.text}</span>
                </div>
              </div>
            ))}
          </div>
          {reactions.map(r => (
            <div key={r.id} className="reaction-float" style={{ bottom: '30%', left: `${r.x}%` }}>{r.emoji}</div>
          ))}
          <div style={{ padding: '8px 10px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 5 }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => addReaction(e)} style={{ background: T.dim, border: `1px solid ${T.border}`, borderRadius: 2, width: 28, height: 28, fontSize: 13, cursor: 'pointer' }}>
                {e}
              </button>
            ))}
            <input
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMsg()}
              placeholder="Say something…"
              className="field-input"
              style={{ flex: 1, padding: '5px 10px', fontSize: 13 }}
            />
            <button onClick={sendMsg} style={{ background: T.v, border: 'none', color: '#fff', width: 28, height: 28, borderRadius: 2, fontSize: 12, cursor: 'pointer' }}>➤</button>
          </div>
        </div>

        {/* Bottom controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 7, paddingBottom: 24 }}>
          {[
            { icon: '🔥', label: 'REACT', color: T.sig, fn: () => addReaction('🔥') },
            { icon: '💬', label: 'CHAT', color: T.vb, fn: () => {} },
            { icon: '📤', label: 'SHARE', color: T.cyan, fn: () => setShareOpen(true) },
            { icon: '💸', label: 'PAY', color: T.gold, fn: () => setPayOpen(true) },
          ].map(b => (
            <button
              key={b.label}
              onClick={b.fn}
              style={{
                background: T.card, border: `1px solid ${b.color}30`,
                borderRadius: 3, padding: '10px 6px', textAlign: 'center', cursor: 'pointer', transition: 'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${b.color}12`; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.card; }}
            >
              <div style={{ fontSize: 18, marginBottom: 3 }}>{b.icon}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1.5, color: b.color }}>{b.label}</div>
            </button>
          ))}
          <button
            onClick={onBack}
            style={{
              background: `${T.sig}14`, border: `1px solid ${T.sig}`,
              borderRadius: 3, padding: '10px 16px',
              color: T.sig, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 1, cursor: 'pointer',
            }}
          >
            LEAVE
          </button>
        </div>
      </div>

      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} host={stream.host} amount={5} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} streamId={stream.id} />
    </div>
  );
}

export default LiveRoom;
