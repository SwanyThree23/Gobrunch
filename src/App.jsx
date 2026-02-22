import { useReducer, useState, useCallback } from 'react';
import { INITIAL_STATE } from './store/initialState.js';
import { reducer } from './store/reducer.js';

import { AuthScreen } from './components/auth/AuthScreen.jsx';
import { Toast } from './components/primitives/index.jsx';

import { HomeTab } from './components/tabs/HomeTab.jsx';
import { LiveTab } from './components/tabs/LiveTab.jsx';
import { PostsTab } from './components/tabs/PostsTab.jsx';
import { RoomsTab } from './components/tabs/RoomsTab.jsx';
import { DashboardTab } from './components/tabs/DashboardTab.jsx';
import { ProfileTab } from './components/tabs/ProfileTab.jsx';

import { LiveRoom } from './components/live/LiveRoom.jsx';

import { NotificationsPanel } from './components/overlays/NotificationsPanel.jsx';
import { MessagingPanel } from './components/overlays/MessagingPanel.jsx';
import { DiscoveryPanel } from './components/overlays/DiscoveryPanel.jsx';
import { ToolsHub } from './components/tools/ToolsHub.jsx';

import { GoLiveModal } from './components/modals/GoLiveModal.jsx';
import { PaymentModal } from './components/modals/PaymentModal.jsx';
import { ShareModal } from './components/modals/ShareModal.jsx';
import { PaywallModal } from './components/modals/PaywallModal.jsx';

import T from './constants/colors.js';

const TABS = ['HOME', 'LIVE', 'POSTS', 'ROOMS', 'DASH'];
const TAB_ICONS = {
  HOME: '⬡',
  LIVE: '◉',
  POSTS: '▦',
  ROOMS: '◈',
  DASH: '◆',
};

