import { useState, useEffect, useRef } from 'react';
import T from '@/constants/colors.js';
import { INSFORGE_SERVICES, INSFORGE_INCIDENTS } from '@/constants/data.js';
import { MonoTag } from '@/components/primitives/index.jsx';
import { randomBetween } from '@/utils/format.js';

const STATUS_COLOR = { online: T.green, warning: T.gold, offline: T.sig };
const STATUS_LABEL = { online: '●', warning: '▲', offline: '✕' };
const SEV_COLOR = { critical: T.sig, warning: T.gold, info: T.cyan };

const COVERAGE_PLANS = [
  { name: 'Starter', price: '$29/mo', coverage: '$50K Coverage', sla: '99.9% SLA', features: ['DDoS Protection', '1 Region', 'Email Alerts'] },
  { name: 'Growth', price: '$89/mo', coverage: '$250K Coverage', sla: '99.95% SLA', features: ['DDoS Protection', '3 Regions', 'Slack Alerts', 'Auto-scale'] },
  { name: 'Scale Pro', price: '$249/mo', coverage: '$1M Coverage', sla: '99.99% SLA', features: ['DDoS Protection', 'Multi-region', 'Priority Support', 'Auto-scale', 'Failover'] },
];

export function InsForge({ state, dispatch }) {
  const [services, setServices] = useState(INSFORGE_SERVICES);
  const [incidents] = useState(INSFORGE_INCIDENTS);
  const [tab, setTab] = useState('status');
  const [autoScale, setAutoScale] = useState(state.infrastructure?.autoScale || { minNodes: 2, maxNodes: 20, targetCPU: 70 });
  const pingRef = useRef(null);

  // Simulate live latency updates
  useEffect(() => {
    pingRef.current = setInterval(() => {
      setServices(prev => prev.map(s => ({
        ...s,
        latency: s.status !== 'offline' && s.latency !== null
          ? randomBetween(Math.max(1, s.latency - 20), s.latency + 20)
          : s.latency,
      })));
    }, 2000);
    return () => clearInterval(pingRef.current);
  }, []);

  const updateAutoScale = (key, val) => {
    const next = { ...autoScale, [key]: val };
    setAutoScale(next);
    dispatch({ type: 'SET_AUTOSCALE', config: next });
  };

  return (
    <div style={{ padding: '14px 16px 0' }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, marginBottom: 4 }}>
        🏗 INSFORGE INFRASTRUCTURE
      </div>
      <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 12, color: T.muted, fontStyle: 'italic', marginBottom: 14 }}>
        Real-time monitoring, auto-scaling & coverage plans.
      </div>

      {/* Tab selector */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 14, overflowX: 'auto' }}>
        {['status', 'incidents', 'autoscale', 'coverage'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`tab-pill ${tab === t ? 'active' : ''}`}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Status overview */}
      {tab === 'status' && (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: T.border, borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
            {[
              ['ONLINE', services.filter(s => s.status === 'online').length, T.green],
              ['WARNING', services.filter(s => s.status === 'warning').length, T.gold],
              ['OFFLINE', services.filter(s => s.status === 'offline').length, T.sig],
            ].map(([l, v, c]) => (
              <div key={l} style={{ background: T.panel, padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: c }}>{v}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: T.muted, letterSpacing: 1.5 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Service list */}
          {services.map(s => (
            <div key={s.id} className="service-row">
              <div style={{ fontSize: 20 }}>{s.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: T.muted }}>
                    {s.uptime}% uptime
                  </div>
                  {s.latency !== null && (
                    <div style={{
                      fontFamily: "'DM Mono',monospace", fontSize: 7,
                      color: s.latency < 50 ? T.green : s.latency < 150 ? T.gold : T.sig,
                    }}>
                      {s.latency}ms
                    </div>
                  )}
                </div>
              </div>

              {/* Latency bar */}
              {s.latency !== null && (
                <div style={{ width: 60 }}>
                  <div className="progress-bar" style={{ height: 2 }}>
                    <div
                      style={{
                        height: '100%', borderRadius: 2,
                        width: `${Math.min(100, (s.latency / 300) * 100)}%`,
                        background: s.latency < 50 ? T.green : s.latency < 150 ? T.gold : T.sig,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              )}

              <div style={{
                fontFamily: "'Bebas Neue',sans-serif", fontSize: 14,
                color: STATUS_COLOR[s.status], minWidth: 20, textAlign: 'center',
              }}>
                {STATUS_LABEL[s.status]}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Incidents */}
      {tab === 'incidents' && (
        <div>
          {incidents.map(inc => (
            <div
              key={inc.id}
              style={{
                background: T.panel,
                border: `1px solid ${SEV_COLOR[inc.severity]}30`,
                borderLeft: `3px solid ${SEV_COLOR[inc.severity]}`,
                borderRadius: 2, padding: 12, marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                    {inc.service}
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: T.textD }}>{inc.msg}</div>
                </div>
                <MonoTag color={SEV_COLOR[inc.severity]}>{inc.severity.toUpperCase()}</MonoTag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted }}>{inc.time}</div>
                <MonoTag color={inc.resolved ? T.green : T.sig}>{inc.resolved ? 'RESOLVED' : 'ACTIVE'}</MonoTag>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auto-scaling */}
      {tab === 'autoscale' && (
        <div>
          <div className="card-flat" style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: 2, marginBottom: 14 }}>
              AUTO-SCALING CONFIG
            </div>

            {[
              { key: 'minNodes', label: 'MIN NODES', min: 1, max: 10, suffix: ' nodes' },
              { key: 'maxNodes', label: 'MAX NODES', min: autoScale.minNodes, max: 50, suffix: ' nodes' },
              { key: 'targetCPU', label: 'TARGET CPU', min: 10, max: 90, suffix: '%' },
            ].map(cfg => (
              <div key={cfg.key} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="field-label" style={{ margin: 0 }}>{cfg.label}</label>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: T.acid }}>
                    {autoScale[cfg.key]}{cfg.suffix}
                  </span>
                </div>
                <input
                  type="range"
                  min={cfg.min}
                  max={cfg.max}
                  value={autoScale[cfg.key]}
                  className="input-range"
                  onChange={e => updateAutoScale(cfg.key, +e.target.value)}
                />
              </div>
            ))}

            <div style={{ background: `${T.v}10`, border: `1px solid ${T.v}22`, borderRadius: 2, padding: 10 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.vb, letterSpacing: 1.5 }}>
                CURRENT CONFIG: {autoScale.minNodes}–{autoScale.maxNodes} nodes · CPU target {autoScale.targetCPU}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coverage plans */}
      {tab === 'coverage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {COVERAGE_PLANS.map((plan, i) => (
            <div
              key={plan.name}
              className="card-flat"
              style={{
                padding: 16,
                border: `1px solid ${i === 1 ? T.v : T.border}`,
                position: 'relative',
              }}
            >
              {i === 1 && (
                <div style={{
                  position: 'absolute', top: -1, right: 12,
                  background: T.v, color: '#fff',
                  fontFamily: "'Bebas Neue',sans-serif", fontSize: 10, letterSpacing: 2,
                  padding: '2px 8px', borderRadius: '0 0 2px 2px',
                }}>
                  POPULAR
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2 }}>{plan.name}</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: T.muted }}>{plan.coverage}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: T.acid }}>{plan.price}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.green }}>{plan.sla}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: T.acid, fontSize: 10 }}>◆</span>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: T.textD }}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                className={i === 1 ? 'btn-acid' : 'btn-ghost'}
                style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
              >
                SELECT {plan.name.toUpperCase()}
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 20 }} />
    </div>
  );
}

export default InsForge;
