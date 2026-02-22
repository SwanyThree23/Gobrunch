import { useState } from 'react';
import T from '@/constants/colors.js';
import { MonoTag, FullPagePanel, BackButton } from '@/components/primitives/index.jsx';

const CAT_COLOR = {
  TALK: T.vb, MUSIC: '#ff6b35', TECH: T.cyan,
  CULTURE: T.sig, KNOWLEDGE: T.acid, PODCAST: T.gold,
};
const CATS = ['TALK', 'MUSIC', 'TECH', 'CULTURE', 'KNOWLEDGE', 'PODCAST'];

export function ScheduleManager({ state, dispatch, onBack, onToast }) {
  const [showNew, setShowNew] = useState(false);
  const [evt, setEvt] = useState({ title: '', date: '', time: '', category: 'TALK' });

  const save = () => {
    if (!evt.title || !evt.date) return;
    dispatch({
      type: 'ADD_SCHEDULE',
      item: { ...evt, id: 's' + Date.now(), color: CAT_COLOR[evt.category] || T.v },
    });
    setShowNew(false);
    setEvt({ title: '', date: '', time: '', category: 'TALK' });
    onToast('📅 STREAM SCHEDULED!');
  };

  return (
    <FullPagePanel>
      <div className="top-bar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BackButton onClick={onBack} />
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2 }}>SCHEDULE 📅</div>
        </div>
        <button className="btn-acid" onClick={() => setShowNew(!showNew)} style={{ padding: '6px 14px', fontSize: 12 }}>
          + SCHEDULE
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 0' }}>
        {/* New event form */}
        {showNew && (
          <div className="card-flat pop-in" style={{ padding: 16, marginBottom: 16, border: `1px solid ${T.borderB}` }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: 2, marginBottom: 12 }}>NEW STREAM EVENT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div>
                <label className="field-label">STREAM TITLE</label>
                <input className="field-input" value={evt.title} onChange={e => setEvt(v => ({ ...v, title: e.target.value }))} placeholder="What's the stream about?" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="field-label">DATE</label>
                  <input className="field-input" type="date" value={evt.date} onChange={e => setEvt(v => ({ ...v, date: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label">TIME</label>
                  <input className="field-input" type="time" value={evt.time} onChange={e => setEvt(v => ({ ...v, time: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="field-label">CATEGORY</label>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {CATS.map(c => (
                    <button key={c} onClick={() => setEvt(v => ({ ...v, category: c }))} className={`tab-pill ${evt.category === c ? 'active' : ''}`}>{c}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-ghost" onClick={() => setShowNew(false)} style={{ flex: 1 }}>CANCEL</button>
                <button className="btn-acid" onClick={save} style={{ flex: 2 }} disabled={!evt.title || !evt.date}>SAVE EVENT</button>
              </div>
            </div>
          </div>
        )}

        <label className="field-label">UPCOMING STREAMS ({state.user.schedule.length})</label>
        {state.user.schedule.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2 }}>NO STREAMS SCHEDULED</div>
            <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 13, color: T.muted, fontStyle: 'italic', marginTop: 6 }}>
              Tap + SCHEDULE to plan your next stream.
            </div>
          </div>
        ) : (
          state.user.schedule.map(s => (
            <div
              key={s.id}
              className="schedule-slot"
              style={{ background: `${s.color}10`, borderColor: s.color }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted, letterSpacing: 1 }}>
                    {s.date} · {s.time}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <MonoTag color={s.color}>{s.category}</MonoTag>
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_SCHEDULE', id: s.id })}
                    style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 12 }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        <div style={{ height: 20 }} />
      </div>
    </FullPagePanel>
  );
}

export default ScheduleManager;
