import { useState } from 'react';
import T from '@/constants/colors.js';
import { PAYMENTS_LIST } from '@/constants/data.js';
import { Spinner } from '@/components/primitives/index.jsx';

function LandingPage({ onSignup, onLogin }) {
  return (
    <div style={{ minHeight: '100vh', background: T.obs, display: 'flex', flexDirection: 'column' }}>
      <div
        className="grid-bg"
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 28, textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}
      >
        {/* BG glow blobs */}
        <div style={{
          position: 'absolute', top: -80, right: -80, width: 300, height: 300,
          borderRadius: '50%', background: `radial-gradient(${T.v}20,transparent 70%)`,
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -60, width: 240, height: 240,
          borderRadius: '50%', background: `radial-gradient(${T.acid}12,transparent 70%)`,
          filter: 'blur(30px)', pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: 4, color: T.vb, marginBottom: 16, opacity: 0.8 }}>
          THE CREATOR ECONOMY
        </div>
        <div
          className="chroma"
          style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 62, lineHeight: 0.88, letterSpacing: 4, marginBottom: 8, color: T.vb }}
        >
          SEE<br />WHY<br /><span style={{ color: T.sig }}>LIVE</span>
        </div>

        {/* Tagline */}
        <div style={{
          fontFamily: "'Instrument Serif',serif", fontSize: 16,
          color: T.muted, fontStyle: 'italic', lineHeight: 1.7,
          maxWidth: 300, marginBottom: 32, marginTop: 12,
        }}>
          Stream live. Build your community. Get paid <em style={{ color: T.text }}>directly</em> —
          PayPal, CashApp, Venmo, Zelle & Chime.{' '}
          <em style={{ color: T.acid }}>Zero platform cut.</em>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280 }}>
          <button className="btn-primary" onClick={onSignup} style={{ justifyContent: 'center', width: '100%', fontSize: 16, padding: '13px 28px' }}>
            <span style={{ width: 7, height: 7, background: '#fff', borderRadius: '50%', animation: 'pulseRed 1.2s infinite' }} />
            START CREATING FREE
          </button>
          <button className="btn-ghost" onClick={onLogin} style={{ width: '100%' }}>
            I ALREADY HAVE AN ACCOUNT
          </button>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', gap: 14, marginTop: 36, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['9+ Guest Panels', 'Watch Party', 'Screen Share', 'Direct Payments', 'Audio Rooms', 'AI Tools', 'Cross-Platform'].map(f => (
            <div key={f} style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: 1.5, color: T.muted, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: T.acid }}>◆</span>{f.toUpperCase()}
            </div>
          ))}
        </div>

        {/* 90/10 split badge */}
        <div style={{
          marginTop: 24,
          background: `${T.acid}12`, border: `1px solid ${T.acid}25`,
          borderRadius: 2, padding: '8px 16px',
          fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 2, color: T.acid,
        }}>
          90/10 CREATOR SPLIT — YOU KEEP 90%
        </div>
      </div>

      <div className="ticker-strip">
        <div className="ticker-inner">
          {'NO PLATFORM FEES  ◆  DIRECT TO YOUR PAYPAL  ◆  9+ GUEST PANELS  ◆  WATCH PARTY SYNC  ◆  SCREEN SHARE  ◆  INSTAGRAM TIKTOK FACEBOOK SNAPCHAT  ◆  AI TOOLS HUB  ◆  YOUR MONEY YOUR RULES  ◆  '.repeat(2)}
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onLogin, onSignup }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({ name: form.email.split('@')[0] || '@seewhy_creator', type: 'creator' });
    }, 1200);
  };

  return (
    <div style={{ minHeight: '100vh', background: T.obs, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card-flat pop-in" style={{ width: '100%', maxWidth: 380, padding: 32, position: 'relative' }}>
        <div className="modal-top-line" />
        <button
          onClick={onSignup}
          style={{ background: T.dim, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 2, padding: '4px 10px', marginBottom: 20, fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1, cursor: 'pointer' }}
        >
          ← BACK
        </button>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 2, marginBottom: 4 }}>WELCOME BACK</div>
        <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 13, color: T.muted, fontStyle: 'italic', marginBottom: 24 }}>
          Sign in to your creator account.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div>
            <label className="field-label">EMAIL</label>
            <input
              className="field-input" type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div>
            <label className="field-label">PASSWORD</label>
            <input
              className="field-input" type="password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <button className="btn-primary" onClick={handleSubmit} style={{ width: '100%', justifyContent: 'center', fontSize: 15, marginTop: 4 }}>
            {loading ? <Spinner /> : 'SIGN IN'}
          </button>
          <button
            onClick={() => {}}
            style={{ background: 'none', border: 'none', fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1.5, color: T.muted, cursor: 'pointer' }}
          >
            FORGOT PASSWORD?
          </button>
        </div>
      </div>
    </div>
  );
}

