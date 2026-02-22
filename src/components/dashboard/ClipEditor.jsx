import { useState } from 'react';
import T from '@/constants/colors.js';
import { FullPagePanel, BackButton, Spinner } from '@/components/primitives/index.jsx';

const EXPORT_PLATFORMS = ['📱 SeeWhy Feed', '📸 Instagram Reel', '🎵 TikTok', '▶ YouTube Shorts'];

export function ClipEditor({ state, onBack, onToast }) {
  const [selected, setSelected] = useState(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [clipTitle, setClipTitle] = useState('');
  const [exporting, setExporting] = useState(false);
  const sel = state.clips.find(c => c.id === selected);

  const doExport = () => {
    if (!selected) return;
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      onToast('✂️ CLIP EXPORTED & READY TO SHARE!');
      onBack();
    }, 2000);
  };

  return (
    <FullPagePanel>
      <div className="top-bar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BackButton onClick={onBack} />
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2 }}>CLIP EDITOR ✂️</div>
        </div>
        {selected && (
          <button className="btn-acid" onClick={doExport} style={{ padding: '6px 14px', fontSize: 12 }}>
            {exporting ? <Spinner size={16} /> : 'EXPORT →'}
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 0' }}>
        <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 13, color: T.muted, fontStyle: 'italic', marginBottom: 14 }}>
          Select a stream moment to clip, trim, and share.
        </div>

        <label className="field-label">YOUR CLIPS</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {state.clips.map(c => (
            <div
              key={c.id}
              className={`clip-frame ${selected === c.id ? 'selected' : ''}`}
              onClick={() => { setSelected(c.id); setClipTitle(c.title); setTrimStart(0); setTrimEnd(100); }}
            >
              <div style={{
                height: 70,
                background: `linear-gradient(135deg,${c.color}20,${T.void})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: `${c.color}cc`, border: `2px solid ${c.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}>▶</div>
                <div style={{
                  position: 'absolute', bottom: 5, right: 5,
                  background: 'rgba(0,0,0,.8)', borderRadius: 2, padding: '1px 6px',
                  fontFamily: "'DM Mono',monospace", fontSize: 9,
                }}>
                  {c.duration}
                </div>
              </div>
              <div style={{ padding: '6px 8px' }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.title}
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, marginTop: 2 }}>
                  👁 {c.views} · {c.date}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trim editor */}
        {selected && (
          <div className="card-flat" style={{ padding: 16, marginBottom: 20 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: 2, marginBottom: 12 }}>TRIM & EXPORT</div>

            {/* Waveform */}
            <div style={{ height: 50, background: T.panel, borderRadius: 2, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 1, padding: '0 8px', overflow: 'hidden' }}>
              {Array.from({ length: 60 }, (_, i) => (
                <div key={i} style={{
                  flex: 1, borderRadius: 1,
                  height: `${20 + Math.sin(i * 0.6) * 18}px`,
                  background: i / 60 * 100 >= trimStart && i / 60 * 100 <= trimEnd ? T.acid : T.dim,
                  transition: 'background .2s',
                }} />
              ))}
            </div>

            {/* Trim controls */}
            <div style={{ marginBottom: 12 }}>
              <label className="field-label">TRIM START: {trimStart}%</label>
              <input type="range" min={0} max={trimEnd - 5} value={trimStart} className="input-range" onChange={e => setTrimStart(+e.target.value)} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">TRIM END: {trimEnd}%</label>
              <input type="range" min={trimStart + 5} max={100} value={trimEnd} className="input-range" onChange={e => setTrimEnd(+e.target.value)} />
            </div>

            {/* Clip title */}
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">CLIP TITLE</label>
              <input className="field-input" value={clipTitle} onChange={e => setClipTitle(e.target.value)} placeholder="Name this clip..." />
            </div>

            {/* Export platforms */}
            <label className="field-label">EXPORT TO</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {EXPORT_PLATFORMS.map(p => (
                <button key={p} className="tab-pill" onClick={() => onToast('PREPARING EXPORT...')} style={{ fontSize: 9 }}>{p}</button>
              ))}
            </div>

            {/* Export button */}
            <button
              className="btn-acid"
              onClick={doExport}
              style={{ width: '100%', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {exporting ? <><Spinner size={16} />EXPORTING...</> : '✂️ EXPORT CLIP'}
            </button>
          </div>
        )}
      </div>
    </FullPagePanel>
  );
}

export default ClipEditor;
