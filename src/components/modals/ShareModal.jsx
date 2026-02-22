import { useState } from 'react';
import T from '@/constants/colors.js';
import { SHARE_LIST } from '@/constants/data.js';
import { Modal } from '@/components/primitives/index.jsx';
import { copyToClipboard } from '@/utils/format.js';

export function ShareModal({ open, onClose, streamId }) {
  const [copied, setCopied] = useState(false);
  const url = `seewhylive.com/live/${streamId || 'demo'}?ref=share`;

  const handleShare = async (p) => {
    if (p.id === 'copy') {
      await copyToClipboard(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="SHARE YOUR LIVE" sub="Viewers on other platforms see embedded preview — they discover SeeWhy LIVE." wide>
      <div style={{ background: T.panel, border: `1px solid ${T.borderB}`, borderRadius: 2, padding: 12, marginBottom: 16 }}>
        <label className="field-label">SHAREABLE LINK</label>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: T.vb, wordBreak: 'break-all' }}>{url}</div>
      </div>

      <label className="field-label">SHARE TO PLATFORM</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
        {SHARE_LIST.map(p => (
          <button
            key={p.id}
            onClick={() => handleShare(p)}
            style={{
              padding: '10px 6px', borderRadius: 2, textAlign: 'center',
              background: T.panel, border: `1px solid ${T.border}`,
              cursor: 'pointer', transition: 'border-color .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
          >
            <div style={{ fontSize: 20, marginBottom: 4 }}>{p.emoji}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1, color: T.muted }}>
              {p.id === 'copy' && copied ? 'COPIED!' : p.name.split('/')[0].trim().slice(0, 8).toUpperCase()}
            </div>
          </button>
        ))}
      </div>

      <div style={{ background: `${T.v}10`, border: `1px solid ${T.v}22`, borderRadius: 2, padding: 12 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 1, color: T.vb, marginBottom: 4 }}>
          🚀 VIRAL GROWTH ENGINE
        </div>
        <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 12, color: T.muted, fontStyle: 'italic', lineHeight: 1.6 }}>
          Every external share is a free ad. Your content reaches new audiences — those viewers discover SeeWhy LIVE and your community grows automatically.
        </div>
      </div>
    </Modal>
  );
}

export default ShareModal;
