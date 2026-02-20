import { useEffect } from 'react';
import T from '@/constants/colors.js';

// ── Avatar ────────────────────────────────────────────────────────────────────
export const Avatar = ({ initials = 'SW', color = T.v, size = 40, online, badge }) => (
  <div style={{ position: 'relative', flexShrink: 0 }}>
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg,${color}cc,${color}33)`,
      border: `2px solid ${color}60`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: size * 0.34, letterSpacing: 1, color: '#fff',
      boxShadow: `0 0 12px ${color}22`,
    }}>
      {String(initials).replace(/[^\w🦋]/g, '').slice(0, 2).toUpperCase() || 'SW'}
    </div>
    {online && (
      <div style={{
        position: 'absolute', bottom: 1, right: 1,
        width: size * 0.26, height: size * 0.26,
        background: T.acid, borderRadius: '50%', border: `2px solid ${T.obs}`,
      }} />
    )}
    {badge && (
      <div style={{
        position: 'absolute', top: -3, right: -3,
        background: T.sig, borderRadius: '50%',
        minWidth: 16, height: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#fff',
        border: `2px solid ${T.obs}`, padding: '0 3px',
      }}>
        {badge}
      </div>
    )}
  </div>
);

// ── MonoTag ───────────────────────────────────────────────────────────────────
export const MonoTag = ({ children, color = T.acid }) => (
  <span
    className="tag-mono"
    style={{ color, background: `${color}18`, border: `1px solid ${color}35` }}
  >
    {children}
  </span>
);

// ── WaveBars ──────────────────────────────────────────────────────────────────
export const WaveBars = ({ color = T.acid, active = true, bars = 9, levels }) => (
  <div className="wave-bars">
    {Array.from({ length: bars }, (_, i) => {
      const level = levels ? levels[Math.floor((i / bars) * levels.length)] : null;
      const height = level != null
        ? `${Math.max(2, level * 20)}px`
        : (active ? undefined : '2px');
      return (
        <div
          key={i}
          className="wave-bar"
          style={{
            background: color,
            opacity: 0.85,
            height,
            animation: active && !levels
              ? `waveBar ${0.45 + (i % 5) * 0.11}s ${i * 0.07}s infinite alternate`
              : 'none',
          }}
        />
      );
    })}
  </div>
);

// ── GlowDivider ───────────────────────────────────────────────────────────────
export const GlowDivider = ({ color = T.v }) => (
  <div style={{
    height: 1,
    background: `linear-gradient(90deg,transparent,${color}50,transparent)`,
    margin: '16px 0',
  }} />
);

// ── Toast ─────────────────────────────────────────────────────────────────────
export const Toast = ({ msg, onDone }) => {
  useEffect(() => {
    if (msg) {
      const t = setTimeout(onDone, 2800);
      return () => clearTimeout(t);
    }
  }, [msg, onDone]);

  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed', top: 74, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9000, background: T.acid, color: T.obs,
      padding: '9px 20px', borderRadius: 2,
      fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 2,
      boxShadow: '0 6px 36px rgba(200,240,0,.4)',
      animation: 'popIn .2s ease', whiteSpace: 'nowrap', maxWidth: '88vw',
    }}>
      {msg}
    </div>
  );
};

// ── Spinner ───────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 20, color = T.v }) => (
  <div style={{
    width: size, height: size,
    border: `3px solid ${T.border}`,
    borderTop: `3px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  }} />
);

// ── Modal ─────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, sub, children, wide }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={'modal-box' + (wide ? ' modal-box-wide' : '')}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-top-line" />
        <button className="modal-close" onClick={onClose}>✕</button>
        {title && (
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 2, marginBottom: 4 }}>
            {title}
          </div>
        )}
        {sub && (
          <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 13, color: T.muted, fontStyle: 'italic', marginBottom: 18 }}>
            {sub}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

// ── StatBox ───────────────────────────────────────────────────────────────────
export const StatBox = ({ value, label, color = T.acid, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: T.card, padding: '11px 6px', textAlign: 'center',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background 0.2s',
    }}
    onMouseEnter={e => { if (onClick) e.currentTarget.style.background = T.lift; }}
    onMouseLeave={e => { if (onClick) e.currentTarget.style.background = T.card; }}
  >
    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color }}>{value}</div>
    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: T.muted, letterSpacing: 1.5, marginTop: 2 }}>
      {label}
    </div>
  </div>
);

// ── SectionHeader ─────────────────────────────────────────────────────────────
export const SectionHeader = ({ title, action, actionLabel }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2 }}>{title}</div>
    {action && (
      <button
        onClick={action}
        style={{ background: 'none', border: 'none', fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.acid, letterSpacing: 1.5, cursor: 'pointer' }}
      >
        {actionLabel || 'SEE ALL →'}
      </button>
    )}
  </div>
);

// ── BackButton ────────────────────────────────────────────────────────────────
export const BackButton = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: T.dim, border: `1px solid ${T.border}`, color: T.text,
      width: 28, height: 28, borderRadius: 2, fontSize: 13, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
  >
    ←
  </button>
);

// ── EmptyState ────────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, sub }) => (
  <div style={{ textAlign: 'center', padding: '48px 16px' }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2, marginBottom: 6 }}>{title}</div>
    {sub && (
      <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 13, color: T.muted, fontStyle: 'italic' }}>{sub}</div>
    )}
  </div>
);

// ── FullPagePanel ─────────────────────────────────────────────────────────────
export const FullPagePanel = ({ children, style }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 500, background: T.obs,
    ...style,
  }}>
    <div style={{ maxWidth: 480, margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  </div>
);

// ── PanelOverlay ──────────────────────────────────────────────────────────────
export const PanelOverlay = ({ children }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 600,
    background: 'rgba(3,2,9,.9)', backdropFilter: 'blur(14px)',
  }}>
    <div style={{ maxWidth: 480, margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column', background: T.obs }}>
      {children}
    </div>
  </div>
);
