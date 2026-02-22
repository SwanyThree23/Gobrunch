import { useState } from 'react';
import T from '@/constants/colors.js';
import { LineChart, BarChart } from '@/components/charts/index.jsx';
import { StatBox, SectionHeader } from '@/components/primitives/index.jsx';
import { fmtMoney } from '@/utils/format.js';
import EarningsLedger from '@/components/dashboard/EarningsLedger.jsx';
import SubscriberManager from '@/components/dashboard/SubscriberManager.jsx';
import ClipEditor from '@/components/dashboard/ClipEditor.jsx';
import ScheduleManager from '@/components/dashboard/ScheduleManager.jsx';

const DASH_VIEWS = ['OVERVIEW', 'EARNINGS', 'SUBSCRIBERS', 'CLIPS', 'SCHEDULE'];

export function DashboardTab({ state, dispatch, onToast }) {
  const [view, setView] = useState('OVERVIEW');
  const { analytics, user, earnings } = state;

  const totalEarned = earnings.reduce((s, e) => s + e.amount, 0);
  const weekEarned = analytics.earningsDaily.reduce((s, v) => s + v, 0);

  if (view === 'EARNINGS') return (
    <div className="fade-up">
      <div style={{ padding: '12px 16px 0', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 10 }}>
        {DASH_VIEWS.map(v => <button key={v} onClick={() => setView(v)} className={`tab-pill ${view === v ? 'active' : ''}`}>{v}</button>)}
      </div>
      <EarningsLedger state={state} dispatch={dispatch} />
    </div>
  );
  if (view === 'SUBSCRIBERS') return (
    <div className="fade-up">
      <div style={{ padding: '12px 16px 0', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 10 }}>
        {DASH_VIEWS.map(v => <button key={v} onClick={() => setView(v)} className={`tab-pill ${view === v ? 'active' : ''}`}>{v}</button>)}
      </div>
      <SubscriberManager state={state} dispatch={dispatch} />
    </div>
  );
  if (view === 'CLIPS') return (
    <div className="fade-up">
      <div style={{ padding: '12px 16px 0', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 10 }}>
        {DASH_VIEWS.map(v => <button key={v} onClick={() => setView(v)} className={`tab-pill ${view === v ? 'active' : ''}`}>{v}</button>)}
      </div>
      <ClipEditor state={state} dispatch={dispatch} />
    </div>
  );
  if (view === 'SCHEDULE') return (
    <div className="fade-up">
      <div style={{ padding: '12px 16px 0', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 10 }}>
        {DASH_VIEWS.map(v => <button key={v} onClick={() => setView(v)} className={`tab-pill ${view === v ? 'active' : ''}`}>{v}</button>)}
      </div>
      <ScheduleManager state={state} dispatch={dispatch} />
    </div>
  );

  // OVERVIEW
  return (
    <div className="fade-up">
      {/* Sub-nav */}
      <div style={{ padding: '12px 16px 0', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 10 }}>
        {DASH_VIEWS.map(v => (
          <button key={v} onClick={() => setView(v)} className={`tab-pill ${view === v ? 'active' : ''}`}>{v}</button>
        ))}
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        {/* Tier badge */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14,
        }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 2 }}>
              CREATOR ANALYTICS
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 1.5 }}>
              REAL-TIME INSIGHTS
            </div>
          </div>
          <div style={{
            fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, letterSpacing: 2,
            background: `${T.gold}20`, border: `1px solid ${T.gold}40`,
            color: T.gold, padding: '4px 10px', borderRadius: 2,
          }}>
            {user.tier} TIER
          </div>
        </div>

        {/* Stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <StatBox label="TOTAL EARNED" value={fmtMoney(user.earned)} color={T.green} />
          <StatBox label="THIS WEEK" value={fmtMoney(weekEarned)} color={T.acid} />
          <StatBox label="STREAMS" value={user.streams} color={T.vb} />
          <StatBox label="TOTAL VIEWS" value={`${(user.views / 1000).toFixed(1)}K`} color={T.cyan} />
        </div>

        {/* Weekly views chart */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 3, padding: 14, marginBottom: 12,
        }}>
          <SectionHeader label="WEEKLY VIEWS" color={T.vb} />
          <LineChart data={analytics.weekly} color={T.vb} height={70} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {analytics.labels.map(l => (
              <div key={l} style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: T.muted, letterSpacing: 1 }}>{l}</div>
            ))}
          </div>
        </div>

        {/* Earnings chart */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 3, padding: 14, marginBottom: 12,
        }}>
          <SectionHeader label="DAILY EARNINGS ($)" color={T.green} />
          <BarChart
            data={analytics.earningsDaily}
            color={T.green}
            labels={analytics.labels}
            height={70}
            highlightColor={T.acid}
          />
        </div>

        {/* Top streams */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 3, padding: 14, marginBottom: 12,
        }}>
          <SectionHeader label="TOP STREAMS" color={T.gold} />
          {analytics.topStreams.map((s, i) => (
            <div key={s.title} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0',
              borderBottom: i < analytics.topStreams.length - 1 ? `1px solid ${T.border}` : 'none',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 2,
                background: `${T.gold}20`, border: `1px solid ${T.gold}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.gold, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: T.text,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {s.title}
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 1 }}>
                  {s.views} views
                </div>
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: T.green, flexShrink: 0 }}>
                {fmtMoney(s.earned)}
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming schedule preview */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 3, padding: 14, marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <SectionHeader label="UPCOMING STREAMS" color={T.sig} />
            <button
              onClick={() => setView('SCHEDULE')}
              style={{
                fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: 1,
                background: 'none', border: `1px solid ${T.borderB}`, color: T.muted,
                padding: '3px 8px', borderRadius: 2, cursor: 'pointer',
              }}
            >
              VIEW ALL →
            </button>
          </div>
          {user.schedule.slice(0, 2).map(s => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              borderBottom: `1px solid ${T.border}`,
            }}>
              <div style={{
                width: 4, height: 36, background: s.color, borderRadius: 2, flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: T.text }}>{s.title}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 1 }}>
                  {s.date} · {s.time}
                </div>
              </div>
              <div style={{
                fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1.5,
                background: `${s.color}20`, border: `1px solid ${s.color}30`,
                color: s.color, padding: '3px 7px', borderRadius: 2,
              }}>
                {s.category}
              </div>
            </div>
          ))}
        </div>

        {/* Quick action grid */}
        <div style={{
          fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 2,
          color: T.muted, marginBottom: 8,
        }}>
          QUICK ACTIONS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { icon: '✂️', label: 'CLIP EDITOR', action: () => setView('CLIPS'), color: T.acid },
            { icon: '📅', label: 'SCHEDULE', action: () => setView('SCHEDULE'), color: T.sig },
            { icon: '⭐', label: 'SUBSCRIBERS', action: () => setView('SUBSCRIBERS'), color: T.gold },
            { icon: '💸', label: 'EARNINGS', action: () => setView('EARNINGS'), color: T.green },
          ].map(q => (
            <div
              key={q.label}
              onClick={q.action}
              style={{
                background: T.card, border: `1px solid ${q.color}25`,
                borderRadius: 3, padding: '12px 14px',
                cursor: 'pointer', transition: 'all .2s',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = q.color; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${q.color}25`; }}
            >
              <span style={{ fontSize: 20 }}>{q.icon}</span>
              <span style={{
                fontFamily: "'Bebas Neue',sans-serif", fontSize: 14,
                letterSpacing: 1.5, color: q.color,
              }}>
                {q.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 100 }} />
    </div>
  );
}

export default DashboardTab;
