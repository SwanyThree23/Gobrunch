import T from '@/constants/colors.js';
import { VIDEOS_DATA } from '@/constants/data.js';
import { VideoCard } from '@/components/live/StreamCard.jsx';

export function PostsTab({ onPaywall, onToast }) {
  return (
    <div className="fade-up">
      {/* Upload CTA */}
      <div
        onClick={() => onToast('🎬 VIDEO UPLOAD — UP TO 10 MINUTES!')}
        style={{
          margin: '14px 16px', background: T.card, border: `2px dashed ${T.borderB}`,
          borderRadius: 3, padding: '18px 14px', textAlign: 'center', cursor: 'pointer', transition: 'all .2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = T.acid; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderB; }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎥</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, marginBottom: 4 }}>
          POST YOUR CONTENT
        </div>
        <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 13, color: T.muted, fontStyle: 'italic', marginBottom: 10 }}>
          Videos up to 10 minutes. Set a paywall — paid direct to you.
        </div>
        {/* Timeline bar */}
        <div style={{ height: 6, background: T.dim, borderRadius: 3, overflow: 'hidden', maxWidth: 300, margin: '0 auto' }}>
          <div style={{ height: '100%', width: '100%', background: `linear-gradient(90deg,${T.v},${T.acid})`, borderRadius: 3 }} />
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 2, marginTop: 5 }}>
          0:00 ─────────────────── 10:00
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {VIDEOS_DATA.map(v => (
            <VideoCard key={v.id} video={v} onPaywall={onPaywall} />
          ))}
        </div>
      </div>
      <div style={{ height: 100 }} />
    </div>
  );
}

export default PostsTab;
