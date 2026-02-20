import { useState, useEffect, useRef } from 'react';
import T from '@/constants/colors.js';
import { Avatar, PanelOverlay } from '@/components/primitives/index.jsx';

export function MessagingPanel({ state, dispatch, onClose }) {
  const [active, setActive] = useState(null);
  const [msgText, setMsgText] = useState('');
  const bottomRef = useRef(null);
  const activeDM = active ? state.dms.find(d => d.id === active) : null;

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [activeDM?.messages]);

  const openDM = dm => {
    setActive(dm.id);
    dispatch({ type: 'MARK_DM_READ', id: dm.id });
  };

  const send = () => {
    if (!msgText.trim() || !active) return;
    dispatch({ type: 'SEND_DM', dmId: active, text: msgText });
    setMsgText('');
  };

  return (
    <PanelOverlay>
      <div className="top-bar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {active && (
            <button
              onClick={() => setActive(null)}
              style={{ background: T.dim, border: `1px solid ${T.border}`, color: T.text, width: 28, height: 28, borderRadius: 2, fontSize: 13, cursor: 'pointer' }}
            >
              ←
            </button>
          )}
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2 }}>
            {active ? (activeDM ? activeDM.with : '') : 'MESSAGES'}
          </div>
        </div>
        <button onClick={onClose} style={{ background: T.dim, border: `1px solid ${T.border}`, color: T.text, width: 30, height: 30, borderRadius: 2, fontSize: 14, cursor: 'pointer' }}>✕</button>
      </div>

      {!active ? (
        /* Conversation list */
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {state.dms.map(dm => (
            <div
              key={dm.id}
              onClick={() => openDM(dm)}
              style={{
                display: 'flex', gap: 12, padding: '14px 16px',
                borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; }}
            >
              <Avatar initials={dm.initials} color={dm.color} size={44} badge={dm.unread > 0 ? dm.unread : null} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700 }}>{dm.with}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted }}>{dm.time}</div>
                </div>
                <div style={{
                  fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13,
                  color: dm.unread > 0 ? T.text : T.muted,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontWeight: dm.unread > 0 ? 600 : 400,
                }}>
                  {dm.lastMsg}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Thread view */
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {activeDM?.messages.map(m => (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.me ? 'flex-end' : 'flex-start', gap: 2 }}>
                <div className={m.me ? 'dm-bubble-me' : 'dm-bubble-them'}>{m.text}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: T.muted, paddingLeft: 4, paddingRight: 4 }}>
                  {m.t}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: '10px 16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8 }}>
            <input
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              className="field-input"
              placeholder="Write a message..."
              style={{ flex: 1, padding: '9px 12px', fontSize: 14 }}
            />
            <button
              onClick={send}
              style={{ background: T.v, border: 'none', color: '#fff', width: 40, height: 40, borderRadius: 2, fontSize: 16, cursor: 'pointer', flexShrink: 0 }}
            >
              ➤
            </button>
          </div>
        </>
      )}
    </PanelOverlay>
  );
}

export default MessagingPanel;