function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [activeTab, setActiveTab] = useState('HOME');

  // Overlay / panel states
  const [showNotifs, setShowNotifs] = useState(false);
  const [showDMs, setShowDMs] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTools, setShowTools] = useState(false);

  // Modal states
  const [showGoLive, setShowGoLive] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [paywallItem, setPaywallItem] = useState(null);

  // Live room state
  const [activeStream, setActiveStream] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const unreadNotifs = state.notifications.filter(n => !n.read).length;
  const unreadDMs = state.dms.reduce((s, d) => s + d.unread, 0);

  // Auth gate
  if (!state.auth) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', height: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <AuthScreen onLogin={(user) => dispatch({ type: 'LOGIN', payload: user })} />
      </div>
    );
  }

  // Live room fullscreen
  if (activeStream) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', height: '100dvh', overflow: 'hidden', position: 'relative' }}>
        <LiveRoom
          stream={activeStream}
          onBack={() => setActiveStream(null)}
          onToast={showToast}
        />
        {toast && <Toast msg={toast} />}
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto', height: '100dvh',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
      background: T.obs,
    }}>
      {/* ── TOP BAR ── */}
      <div className="top-bar" style={{ justifyContent: 'space-between', flexShrink: 0 }}>
        {/* Logo + Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            className="chroma"
            style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 3, cursor: 'pointer' }}
            onClick={() => setActiveTab('HOME')}
          >
            SEEWHY
          </div>
          <button
            onClick={() => setShowSearch(true)}
            style={{
              background: T.dim, border: `1px solid ${T.borderB}`,
              color: T.muted, width: 30, height: 30, borderRadius: 2,
              fontSize: 13, cursor: 'pointer', transition: 'border-color .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.acid; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderB; }}
            title="Search"
          >
            ⌕
          </button>
        </div>

        {/* Right cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Tools */}
          <button
            onClick={() => setShowTools(true)}
            style={{
              background: T.dim, border: `1px solid ${T.borderB}`,
              color: T.muted, width: 30, height: 30, borderRadius: 2,
              fontSize: 13, cursor: 'pointer', transition: 'border-color .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.vb; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderB; }}
            title="Tools Hub"
          >
            ⚙
          </button>

          {/* DMs */}
          <button
            onClick={() => setShowDMs(true)}
            style={{
              background: T.dim, border: `1px solid ${T.borderB}`,
              color: unreadDMs > 0 ? T.cyan : T.muted,
              width: 30, height: 30, borderRadius: 2,
              fontSize: 13, cursor: 'pointer', position: 'relative',
              transition: 'border-color .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.cyan; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderB; }}
            title="Messages"
          >
            ✉
            {unreadDMs > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                width: 14, height: 14, borderRadius: '50%',
                background: T.cyan, color: '#000',
                fontFamily: "'DM Mono',monospace", fontSize: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unreadDMs}
              </span>
            )}
          </button>

          {/* Notifications */}
          <button
            onClick={() => setShowNotifs(true)}
            style={{
              background: T.dim, border: `1px solid ${T.borderB}`,
              color: unreadNotifs > 0 ? T.gold : T.muted,
              width: 30, height: 30, borderRadius: 2,
              fontSize: 13, cursor: 'pointer', position: 'relative',
              transition: 'border-color .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderB; }}
            title="Notifications"
          >
            🔔
            {unreadNotifs > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                width: 14, height: 14, borderRadius: '50%',
                background: T.gold, color: '#000',
                fontFamily: "'DM Mono',monospace", fontSize: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unreadNotifs}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {activeTab === 'HOME' && (
          <HomeTab
            onStreamOpen={setActiveStream}
            onGoLive={() => setShowGoLive(true)}
            onToast={showToast}
          />
        )}
        {activeTab === 'LIVE' && (
          <LiveTab onStreamOpen={setActiveStream} />
        )}
        {activeTab === 'POSTS' && (
          <PostsTab
            onPaywall={setPaywallItem}
            onToast={showToast}
          />
        )}
        {activeTab === 'ROOMS' && (
          <RoomsTab
            onStreamOpen={setActiveStream}
            onToast={showToast}
          />
        )}
        {activeTab === 'DASH' && (
          <DashboardTab
            state={state}
            dispatch={dispatch}
            onToast={showToast}
          />
        )}
        {activeTab === 'PROFILE' && (
          <ProfileTab
            state={state}
            dispatch={dispatch}
            onToast={showToast}
            onGoLive={() => setShowGoLive(true)}
          />
        )}
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav className="nav-bottom" style={{ flexShrink: 0 }}>
        {[...TABS, 'PROFILE'].map(tab => {
          const icon = tab === 'PROFILE' ? state.user.initials : TAB_ICONS[tab];
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              {tab === 'PROFILE' ? (
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: isActive ? state.user.avatar : T.dim,
                  border: `2px solid ${isActive ? state.user.avatar : T.borderB}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'DM Mono',monospace", fontSize: 8,
                  color: isActive ? '#fff' : T.muted, marginBottom: 2,
                  transition: 'all .2s',
                }}>
                  {state.user.initials}
                </div>
              ) : (
                <div style={{
                  fontSize: tab === 'HOME' ? 16 : 14,
                  marginBottom: 2,
                  color: isActive ? T.acid : T.muted,
                  transition: 'color .2s',
                }}>
                  {icon}
                </div>
              )}
              <div style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: 7, letterSpacing: 1,
                color: isActive ? T.acid : T.muted,
                transition: 'color .2s',
              }}>
                {tab}
              </div>
            </button>
          );
        })}
      </nav>

      {/* ── OVERLAYS ── */}
      {showNotifs && (
        <NotificationsPanel
          state={state}
          dispatch={dispatch}
          onClose={() => setShowNotifs(false)}
        />
      )}
      {showDMs && (
        <MessagingPanel
          state={state}
          dispatch={dispatch}
          onClose={() => setShowDMs(false)}
        />
      )}
      {showSearch && (
        <DiscoveryPanel
          state={state}
          onClose={() => setShowSearch(false)}
          onStreamOpen={(s) => { setShowSearch(false); setActiveStream(s); }}
          onToast={showToast}
        />
      )}
      {showTools && (
        <ToolsHub
          state={state}
          dispatch={dispatch}
          onClose={() => setShowTools(false)}
        />
      )}

      {/* ── MODALS ── */}
      {showGoLive && (
        <GoLiveModal
          onClose={() => setShowGoLive(false)}
          onLaunch={(config) => {
            setShowGoLive(false);
            const mockStream = {
              id: 'live-' + Date.now(),
              host: state.user.displayName,
              title: config.title || 'Live Stream',
              category: config.category || 'CULTURE',
              viewers: 1,
              guests: 0,
              color: T.sig,
              initials: state.user.initials,
              avatar: state.user.avatar,
              config,
            };
            setActiveStream(mockStream);
            showToast('🔴 YOU\'RE LIVE!');
          }}
        />
      )}
      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onSuccess={(method, amount) => {
            setShowPayment(false);
            showToast(`💸 PAYMENT SENT VIA ${method.toUpperCase()}!`);
          }}
        />
      )}
      {showShare && (
        <ShareModal
          onClose={() => setShowShare(false)}
          onToast={showToast}
        />
      )}
      {paywallItem && (
        <PaywallModal
          item={paywallItem}
          onClose={() => setPaywallItem(null)}
          onUnlock={() => {
            setPaywallItem(null);
            showToast('🔓 CONTENT UNLOCKED!');
          }}
        />
      )}

      {/* ── TOAST ── */}
      {toast && <Toast msg={toast} />}
    </div>
  );
}

export default App;
