import { useState } from 'react';
import { STREAMS_DATA } from '@/constants/data.js';
import { StreamCard } from '@/components/live/StreamCard.jsx';

const CATS = ['ALL', 'TECH', 'MUSIC', 'CULTURE', 'KNOWLEDGE', 'PODCAST', 'COMMUNITY'];

export function LiveTab({ onStreamOpen }) {
  const [cat, setCat] = useState('ALL');
  const filtered = cat === 'ALL' ? STREAMS_DATA : STREAMS_DATA.filter(s => s.category === cat);

  return (
    <div className="fade-up">
      <div style={{ padding: '12px 16px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 10 }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} className={`tab-pill ${cat === c ? 'active' : ''}`}>{c}</button>
        ))}
      </div>
      <div style={{ padding: '14px 16px 0' }}>
        {filtered.map(s => <StreamCard key={s.id} stream={s} onOpen={onStreamOpen} />)}
      </div>
      <div style={{ height: 100 }} />
    </div>
  );
}

export default LiveTab;
