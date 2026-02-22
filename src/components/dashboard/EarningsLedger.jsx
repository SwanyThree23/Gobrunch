import { useState } from 'react';
import T from '@/constants/colors.js';
import { MonoTag, FullPagePanel, BackButton } from '@/components/primitives/index.jsx';
import { fmtMoney } from '@/utils/format.js';

const TYPE_ICON = { stream: '📡', subscribe: '⭐', tip: '💝', paywall: '🔐' };
const TYPE_COLOR = { stream: T.sig, subscribe: T.gold, tip: T.cyan, paywall: T.v };

export function EarningsLedger({ state, onBack }) {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? state.earnings : state.earnings.filter(e => e.type === filter);
  const total = filtered.reduce((a, e) => a + e.amount, 0);

  return (
    <FullPagePanel>
      {/* Header */}
      <div className="top-bar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BackButton onClick={onBack} />
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2 }}>EARNINGS LEDGER</div>
        </div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: T.acid }}>{fmtMoney(total)}</div>
      </div>

      {/* Filter tabs */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 5, overflowX: 'auto' }}>
        {['all', 'stream', 'subscribe', 'tip', 'paywall'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`tab-pill ${filter === f ? 'active' : ''}`}>
            {TYPE_ICON[f] || '◆'} {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: T.panel, borderBottom: `1px solid ${T.border}` }}>
        {[
          ['TOTAL', fmtMoney(total), T.acid],
          ['TRANSACTIONS', filtered.length, T.vb],
          ['AVG', filtered.length ? fmtMoney(total / filtered.length) : '—', T.cyan],
        ].map(([l, v, c]) => (
          <div key={l} style={{ padding: '12px 10px', textAlign: 'center', borderRight: `1px solid ${T.border}` }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: c }}>{v}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: T.muted, letterSpacing: 1.5 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Transaction list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2 }}>NO TRANSACTIONS</div>
          </div>
        ) : (
          filtered.map(e => (
            <div key={e.id} className="earnings-row">
              <div style={{ fontSize: 22 }}>{TYPE_ICON[e.type] || '💰'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 600 }}>{e.label}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted, letterSpacing: 1, marginTop: 2 }}>
                  {e.from} · {e.via} · {e.date}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: TYPE_COLOR[e.type] || T.acid }}>
                  {fmtMoney(e.amount)}
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted }}>{e.via.toUpperCase()}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 90/10 footer note */}
      <div style={{
        padding: '10px 16px 24px', borderTop: `1px solid ${T.border}`,
        fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, textAlign: 'center', letterSpacing: 1.5,
      }}>
        ALL PAYMENTS DIRECT · ZERO PLATFORM CUT · 90% TO YOU
      </div>
    </FullPagePanel>
  );
}

export default EarningsLedger;
