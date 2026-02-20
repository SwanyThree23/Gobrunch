import { useState } from 'react';
import T from '@/constants/colors.js';
import { PanelOverlay, BackButton } from '@/components/primitives/index.jsx';
import CameraStudio from './CameraStudio.jsx';
import AIChat from './AIChat.jsx';
import LLMLingua from './LLMLingua.jsx';
import InsForge from './InsForge.jsx';
import Hostinger from './Hostinger.jsx';

const TOOLS = [
  { id: 'camera', icon: '📷', label: 'Camera Studio', desc: 'Real camera, VU meter, screen share', color: T.sig },
  { id: 'ai', icon: '🤖', label: 'AI Chat', desc: 'OpenRouter · 8 models · streaming', color: T.vb },
  { id: 'lingua', icon: '📦', label: 'LLMLingua', desc: 'Compress prompts, save tokens', color: T.acid },
  { id: 'insforge', icon: '🏗', label: 'InsForge', desc: 'Infrastructure monitor & scaling', color: T.cyan },
  { id: 'hostinger', icon: '🌐', label: 'Hostinger', desc: 'Hosting panel, domains, FTP, SSH', color: T.gold },
];

export function ToolsHub({ state, dispatch, onClose }) {
  const [activeTool, setActiveTool] = useState(null);

  return (
    <PanelOverlay>
      {/* Header */}
      <div className="top-bar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {activeTool && (
            <BackButton onClick={() => setActiveTool(null)} />
          )}
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2 }}>
              {activeTool ? TOOLS.find(t => t.id === activeTool)?.label : 'TOOLS HUB'}
            </div>
            {!activeTool && (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: T.muted, letterSpacing: 1.5 }}>
                {TOOLS.length} CREATOR TOOLS AVAILABLE
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: T.dim, border: `1px solid ${T.border}`, color: T.text, width: 30, height: 30, borderRadius: 2, fontSize: 14, cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      {/* Tool selector */}
      {!activeTool && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 13, color: T.muted, fontStyle: 'italic', marginBottom: 18 }}>
            Professional tools for creators — camera studio, AI, prompt compression, infrastructure & hosting.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TOOLS.map(tool => (
              <div
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className="card-base"
                style={{
                  padding: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 3,
                  background: `${tool.color}18`, border: `1px solid ${tool.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0,
                }}>
                  {tool.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, letterSpacing: 1, color: tool.color, marginBottom: 3 }}>
                    {tool.label.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: T.muted }}>
                    {tool.desc}
                  </div>
                </div>
                <div style={{ color: T.muted, fontSize: 16 }}>→</div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div style={{
            marginTop: 20, padding: 14,
            background: `${T.v}10`, border: `1px solid ${T.v}22`, borderRadius: 2,
          }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 2, color: T.vb, marginBottom: 4 }}>
              ⚡ CREATOR TOOLKIT v3.0
            </div>
            <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 12, color: T.muted, fontStyle: 'italic', lineHeight: 1.6 }}>
              Real WebRTC camera studio · OpenRouter AI with 8 models · Client-side LLMLingua compression · InsForge infrastructure monitoring · Full Hostinger hosting panel.
            </div>
          </div>
        </div>
      )}

      {/* Active tool view */}
      {activeTool && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTool === 'camera' && <CameraStudio />}
          {activeTool === 'ai' && <AIChat state={state} dispatch={dispatch} />}
          {activeTool === 'lingua' && <LLMLingua />}
          {activeTool === 'insforge' && <InsForge state={state} dispatch={dispatch} />}
          {activeTool === 'hostinger' && <Hostinger />}
        </div>
      )}
    </PanelOverlay>
  );
}

export default ToolsHub;