function SignupForm({ onLogin }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', type: 'creator' });
  const [loading, setLoading] = useState(false);

  const handleLaunch = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({ name: form.name || '@seewhy_creator', type: form.type });
    }, 1400);
  };

  return (
    <div style={{ minHeight: '100vh', background: T.obs, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card-flat pop-in" style={{ width: '100%', maxWidth: 400, padding: 32, position: 'relative' }}>
        <div className="modal-top-line" />

        {/* Progress steps */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? T.acid : T.border, transition: 'background .3s' }} />
          ))}
        </div>

        {/* Step 1 — Basic info */}
        {step === 1 && (
          <div className="fade-up">
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 2, marginBottom: 4 }}>CREATE YOUR ACCOUNT</div>
            <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 13, color: T.muted, fontStyle: 'italic', marginBottom: 22 }}>Step 1 of 3 — Basic info</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="field-label">YOUR NAME / HANDLE</label>
                <input className="field-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="@yourhandle" />
              </div>
              <div>
                <label className="field-label">EMAIL</label>
                <input className="field-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" />
              </div>
              <div>
                <label className="field-label">PASSWORD</label>
                <input className="field-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
              </div>
              <button className="btn-primary" onClick={() => setStep(2)} style={{ width: '100%', justifyContent: 'center' }}>
                CONTINUE →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Creator type */}
        {step === 2 && (
          <div className="fade-up">
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 2, marginBottom: 4 }}>CREATOR TYPE</div>
            <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 13, color: T.muted, fontStyle: 'italic', marginBottom: 22 }}>Step 2 of 3 — How will you use SeeWhy?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 18 }}>
              {[
                { id: 'creator', icon: '🎙', label: 'CONTENT CREATOR', sub: 'Stream, post videos, build an audience' },
                { id: 'viewer', icon: '👁', label: 'VIEWER / FAN', sub: 'Watch, support creators, join rooms' },
                { id: 'brand', icon: '🏢', label: 'BRAND / BUSINESS', sub: 'Reach audiences, host branded events' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setForm(f => ({ ...f, type: t.id }))}
                  style={{
                    padding: 13, borderRadius: 2, textAlign: 'left', cursor: 'pointer', transition: 'all .2s',
                    background: form.type === t.id ? `${T.v}14` : T.panel,
                    border: `2px solid ${form.type === t.id ? T.vm : T.border}`,
                    color: T.text,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, letterSpacing: 1, color: form.type === t.id ? T.vb : T.text }}>{t.label}</div>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: T.muted }}>{t.sub}</div>
                    </div>
                    {form.type === t.id && <span style={{ marginLeft: 'auto', color: T.acid, fontSize: 16 }}>✓</span>}
                  </div>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>← BACK</button>
              <button className="btn-primary" onClick={() => setStep(3)} style={{ flex: 2, justifyContent: 'center' }}>CONTINUE →</button>
            </div>
          </div>
        )}

        {/* Step 3 — Payments */}
        {step === 3 && (
          <div className="fade-up">
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 2, marginBottom: 4 }}>CONNECT PAYMENTS</div>
            <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 13, color: T.muted, fontStyle: 'italic', marginBottom: 18 }}>Step 3 of 3 — Get paid directly.</div>

            <div style={{
              background: `${T.acid}10`, border: `1px solid ${T.acid}25`, borderRadius: 2,
              padding: 12, marginBottom: 16, textAlign: 'center',
            }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: T.acid, letterSpacing: 2 }}>YOU KEEP 90%</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 1.5 }}>DIRECT TO YOUR ACCOUNTS · ZERO PLATFORM CUT</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {PAYMENTS_LIST.map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  background: T.panel, border: `1px solid ${T.border}`, borderRadius: 2,
                }}>
                  <span style={{ fontSize: 20 }}>{p.emoji}</span>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 1, flex: 1 }}>{p.name}</span>
                  <button style={{
                    background: `${p.color}18`, border: `1px solid ${p.color}40`, color: p.color,
                    borderRadius: 2, padding: '4px 12px',
                    fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1.5, cursor: 'pointer',
                  }}>
                    CONNECT
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" onClick={() => setStep(2)} style={{ flex: 1 }}>← BACK</button>
              <button className="btn-primary" onClick={handleLaunch} style={{ flex: 2, justifyContent: 'center' }}>
                {loading ? <Spinner /> : 'LAUNCH →'}
              </button>
            </div>
            <button
              onClick={handleLaunch}
              style={{ background: 'none', border: 'none', fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted, letterSpacing: 1.5, cursor: 'pointer', marginTop: 12, width: '100%' }}
            >
              SKIP FOR NOW →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('landing');

  if (mode === 'landing') return <LandingPage onSignup={() => setMode('signup')} onLogin={() => setMode('login')} />;
  if (mode === 'login') return <LoginForm onLogin={onLogin} onSignup={() => setMode('landing')} />;
  return <SignupForm onLogin={onLogin} />;
}

export default AuthScreen;
