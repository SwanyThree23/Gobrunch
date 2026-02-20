import { useState } from 'react';
import T from '@/constants/colors.js';
import { Spinner } from '@/components/primitives/index.jsx';

const CATEGORIES = ['TALK', 'MUSIC', 'TECH', 'CULTURE', 'KNOWLEDGE', 'PODCAST', 'SPORT'];

export function GoLiveModal({ open, onClose, onToast }) {
  const [step, setStep] = useState(1);
  const [cfg, setCfg] = useState({
    title: '',
    category: 'TALK',
    private: false,
    audio: false,
    watchParty: false,
    screenShare: true,
    paywall: false,
    price: '',
    maxGuests: 9,
    rtmp: false,
    rtmpKey: '',
  });
  const [going, setGoing] = useState(false);

  const toggle = k => setCfg(c => ({ ...c, [k]: !c[k] }));

  const go = () => {
    setGoing(true);
    setTimeout(() => {
      setGoing(false);
      onClose();
      onToast('🔴 YOU\'RE LIVE — BROADCASTING NOW!');
    }, 1200);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-top-line" />
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Title */}
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 2, marginBottom: 4 }}>GO LIVE</div>
        <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 13, color: T.muted, fontStyle: 'italic', marginBottom: 18 }}>
          Configure your broadcast.
        </div>

        {/* Steps indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? T.sig : T.border, transition: 'background .3s' }} />
          ))}
        </div>

        {step === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {/* Title */}
            <div>
              <label className="field-label">STREAM TITLE</label>
              <input
                className="field-input"
                value={cfg.title}
                onChange={e => setCfg(c => ({ ...c, title: e.target.value }))}
                placeholder="What's happening tonight?"
              />
            </div>

            {/* Category */}
            <div>
              <label className="field-label">CATEGORY</label>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCfg(x => ({ ...x, category: c }))}
                    className={`tab-pill ${cfg.category === c ? 'active' : ''}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              {[
                { k: 'private', icon: '🔒', label: 'PRIVATE', sub: 'Invite only' },
                { k: 'audio', icon: '🎙', label: 'AUDIO ONLY', sub: 'No video' },
                { k: 'watchParty', icon: '🎬', label: 'WATCH PARTY', sub: 'Sync video' },
                { k: 'screenShare', icon: '🖥', label: 'SCREEN SHARE', sub: 'Show screen' },
              ].map(o => (
                <button
                  key={o.k}
                  onClick={() => toggle(o.k)}
                  style={{
                    padding: 12, borderRadius: 2, textAlign: 'left',
                    background: cfg[o.k] ? `${T.v}14` : T.panel,
                    border: `2px solid ${cfg[o.k] ? T.vm : T.border}`,
                    color: T.text, cursor: 'pointer', transition: 'all .2s',
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 3 }}>{o.icon}</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, letterSpacing: 1, color: cfg[o.k] ? T.vb : T.text }}>
                    {o.label}
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: T.muted }}>{o.sub}</div>
                </button>
              ))}
            </div>

            {/* Paywall */}
            <button
              onClick={() => toggle('paywall')}
              style={{
                padding: 12, borderRadius: 2,
                background: cfg.paywall ? `${T.gold}10` : T.panel,
                border: `2px solid ${cfg.paywall ? T.gold : T.border}`,
                color: T.text, cursor: 'pointer', transition: 'all .2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 1, color: cfg.paywall ? T.gold : T.text }}>
                    💰 PAYWALL ENTRY
                  </div>
                  <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 12, color: T.muted, fontStyle: 'italic', marginTop: 2 }}>
                    Charge fans — paid directly to you
                  </div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: 2,
                  background: cfg.paywall ? T.gold : T.dim,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: '#000',
                }}>
                  {cfg.paywall ? '✓' : ''}
                </div>
              </div>
            </button>

            {cfg.paywall && (
              <input
                className="field-input"
                value={cfg.price}
                onChange={e => setCfg(c => ({ ...c, price: e.target.value }))}
                placeholder="Entry price (e.g. 5)"
                type="number"
                min="1"
              />
            )}

            {/* RTMP */}
            <button
              onClick={() => toggle('rtmp')}
              style={{
                padding: 12, borderRadius: 2,
                background: cfg.rtmp ? `${T.cyan}10` : T.panel,
                border: `2px solid ${cfg.rtmp ? T.cyan : T.border}`,
                color: T.text, cursor: 'pointer', transition: 'all .2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 1, color: cfg.rtmp ? T.cyan : T.text }}>
                    📡 RTMP SIMULCAST
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: T.muted }}>
                    Broadcast to Instagram, TikTok, YouTube
                  </div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: 2, background: cfg.rtmp ? T.cyan : T.dim,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#000',
                }}>
                  {cfg.rtmp ? '✓' : ''}
                </div>
              </div>
            </button>

            {/* Max guests */}
            <div>
              <label className="field-label">
                MAX GUESTS ON STAGE: <span style={{ color: T.acid }}>{cfg.maxGuests}</span>
              </label>
              <input
                type="range" min={1} max={20} value={cfg.maxGuests}
                className="input-range"
                onChange={e => setCfg(c => ({ ...c, maxGuests: +e.target.value }))}
              />
            </div>

            <button className="btn-primary" style={{ width: '100%', fontSize: 15, justifyContent: 'center' }} onClick={() => setStep(2)}>
              CONTINUE →
            </button>
          </div>
        ) : (
          // Step 2 — Confirm
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>📡</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, letterSpacing: 2, marginBottom: 10 }}>READY TO BROADCAST?</div>

            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 2, padding: 14, marginBottom: 16, textAlign: 'left' }}>
              {[
                cfg.title && ['TITLE', cfg.title],
                ['CATEGORY', cfg.category],
                ['PRIVACY', cfg.private ? '🔒 Private' : '🌍 Public'],
                ['FORMAT', cfg.audio ? '🎙 Audio Only' : '📷 Video + Audio'],
                ['STAGE', `Up to ${cfg.maxGuests} guests`],
                cfg.watchParty && ['WATCH PARTY', '✅ Enabled'],
                cfg.screenShare && ['SCREEN SHARE', '✅ Allowed'],
                cfg.paywall && cfg.price && ['ENTRY FEE', `$${cfg.price} (paid direct to you)`],
                cfg.rtmp && ['RTMP', '📡 Simulcasting enabled'],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 2, color: T.muted }}>{k}</span>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ background: `${T.acid}10`, border: `1px solid ${T.acid}22`, borderRadius: 2, padding: 10, marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.acid, letterSpacing: 1.5 }}>
                💸 PAYPAL · CASHAPP · VENMO · ZELLE · CHIME · ZERO PLATFORM CUT
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>← BACK</button>
              <button className="btn-primary" onClick={go} style={{ flex: 2, justifyContent: 'center', fontSize: 16 }}>
                {going ? <Spinner /> : (
                  <>
                    <span style={{ width: 7, height: 7, background: '#fff', borderRadius: '50%', animation: 'pulseRed 1.2s infinite' }} />
                    GO LIVE NOW
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GoLiveModal;
