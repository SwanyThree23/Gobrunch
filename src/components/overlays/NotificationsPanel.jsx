import T from '@/constants/colors.js';
import { MonoTag, PanelOverlay } from '@/components/primitives/index.jsx';

const TYPE_COLOR = {
  payment: T.green,
  follow: T.vb,
  live: T.sig,
  comment: T.cyan,
  subscribe: T.gold,
  clip: T.acid,
};

export function NotificationsPanel({ state, dispatch, onClose }) {
  const unread = state.notifications.filter(n => !n.read).length;

  return (
    <PanelOverlay>
      <div className="top-bar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2 }}>NOTIFICATIONS</div>
          {unread > 0 && <MonoTag color={T.sig}>{unread} UNREAD</MonoTag>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {unread > 0 && (
            <button
              onClick={() => dispatch({ type: 'READ_ALL_NOTIFS' })}
              style={{
                background: 'none', border: `1px solid ${T.border}`, color: T.muted, borderRadius: 2,
                padding: '4px 10px', fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: 1.5, cursor: 'pointer',
              }}
            >
              MARK ALL READ
            </button>
          )}
          <button onClick={onClose} style={{ background: T.dim, border: `1px solid ${T.border}`, color: T.text, width: 30, height: 30, borderRadius: 2, fontSize: 14, cursor: 'pointer' }}>✕</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {state.notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2 }}>ALL CAUGHT UP</div>
          </div>
        ) : (
          state.notifications.map(n => (
            <div
              key={n.id}
              className="notif-item"
              onClick={() => dispatch({ type: 'READ_NOTIF', id: n.id })}
              style={{ borderLeft: `3px solid ${!n.read ? (TYPE_COLOR[n.type] || T.v) : T.border}` }}
            >
              <div style={{ fontSize: 22, flexShrink: 0 }}>{n.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, lineHeight: 1.35,
                  fontWeight: n.read ? 400 : 600,
                }}>
                  {n.msg}
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 1, marginTop: 4 }}>
                  {n.time}
                </div>
              </div>
              {!n.read && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_COLOR[n.type] || T.v, flexShrink: 0, marginTop: 4 }} />
              )}
            </div>
          ))
        )}
      </div>
    </PanelOverlay>
  );
}

export default NotificationsPanel;
