import { useState } from 'react';
import T from '@/constants/colors.js';
import { Avatar, MonoTag, FullPagePanel, BackButton } from '@/components/primitives/index.jsx';
import { fmtMoney } from '@/utils/format.js';

export function SubscriberManager({ state, onBack }) {
  const [filter, setFilter] = useState('all');
  const subs = filter === 'active'
    ? state.subscribers.filter(s => s.active)
    : filter === 'inactive'
    ? state.subscribers.filter(s => !s.active)
    : state.subscribers;

  const totalMRR = state.subscribers
    .filter(s => s.active)
    .reduce((a, s) => a + parseFloat(s.tier.replace('$', '').split('/')[0]), 0);

  return (
    <FullPagePanel>
      <div className="top-bar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BackButton onClick={onBack} />
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2 }}>SUBSCRIBERS</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: T.gold }}>{fmtMoney(totalMRR)}/mo</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: T.muted }}>MRR</div>
        </div>
      </div>

      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 5 }}>
        {['all', 'active', 'inactive'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`tab-pill ${filter === f ? 'active' : ''}`}>{f.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ background: T.panel, borderBottom: `1px solid ${T.border}`, padding: '12px 16px', display: 'flex', gap: 16 }}>
        {[
          ['ACTIVE', state.subscribers.filter(s => s.active).length, T.gold],
          ['TOTAL', state.subscribers.length, T.vb],
          ['MRR', fmtMoney(totalMRR), T.acid],
        ].map(([l, v, c]) => (
          <div key={l} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: c }}>{v}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: T.muted, letterSpacing: 1 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        {subs.map(s => (
          <div key={s.id} className="sub-row">
            <Avatar initials={s.initials} color={s.color} size={42} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700 }}>{s.name}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 1, marginTop: 2 }}>SINCE {s.since}</div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: s.active ? T.gold : T.muted }}>{s.tier}</div>
              <MonoTag color={s.active ? T.green : T.muted}>{s.active ? 'ACTIVE' : 'INACTIVE'}</MonoTag>
            </div>
          </div>
        ))}
      </div>
    </FullPagePanel>
  );
}

export default SubscriberManager;
