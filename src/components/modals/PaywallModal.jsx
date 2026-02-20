import { useState } from 'react';
import T from '@/constants/colors.js';
import { PAYMENTS_LIST } from '@/constants/data.js';
import { Modal } from '@/components/primitives/index.jsx';

export function PaywallModal({ open, onClose, item, onUnlock }) {
  const [sel, setSel] = useState(null);
  const [done, setDone] = useState(false);

  const unlock = () => {
    if (!sel) return;
    setDone(true);
    setTimeout(() => { setDone(false); setSel(null); onUnlock?.(); onClose(); }, 2000);
  };

  if (!item) return null;

  return (
    <Modal open={open} onClose={onClose} title="🔐 PREMIUM CONTENT" sub={`${item.title || ''} — by ${item.author || item.host || ''}`}>
      {done ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, letterSpacing: 2 }}>UNLOCKED!</div>
          <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 13, color: T.muted, fontStyle: 'italic', marginTop: 6 }}>
            Enjoy the content. Come back any time.
          </div>
        </div>
      ) : (
        <>
          <div style={{
            background: `${T.gold}10`, border: `1px solid ${T.gold}28`, borderRadius: 2,
            padding: 16, textAlign: 'center', marginBottom: 18,
          }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, color: T.gold }}>${item.price}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted, letterSpacing: 2 }}>
              ONE-TIME ACCESS · PAID DIRECT TO CREATOR
            </div>
          </div>

          <label className="field-label">PAY VIA</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {PAYMENTS_LIST.slice(0, 4).map(p => (
              <button
                key={p.id}
                onClick={() => setSel(p)}
                style={{
                  padding: '9px 10px', borderRadius: 2,
                  background: sel?.id === p.id ? `${p.color}18` : T.panel,
                  border: `2px solid ${sel?.id === p.id ? p.color : T.border}`,
                  color: T.text, cursor: 'pointer', transition: 'all .2s',
                  display: 'flex', alignItems: 'center', gap: 7,
                }}
              >
                <span style={{ fontSize: 16 }}>{p.emoji}</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, letterSpacing: 1 }}>{p.name}</span>
              </button>
            ))}
          </div>

          <button
            className="btn-acid"
            onClick={unlock}
            disabled={!sel}
            style={{ width: '100%', opacity: !sel ? 0.4 : 1, fontSize: 14 }}
          >
            🔓 UNLOCK FOR ${item.price} VIA {sel ? sel.name.toUpperCase() : '...'}
          </button>
        </>
      )}
    </Modal>
  );
}

export default PaywallModal;
