import T from '@/constants/colors.js';

// ── Line Chart ────────────────────────────────────────────────────────────────
export const LineChart = ({ data, color = T.acid, height = 80 }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 300;
  const H = height;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 10) - 5,
  }));
  const path = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const area = `${path} L${pts[pts.length - 1].x},${H} L0,${H} Z`;
  const gradId = `lg${color.replace('#', '')}`;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeDasharray: 1000, animation: 'drawLine 1.5s ease forwards' }}
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} stroke={T.obs} strokeWidth="1.5" />
      ))}
    </svg>
  );
};

// ── Bar Chart ─────────────────────────────────────────────────────────────────
export const BarChart = ({ data, color = T.v, labels, height = 60, highlightColor }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data) || 1;

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div
            style={{
              width: '100%',
              background: highlightColor && v === Math.max(...data) ? highlightColor : `${color}88`,
              height: `${(v / max) * height}px`,
              borderRadius: '2px 2px 0 0',
              transition: 'height .6s cubic-bezier(.23,1,.32,1)',
              minHeight: 2,
            }}
            title={String(v)}
          />
          {labels && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: T.muted, letterSpacing: 1 }}>
              {labels[i]}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ── VU Meter ──────────────────────────────────────────────────────────────────
export const VUMeter = ({ levels, peakLevel, bars = 26, height = 48 }) => {
  const getBarColor = (level, i, total) => {
    const pos = i / total;
    if (pos > 0.85) return '#ff2255'; // red zone
    if (pos > 0.65) return '#ffb800'; // yellow zone
    return '#c8f000'; // green zone
  };

  return (
    <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height, padding: '0 2px' }}>
      {Array.from({ length: bars }, (_, i) => {
        const level = levels[i] || 0;
        const barH = Math.max(2, level * height);
        return (
          <div
            key={i}
            className="vu-bar"
            style={{
              flex: 1,
              height: barH,
              background: getBarColor(level, i, bars),
              opacity: level > 0.05 ? 1 : 0.2,
              transition: 'height 0.05s ease, opacity 0.1s ease',
            }}
          />
        );
      })}
    </div>
  );
};

// ── Bandwidth Monitor ─────────────────────────────────────────────────────────
export const BandwidthMonitor = ({ kbps }) => {
  const pct = Math.min(100, (kbps / 8000) * 100);
  const color = kbps >= 2500 ? T.acid : kbps >= 1500 ? '#ffb800' : '#ff2255';

  return (
    <div style={{ fontFamily: "'DM Mono',monospace" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: T.muted, marginBottom: 4 }}>
        <span>BANDWIDTH</span>
        <span style={{ color }}>{kbps.toLocaleString()} kbps</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color},${color}88)` }}
        />
      </div>
    </div>
  );
};
