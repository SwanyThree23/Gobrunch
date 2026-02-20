import T from '@/constants/colors.js';
import { STREAMS_DATA, PAYMENTS_LIST } from '@/constants/data.js';
import { StreamCard } from '@/components/live/StreamCard.jsx';

export function HomeTab({ onStreamOpen, onGoLive, onToast }) {
  return (
    <div className="fade-up">
      {/* Hero */}
      <div className="grid-bg" style={{
        padding: '28px 16px 22px', textAlign: 'center',
        position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(${T.v}15,transparent 70%)`, filter: 'blur(30px)', pointerEvents: 'none' }} />
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 3, color: T.acid, marginBottom: 8 }}>
          ◆ THE CREATOR ECONOMY
        </div>
        <div className="chroma" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, lineHeight: 0.88, letterSpacing: 3, marginBottom: 12, color: T.vb }}>
          BROADCAST<br />YOUR CULTURE
        </div>
        <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 14, color: T.muted, fontStyle: 'italic', lineHeight: 1.6, maxWidth: 300, margin: '0 auto 18px' }}>
          Stream live. Build community. Get paid <em style={{ color: T.text }}>directly</em> — <em style={{ color: T.acid }}>zero platform cut.</em>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button className="btn-primary" onClick={onGoLive} style={{ fontSize: 13, padding: '8px 18px' }}>
            <span style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%', animation: 'pulseRed 1.2s infinite' }} />
            GO LIVE
          </button>
          <button className="btn-ghost" onClick={() => onToast('📅 SCHEDULE COMING UP!')}>SCHEDULE</button>
        </div>
      </div>

      {/* Ticker */}
      <div className="ticker-strip">
        <div className="ticker-inner">
          {'NO PLATFORM FEES  ◆  DIRECT TO YOUR PAYPAL  ◆  9+ GUEST PANELS  ◆  WATCH PARTY SYNC  ◆  SCREEN SHARE LIVE  ◆  INSTAGRAM TIKTOK FACEBOOK SNAPCHAT  ◆  AI TOOLS HUB  ◆  YOUR MONEY YOUR RULES  ◆  '.repeat(2)}
        </div>
      </div>

      {/* Feature strip */}
      <div style={{ padding: '0 12px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 0' }}>
          {[
            { icon: '🎬', label: 'WATCH PARTY', color: T.acid },
            { icon: '🖥', label: 'SCREEN SHARE', color: T.cyan },
            { icon: '💸', label: 'DIRECT PAY', color: T.green },
            { icon: '🎙', label: 'AUDIO ROOMS', color: T.vb },
            { icon: '🤖', label: 'AI TOOLS', color: T.sig },
            { icon: '📤', label: 'SHARE VIRAL', color: T.gold },
          ].map(f => (
            <div
              key={f.label}
              onClick={() => onToast(`${f.icon} ${f.label}!`)}
              style={{
                flexShrink: 0, background: T.card, border: `1px solid ${f.color}25`,
                borderRadius: 3, padding: '10px 12px', textAlign: 'center', cursor: 'pointer',
                minWidth: 90, transition: 'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = f.color; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${f.color}25`; }}
            >
              <div style={{ fontSize: 20, marginBottom: 5 }}>{f.icon}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: 1.5, color: f.color }}>{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment methods */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 2, color: T.muted, marginBottom: 8 }}>
          DIRECT PAYMENTS · 90/10 SPLIT
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {PAYMENTS_LIST.map(p => (
            <div
              key={p.id}
              onClick={() => onToast(`💸 ${p.name.toUpperCase()} — ZERO PLATFORM CUT!`)}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                background: T.panel, border: `1px solid ${T.border}`, borderRadius: 2,
                padding: '7px 12px', cursor: 'pointer', transition: 'border-color .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
            >
              <span style={{ fontSize: 16 }}>{p.emoji}</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1, color: T.textD }}>
                {p.name.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Live now */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="live-badge">LIVE NOW</div>
        </div>
        {STREAMS_DATA.slice(0, 3).map(s => (
          <StreamCard key={s.id} stream={s} onOpen={onStreamOpen} />
        ))}
      </div>
      <div style={{ height: 100 }} />
    </div>
  );
}

export default HomeTab;
