import { useState } from 'react';
import T from '@/constants/colors.js';

const MUX_ENV_KEY = import.meta.env.VITE_MUX_ENV_KEY || '';

// Mux RTMP server URLs
const MUX_RTMP_URL = 'rtmps://global-live.mux.com:443/app';

// OBS recommended settings
const OBS_SETTINGS = [
  { label: 'Video Bitrate', value: '4000–6000 Kbps', note: '1080p30' },
  { label: 'Audio Bitrate', value: '128–192 Kbps', note: 'AAC' },
  { label: 'Keyframe Interval', value: '2 seconds', note: 'Required by Mux' },
  { label: 'Resolution', value: '1920×1080 or 1280×720', note: '' },
  { label: 'Frame Rate', value: '30 fps', note: 'Stable connection' },
  { label: 'Encoder', value: 'x264 or GPU encoder', note: '' },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      style={{
        background: copied ? `${T.acid}18` : T.panel,
        border: `1px solid ${copied ? T.acid : T.border}`,
        color: copied ? T.acid : T.muted,
        borderRadius: 2, padding: '4px 10px', cursor: 'pointer',
        fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1.5,
        transition: 'all .2s', flexShrink: 0,
      }}
    >
      {copied ? 'COPIED!' : 'COPY'}
    </button>
  );
}

function MonoField({ label, value, sensitive }) {
  const [reveal, setReveal] = useState(false);
  const display = sensitive && !reveal ? '•'.repeat(Math.min(value.length, 40)) : value;
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: 2, color: T.muted, display: 'block', marginBottom: 5 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          flex: 1, background: T.panel, border: `1px solid ${T.border}`,
          borderRadius: 2, padding: '8px 12px',
          fontFamily: "'DM Mono',monospace", fontSize: 11, color: T.vb,
          wordBreak: 'break-all', lineHeight: 1.4,
        }}>
          {display || <span style={{ color: T.muted, fontStyle: 'italic' }}>Not configured — add VITE_MUX_ENV_KEY to .env</span>}
        </div>
        {sensitive && value && (
          <button
            onClick={() => setReveal(r => !r)}
            style={{ background: T.panel, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 2, padding: '4px 8px', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 9 }}
          >
            {reveal ? 'HIDE' : 'SHOW'}
          </button>
        )}
        {value && <CopyButton text={value} />}
      </div>
    </div>
  );
}

