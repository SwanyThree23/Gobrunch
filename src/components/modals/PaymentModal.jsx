import { useState } from 'react';
import T from '@/constants/colors.js';
import { PAYMENTS_LIST } from '@/constants/data.js';
import { Modal, Spinner } from '@/components/primitives/index.jsx';

// Build real deep-link URLs for each payment platform
function buildPayLink(platformId, handle, amount) {
  const h = handle.replace(/^[@$]/, ''); // strip leading @ or $
  const amt = amount || '';
  switch (platformId) {
    case 'paypal':  return `https://paypal.me/${h}${amt ? '/' + amt : ''}`;
    case 'cashapp': return `https://cash.app/$${h}${amt ? '/' + amt : ''}`;
    case 'venmo':   return `https://venmo.com/${h}?txn=pay${amt ? '&amount=' + amt : ''}&note=SeeWhy+LIVE+tip`;
    case 'chime':   return `https://cash.chime.com/${h}`;
    case 'zelle':   return 'https://enroll.zellepay.com/';
    default:        return null;
  }
}

export function PaymentModal({ open, onClose, host, amount }) {
  const [sel, setSel] = useState(null);
  const [handle, setHandle] = useState('');
  const [done, setDone] = useState(false);

  const send = () => {
    if (!sel || !handle) return;
    const url = buildPayLink(sel.id, handle, amount);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    setDone(true);
    setTimeout(() => { setDone(false); setSel(null); setHandle(''); onClose(); }, 2500);
  };

  return (
    <Modal open={open} onClose={onClose} title={`SUPPORT ${host ? host.toUpperCase() : 'CREATOR'}`} sub="100% goes directly to creator. Zero platform fees.">
      {done ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, letterSpacing: 2 }}>PAYMENT SENT!</div>
          <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 13, color: T.muted, fontStyle: 'italic', marginTop: 6 }}>
            Direct to {host}. Every dollar. Always.
          </div>
        </div>
      ) : (
        <>
          <div style={{
            background: `${T.acid}10`, border: `1px solid ${T.acid}30`, borderRadius: 2,
            padding: 14, textAlign: 'center', marginBottom: 18,
          }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 2, color: T.muted, marginBottom: 4 }}>SENDING AMOUNT</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: T.acid, lineHeight: 1 }}>
              {amount ? `$${amount}` : 'ANY'}
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted, marginTop: 4, letterSpacing: 1.5 }}>
              DIRECT · NO FEES · INSTANT
            </div>
          </div>

          <label className="field-label">Choose Payment App</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {PAYMENTS_LIST.map(p => (
              <button
                key={p.id}
                onClick={() => setSel(p)}
                style={{
                  padding: '10px 12px', borderRadius: 2, textAlign: 'left',
                  background: sel?.id === p.id ? `${p.color}18` : T.panel,
                  border: `2px solid ${sel?.id === p.id ? p.color : T.border}`,
                  color: T.text, cursor: 'pointer', transition: 'all .2s',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 3 }}>{p.emoji}</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 1 }}>{p.name}</div>
              </button>
            ))}
          </div>

          {sel && (
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Your {sel.name} Handle</label>
              <input
                className="field-input"
                value={handle}
                onChange={e => setHandle(e.target.value)}
                placeholder={`@your${sel.id}handle`}
                onKeyDown={e => e.key === 'Enter' && send()}
              />
            </div>
          )}

          <button
            className="btn-acid"
            onClick={send}
            disabled={!sel || !handle}
            style={{ width: '100%', opacity: (!sel || !handle) ? 0.4 : 1, fontSize: 15 }}
          >
            💸 OPEN {sel ? sel.name.toUpperCase() : 'PAYMENT APP'} →
          </button>
          {sel && handle && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 1, textAlign: 'center', marginTop: 8 }}>
              OPENS {sel.name.toUpperCase()} APP / WEBSITE · 100% DIRECT · ZERO PLATFORM FEE
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

export default PaymentModal;
