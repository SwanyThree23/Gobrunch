import { useState, useRef, useEffect } from 'react';
import T from '@/constants/colors.js';
import { STREAMS_DATA, TRENDING_CREATORS } from '@/constants/data.js';
import { Avatar, MonoTag, GlowDivider, PanelOverlay } from '@/components/primitives/index.jsx';

const CATS = ['ALL', 'TECH', 'MUSIC', 'CULTURE', 'KNOWLEDGE', 'PODCAST', 'COMMUNITY'];

export function DiscoveryPanel({ onStreamOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const inputRef = useRef(null);

  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  const filtered = STREAMS_DATA.filter(s => {
    const mQ = !query || s.title.toLowerCase().includes(query.toLowerCase()) || s.host.toLowerCase().includes(query.toLowerCase());
    const mC = category === 'ALL' || s.category === category;
    return mQ && mC;
  });

  return (
    <PanelOverlay>
      <div className="top-bar" style={{ gap: 10 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: T.muted }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="field-input"
            placeholder="Search streams, creators..."
            style={{ paddingLeft: 32, width: '100%' }}
          />
        </div>
        <button onClick={onClose} style={{ background: T.dim, border: `1px solid ${T.border}`, color: T.text, width: 36, height: 36, borderRadius: 2, fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>✕</button>
      </div>

      {/* Category filter */}
      <div style={{ padding: '10px 16px 0', display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 10, borderBottom: `1px solid ${T.border}` }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setCategory(c)} className={`tab-pill ${category === c ? 'active' : ''}`}>{c}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Trending creators (only when not searching) */}
        {!query && category === 'ALL' && (
          <>
            <div style={{ padding: '12px 16px 8px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 2, color: T.muted }}>
              TRENDING CREATORS
            </div>
            <div style={{ display: 'flex', gap: 14, padding: '0 16px 14px', overflowX: 'auto' }}>
              {TRENDING_CREATORS.map(c => (
                <div key={c.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0, cursor: 'pointer' }}>
                  <Avatar initials={c.initials} color={c.color} size={50} online={c.live} />
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, textAlign: 'center', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted }}>{c.followers}</div>
                  {c.live && <div className="live-badge live-badge-sm">LIVE</div>}
                </div>
              ))}
            </div>
            <GlowDivider color={T.v} />
            <div style={{ padding: '4px 16px 8px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 2, color: T.muted }}>
              LIVE NOW
            </div>
          </>
        )}

        {/* Results */}
        {filtered.map(s => (
          <div
            key={s.id}
            className="search-result"
            onClick={() => { onStreamOpen(s); onClose(); }}
          >
            <Avatar initials={s.initials} color={s.color} size={44} online={s.live !== false} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.title}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: T.muted }}>{s.host}</span>
                <div className="live-badge live-badge-sm">LIVE</div>
                {s.paid && <MonoTag color={T.gold}>${s.price}</MonoTag>}
                <MonoTag color={s.color}>{s.category}</MonoTag>
              </div>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted }}>👁{s.viewers}</div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2, marginBottom: 6 }}>NO RESULTS</div>
            <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 13, color: T.muted, fontStyle: 'italic' }}>
              Try a different search or category.
            </div>
          </div>
        )}
      </div>
    </PanelOverlay>
  );
}

export default DiscoveryPanel;