export default function MuxRTMP() {
  const [streamKey, setStreamKey] = useState('');
  const [tab, setTab] = useState('setup');

  return (
    <div style={{ padding: '14px 16px', height: '100%', overflowY: 'auto' }}>
      {/* Header badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
        padding: 14, background: `${T.sig}10`, border: `1px solid ${T.sig}30`, borderRadius: 2,
      }}>
        <div style={{ fontSize: 32 }}>📡</div>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, color: T.sig }}>MUX RTMP STREAMING</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 1.5 }}>
            BROADCAST FROM OBS · STREAMLABS · ANY RTMP CLIENT
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {['setup', 'obs', 'monitor'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 14px', borderRadius: 2, cursor: 'pointer',
              background: tab === t ? T.sig : T.panel,
              border: `1px solid ${tab === t ? T.sig : T.border}`,
              color: tab === t ? '#fff' : T.muted,
              fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1.5,
              transition: 'all .2s',
            }}
          >
            {t === 'setup' ? 'SETUP' : t === 'obs' ? 'OBS GUIDE' : 'MONITOR'}
          </button>
        ))}
      </div>

      {/* SETUP TAB */}
      {tab === 'setup' && (
        <div>
          <MonoField label="RTMP INGEST URL" value={MUX_RTMP_URL} />

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: 2, color: T.muted, display: 'block', marginBottom: 5 }}>
              YOUR STREAM KEY
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="password"
                value={streamKey}
                onChange={e => setStreamKey(e.target.value)}
                placeholder="Paste your Mux stream key here..."
                style={{
                  flex: 1, background: T.panel, border: `1px solid ${T.border}`,
                  color: T.text, borderRadius: 2, padding: '8px 12px',
                  fontFamily: "'DM Mono',monospace", fontSize: 11,
                  outline: 'none',
                }}
              />
              {streamKey && <CopyButton text={streamKey} />}
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, marginTop: 5, letterSpacing: 1 }}>
              Get your stream key from{' '}
              <a href="https://dashboard.mux.com" target="_blank" rel="noopener noreferrer" style={{ color: T.vb }}>
                dashboard.mux.com
              </a>
              {' '}→ Live Streams → Create
            </div>
          </div>

          <MonoField label="MUX ENVIRONMENT KEY (for client monitoring)" value={MUX_ENV_KEY} sensitive />

          <div style={{
            background: `${T.acid}10`, border: `1px solid ${T.acid}25`,
            borderRadius: 2, padding: 14, marginTop: 18,
          }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, letterSpacing: 2, color: T.acid, marginBottom: 8 }}>
              HOW IT WORKS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                '1. Create a Live Stream in your Mux Dashboard',
                '2. Copy the Stream Key (starts with abcdefgh…)',
                '3. In OBS → Settings → Stream → Service: Custom',
                '4. Paste RTMP URL above as Server',
                '5. Paste your Stream Key',
                '6. Start streaming — Mux handles encoding & delivery',
              ].map((step, i) => (
                <div key={i} style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: T.text, display: 'flex', gap: 8 }}>
                  <span style={{ color: T.acid, fontFamily: "'DM Mono',monospace", fontSize: 10, flexShrink: 0, marginTop: 1 }}>→</span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OBS GUIDE TAB */}
      {tab === 'obs' && (
        <div>
          <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 13, color: T.muted, fontStyle: 'italic', lineHeight: 1.7, marginBottom: 18 }}>
            Use these settings in OBS Studio for the best quality stream on Mux.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {OBS_SETTINGS.map(s => (
              <div key={s.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: T.panel, border: `1px solid ${T.border}`, borderRadius: 2,
              }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted, letterSpacing: 1 }}>{s.label}</div>
                  {s.note && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, opacity: 0.6, letterSpacing: 0.5 }}>{s.note}</div>}
                </div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, letterSpacing: 1, color: T.vb }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: 14, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 2, marginBottom: 12 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: 2, color: T.muted, marginBottom: 8 }}>OBS → SETTINGS → STREAM</div>
            {[
              ['Service', 'Custom'],
              ['Server', MUX_RTMP_URL],
              ['Stream Key', streamKey || '(paste your Mux stream key)'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted, flexShrink: 0 }}>{k}:</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.text, wordBreak: 'break-all', textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: 12, background: `${T.cyan}10`, border: `1px solid ${T.cyan}30`, borderRadius: 2 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.cyan, letterSpacing: 1.5 }}>
              STREAMLABS · ECAMM · WIRECAST also supported — use the same RTMP URL and stream key
            </div>
          </div>
        </div>
      )}

      {/* MONITOR TAB */}
      {tab === 'monitor' && (
        <div>
          <div style={{
            padding: 20, background: T.panel, border: `1px solid ${T.border}`,
            borderRadius: 2, textAlign: 'center', marginBottom: 18,
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: 2, marginBottom: 6 }}>
              MUX DATA MONITORING
            </div>
            <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 12, color: T.muted, fontStyle: 'italic', lineHeight: 1.6 }}>
              Real-time stream health, viewer metrics, and quality-of-experience data. Powered by Mux Data SDK.
            </div>
          </div>

          {MUX_ENV_KEY ? (
            <div style={{ padding: 14, background: `${T.acid}10`, border: `1px solid ${T.acid}30`, borderRadius: 2 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.acid, letterSpacing: 1.5, marginBottom: 6 }}>ENV KEY DETECTED</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: T.text }}>
                Mux Data SDK is ready. Integrate <code style={{ background: T.dim, padding: '2px 5px', borderRadius: 2 }}>@mux/mux-player-react</code> to get viewer analytics.
              </div>
            </div>
          ) : (
            <div style={{ padding: 14, background: `${T.sig}10`, border: `1px solid ${T.sig}30`, borderRadius: 2 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.sig, letterSpacing: 1.5, marginBottom: 6 }}>SETUP REQUIRED</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: T.text, lineHeight: 1.6 }}>
                Add <code style={{ background: T.dim, padding: '2px 5px', borderRadius: 2 }}>VITE_MUX_ENV_KEY</code> to your .env file.
                Get it from <a href="https://dashboard.mux.com" target="_blank" rel="noopener noreferrer" style={{ color: T.vb }}>dashboard.mux.com</a> → Data → Environments.
              </div>
            </div>
          )}

          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Video Startup Time', value: '—', unit: 'ms' },
              { label: 'Rebuffering Ratio', value: '—', unit: '%' },
              { label: 'Unique Viewers', value: '—', unit: '' },
              { label: 'Playback Failure Rate', value: '—', unit: '%' },
            ].map(m => (
              <div key={m.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: T.panel, border: `1px solid ${T.border}`, borderRadius: 2,
              }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted, letterSpacing: 1 }}>{m.label}</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: T.muted }}>
                  {m.value}{m.unit}
                </span>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 1, textAlign: 'center', marginTop: 10 }}>
            LIVE METRICS AVAILABLE AFTER MUX DATA SDK INTEGRATION
          </div>
        </div>
      )}
    </div>
  );
}
