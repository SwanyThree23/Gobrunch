import T from '@/constants/colors.js';
import { PAYMENTS_LIST, SHARE_LIST } from '@/constants/data.js';
import { Avatar, StatBox } from '@/components/primitives/index.jsx';
import { fmtMoney } from '@/utils/format.js';

const PROFILE_TOOLS = [
  { icon: '📊', label: 'ANALYTICS', color: T.vb },
  { icon: '✂️', label: 'CLIP EDITOR', color: T.acid },
  { icon: '📅', label: 'SCHEDULE', color: T.sig },
  { icon: '⭐', label: 'SUBSCRIBERS', color: T.gold },
  { icon: '💸', label: 'EARNINGS', color: T.green },
  { icon: '🎙', label: 'AUDIO ROOM', color: T.cyan },
];

export function ProfileTab({ state, dispatch, onToast, onGoLive }) {
  const { user } = state;

  const handleSignOut = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const connectedPayments = PAYMENTS_LIST.filter(p => user.payments[p.id]);
  const unconnectedPayments = PAYMENTS_LIST.filter(p => !user.payments[p.id]);

  return (
    <div className="fade-up">
      {/* Profile hero */}
      <div style={{
        padding: '24px 16px 18px', textAlign: 'center',
        borderBottom: `1px solid ${T.border}`,
        background: `radial-gradient(ellipse at 50% 0%, ${T.v}12 0%, transparent 70%)`,
        position: 'relative',
      }}>
        {/* Tier badge */}
        <div style={{
          position: 'absolute', top: 14, right: 16,
          fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: 2,
          background: `${T.gold}20`, border: `1px solid ${T.gold}40`,
          color: T.gold, padding: '4px 8px', borderRadius: 2,
        }}>
          {user.tier}
        </div>

        <div style={{ display: 'inline-block', marginBottom: 12 }}>
          <Avatar initials={user.initials} color={user.avatar} size={72} online={true} />
        </div>

        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, letterSpacing: 2, lineHeight: 1 }}>
          {user.displayName}
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: T.muted, letterSpacing: 1, marginTop: 2 }}>
          {user.name}
        </div>
        <div style={{
          fontFamily: "'Instrument Serif',serif", fontSize: 13, color: T.textD,
          fontStyle: 'italic', marginTop: 8, maxWidth: 260, margin: '8px auto 14px',
        }}>
          {user.bio}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button className="btn-primary" onClick={onGoLive} style={{ fontSize: 12, padding: '7px 16px' }}>
            <span style={{ width: 5, height: 5, background: '#fff', borderRadius: '50%', animation: 'pulseRed 1.2s infinite' }} />
            GO LIVE
          </button>
          <button
            className="btn-ghost"
            onClick={() => onToast('🔗 PROFILE LINK COPIED!')}
            style={{ fontSize: 12, padding: '7px 14px' }}
          >
            SHARE
          </button>
          <button
            className="btn-ghost"
            onClick={() => onToast('✏️ EDIT PROFILE — COMING SOON!')}
            style={{ fontSize: 12, padding: '7px 14px' }}
          >
            EDIT
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <StatBox label="FOLLOWERS" value={user.followers.toLocaleString()} color={T.vb} />
          <StatBox label="STREAMS" value={user.streams} color={T.sig} />
          <StatBox label="EARNED" value={fmtMoney(user.earned)} color={T.green} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
          <StatBox label="FOLLOWING" value={user.following} color={T.muted} />
          <StatBox label="VIEWS" value={`${(user.views / 1000).toFixed(1)}K`} color={T.cyan} />
          <StatBox label="SUBSCRIBERS" value={user.subscribers} color={T.gold} />
        </div>
      </div>

      {/* Connected payments */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{
          fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 2,
          color: T.muted, marginBottom: 10,
        }}>
          PAYMENT CONNECTIONS · 90/10 SPLIT
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PAYMENTS_LIST.map(p => {
            const connected = user.payments[p.id];
            return (
              <div
                key={p.id}
                onClick={() => {
                  dispatch({ type: 'CONNECT_PAYMENT', payload: { method: p.id, value: !connected } });
                  onToast(connected
                    ? `${p.emoji} ${p.name.toUpperCase()} DISCONNECTED`
                    : `${p.emoji} ${p.name.toUpperCase()} CONNECTED — ZERO PLATFORM CUT!`
                  );
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: connected ? `${p.color}10` : T.card,
                  border: `1px solid ${connected ? p.color + '40' : T.border}`,
                  borderRadius: 3, padding: '10px 14px',
                  cursor: 'pointer', transition: 'all .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = connected ? `${p.color}40` : T.border; }}
              >
                <span style={{ fontSize: 18 }}>{p.emoji}</span>
                <span style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 10,
                  letterSpacing: 1, color: connected ? p.color : T.textD, flex: 1,
                }}>
                  {p.name.toUpperCase()}
                </span>
                <div style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: 1,
                  background: connected ? `${p.color}20` : T.dim,
                  border: `1px solid ${connected ? p.color + '30' : T.borderB}`,
                  color: connected ? p.color : T.muted,
                  padding: '3px 8px', borderRadius: 2,
                }}>
                  {connected ? 'CONNECTED' : 'CONNECT'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Creator tools */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{
          fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 2,
          color: T.muted, marginBottom: 10,
        }}>
          CREATOR TOOLS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {PROFILE_TOOLS.map(tool => (
            <div
              key={tool.label}
              onClick={() => onToast(`${tool.icon} ${tool.label}!`)}
              style={{
                background: T.card, border: `1px solid ${tool.color}20`,
                borderRadius: 3, padding: '12px 8px',
                textAlign: 'center', cursor: 'pointer', transition: 'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = tool.color; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${tool.color}20`; }}
            >
              <div style={{ fontSize: 20, marginBottom: 5 }}>{tool.icon}</div>
              <div style={{
                fontFamily: "'DM Mono',monospace", fontSize: 7.5,
                letterSpacing: 1, color: tool.color,
              }}>
                {tool.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share across platforms */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{
          fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 2,
          color: T.muted, marginBottom: 10,
        }}>
          SHARE YOUR PROFILE
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {SHARE_LIST.map(s => (
            <div
              key={s.id}
              onClick={() => onToast(`📤 SHARED TO ${s.name.toUpperCase()}!`)}
              style={{
                flexShrink: 0, background: T.card,
                border: `1px solid ${s.color}25`,
                borderRadius: 3, padding: '10px 12px',
                textAlign: 'center', cursor: 'pointer', transition: 'all .2s',
                minWidth: 64,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${s.color}25`; }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>{s.emoji}</div>
              <div style={{
                fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1, color: s.color,
              }}>
                {s.name.toUpperCase().slice(0, 7)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings / About */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{
          fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 2,
          color: T.muted, marginBottom: 10,
        }}>
          SETTINGS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { icon: '🔔', label: 'Notifications', action: () => onToast('🔔 NOTIFICATION SETTINGS COMING SOON!') },
            { icon: '🔒', label: 'Privacy & Security', action: () => onToast('🔒 PRIVACY SETTINGS COMING SOON!') },
            { icon: '💳', label: 'Billing', action: () => onToast('💳 BILLING PANEL COMING SOON!') },
            { icon: '❓', label: 'Help & Support', action: () => onToast('❓ SUPPORT COMING SOON!') },
          ].map(item => (
            <div
              key={item.label}
              onClick={item.action}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 3, padding: '12px 14px',
                cursor: 'pointer', transition: 'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderB; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: T.textD, flex: 1 }}>
                {item.label}
              </span>
              <span style={{ color: T.muted, fontSize: 12 }}>→</span>
            </div>
          ))}

          {/* About */}
          <div style={{
            background: `${T.v}10`, border: `1px solid ${T.v}22`,
            borderRadius: 3, padding: '12px 14px', marginTop: 4,
          }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 2, color: T.vb, marginBottom: 2 }}>
              ◆ SEEWHY LIVE v3.0
            </div>
            <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 11, color: T.muted, fontStyle: 'italic', lineHeight: 1.6 }}>
              Creator-first streaming. Zero platform fees. Direct payments. Your culture, your rules.
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            style={{
              width: '100%', background: 'none',
              border: `1px solid ${T.borderB}`, borderRadius: 3,
              padding: '12px', cursor: 'pointer',
              fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: 2,
              color: T.muted, transition: 'all .2s',
              marginTop: 4,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff4444'; e.currentTarget.style.color = '#ff4444'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderB; e.currentTarget.style.color = T.muted; }}
          >
            SIGN OUT
          </button>
        </div>
      </div>

      <div style={{ height: 100 }} />
    </div>
  );
}

export default ProfileTab;
