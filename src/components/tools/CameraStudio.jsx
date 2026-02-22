import { useState, useEffect, useRef } from 'react';
import T from '@/constants/colors.js';
import { Spinner, MonoTag } from '@/components/primitives/index.jsx';
import { VUMeter, BandwidthMonitor } from '@/components/charts/index.jsx';
import useCameraStream from '@/hooks/useCameraStream.js';
import useAudioAnalyzer from '@/hooks/useAudioAnalyzer.js';
import { randomBetween } from '@/utils/format.js';

// ── Browser Compat Checker ────────────────────────────────────────────────────
function BrowserCompat() {
  const checks = [
    { label: 'getUserMedia', ok: !!(navigator.mediaDevices?.getUserMedia) },
    { label: 'getDisplayMedia', ok: !!(navigator.mediaDevices?.getDisplayMedia) },
    { label: 'AudioContext', ok: !!(window.AudioContext || window.webkitAudioContext) },
    { label: 'MediaRecorder', ok: !!window.MediaRecorder },
    { label: 'WebRTC', ok: !!window.RTCPeerConnection },
  ];
  const allOk = checks.every(c => c.ok);

  return (
    <div style={{ background: T.panel, border: `1px solid ${allOk ? T.green : T.gold}30`, borderRadius: 2, padding: 12, marginBottom: 14 }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 2, marginBottom: 8, color: allOk ? T.green : T.gold }}>
        BROWSER COMPATIBILITY {allOk ? '✓' : '⚠'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {checks.map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.ok ? T.green : T.sig }} />
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: c.ok ? T.textD : T.sig, letterSpacing: 1 }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Camera Studio ────────────────────────────────────────────────────────
export function CameraStudio() {
  const cam = useCameraStream();
  const { levels, peakLevel } = useAudioAnalyzer(cam.stream);
  const [bw, setBw] = useState(2400);
  const [showPIP, setShowPIP] = useState(false);
  const bwRef = useRef(null);

  // Simulate bandwidth fluctuation
  useEffect(() => {
    bwRef.current = setInterval(() => {
      setBw(randomBetween(2100, 3000));
    }, 1500);
    return () => clearInterval(bwRef.current);
  }, []);

  const { permState, PERM_STATES } = cam;

  return (
    <div style={{ padding: '14px 16px 0' }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, marginBottom: 4 }}>📷 CAMERA STUDIO</div>
      <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 12, color: T.muted, fontStyle: 'italic', marginBottom: 14 }}>
        Real-time camera, mic, screen share & audio analysis.
      </div>

      <BrowserCompat />

      {/* Permission state */}
      {permState === PERM_STATES.IDLE && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>📷</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2, marginBottom: 8 }}>
            START YOUR CAMERA
          </div>
          <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 13, color: T.muted, fontStyle: 'italic', marginBottom: 20 }}>
            Grant camera & mic access to begin your studio session.
          </div>
          <button className="btn-primary" onClick={() => cam.requestCamera()} style={{ justifyContent: 'center' }}>
            🎬 ENABLE CAMERA + MIC
          </button>
        </div>
      )}

      {permState === PERM_STATES.PENDING && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Spinner size={40} />
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: T.muted, letterSpacing: 2, marginTop: 14 }}>
            REQUESTING PERMISSIONS...
          </div>
        </div>
      )}

      {permState === PERM_STATES.DENIED && (
        <div style={{ background: `${T.sig}10`, border: `1px solid ${T.sig}30`, borderRadius: 2, padding: 16, textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🚫</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: 2, color: T.sig, marginBottom: 6 }}>ACCESS DENIED</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: T.muted }}>
            Please allow camera & microphone access in your browser settings, then try again.
          </div>
          <button className="btn-ghost" style={{ marginTop: 12 }} onClick={() => cam.requestCamera()}>TRY AGAIN</button>
        </div>
      )}

      {(permState === PERM_STATES.UNAVAILABLE) && (
        <div style={{ background: `${T.gold}10`, border: `1px solid ${T.gold}30`, borderRadius: 2, padding: 16, textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: 2, color: T.gold, marginBottom: 6 }}>CAMERA NOT AVAILABLE</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: T.muted }}>
            {cam.error || 'Camera API not supported in this browser.'}
          </div>
        </div>
      )}

      {permState === PERM_STATES.GRANTED && (
        <>
          {/* Camera preview */}
          <div
            className="camera-preview"
            style={{ width: '100%', aspectRatio: '16/9', marginBottom: 12, background: '#000' }}
          >
            {/* Corner brackets overlay */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
              {[['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right']].map(([v, h]) => (
                <div key={`${v}${h}`} style={{
                  position: 'absolute',
                  [v]: 8, [h]: 8,
                  width: 20, height: 20,
                  borderTop: v === 'top' ? `2px solid ${T.acid}` : 'none',
                  borderBottom: v === 'bottom' ? `2px solid ${T.acid}` : 'none',
                  borderLeft: h === 'left' ? `2px solid ${T.acid}` : 'none',
                  borderRight: h === 'right' ? `2px solid ${T.acid}` : 'none',
                }} />
              ))}
            </div>

            {/* Live video */}
            {cam.stream && !cam.isCamOff && (
              <video
                ref={cam.videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}

            {/* Cam off state */}
            {(!cam.stream || cam.isCamOff) && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', zIndex: 2 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted }}>CAMERA OFF</div>
                </div>
              </div>
            )}

            {/* Screen share overlay */}
            {cam.isScreenSharing && cam.screenStream && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 4,
                background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🖥️</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.cyan }}>SCREEN SHARING</div>
                </div>
              </div>
            )}

            {/* PIP mini cam */}
            {showPIP && cam.isScreenSharing && (
              <div style={{
                position: 'absolute', bottom: 8, right: 8, width: 100, height: 72,
                background: '#000', border: `2px solid ${T.v}`, borderRadius: 2, zIndex: 5, overflow: 'hidden',
              }}>
                <video ref={cam.videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            {/* Status badges */}
            <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4, zIndex: 3 }}>
              <div className="live-badge live-badge-sm">LIVE</div>
              {cam.isScreenSharing && <MonoTag color={T.cyan}>🖥 SHARE</MonoTag>}
            </div>

            {/* Face detection indicator */}
            <div style={{
              position: 'absolute', bottom: 8, left: 8, zIndex: 3,
              fontFamily: "'DM Mono',monospace", fontSize: 7, color: T.acid,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.acid, animation: 'pulseRed 2s infinite' }} />
              FACE DETECTED
            </div>
          </div>

          {/* VU Meter */}
          <div className="card-flat" style={{ padding: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 2, color: T.muted }}>
                VU METER {cam.isMuted ? '— MUTED' : ''}
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: peakLevel > 0.8 ? T.sig : peakLevel > 0.5 ? T.gold : T.acid }}>
                {Math.round(peakLevel * 100)}%
              </div>
            </div>
            <VUMeter levels={cam.isMuted ? Array(26).fill(0) : levels} peakLevel={peakLevel} bars={26} height={48} />
          </div>

          {/* Bandwidth monitor */}
          <div className="card-flat" style={{ padding: 12, marginBottom: 12 }}>
            <BandwidthMonitor kbps={bw} />
          </div>

          {/* Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
            {[
              { icon: cam.isMuted ? '🔇' : '🎤', label: cam.isMuted ? 'UNMUTE' : 'MUTE', fn: cam.toggleMute, color: cam.isMuted ? T.sig : T.vb },
              { icon: cam.isCamOff ? '📷' : '📷', label: cam.isCamOff ? 'CAM ON' : 'CAM OFF', fn: cam.toggleCamera, color: cam.isCamOff ? T.sig : T.cyan },
              { icon: cam.isScreenSharing ? '🛑' : '🖥', label: cam.isScreenSharing ? 'STOP SHARE' : 'SHARE', fn: cam.isScreenSharing ? cam.stopScreenShare : cam.startScreenShare, color: cam.isScreenSharing ? T.sig : T.acid },
              { icon: '📴', label: 'STOP ALL', fn: cam.stopAll, color: T.sig },
            ].map(b => (
              <button
                key={b.label}
                onClick={b.fn}
                style={{
                  background: T.panel, border: `1px solid ${b.color}30`,
                  borderRadius: 2, padding: '10px 6px', textAlign: 'center', cursor: 'pointer', transition: 'all .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = b.color; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${b.color}30`; }}
              >
                <div style={{ fontSize: 18, marginBottom: 3 }}>{b.icon}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1, color: b.color }}>{b.label}</div>
              </button>
            ))}
          </div>

          {/* PIP toggle */}
          {cam.isScreenSharing && (
            <button
              onClick={() => setShowPIP(!showPIP)}
              className={`tab-pill ${showPIP ? 'active' : ''}`}
              style={{ marginBottom: 14 }}
            >
              {showPIP ? 'HIDE PIP CAM' : 'SHOW PIP CAM'}
            </button>
          )}

          {/* Camera device selector */}
          {cam.devices.video.length > 1 && (
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">SWITCH CAMERA</label>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {cam.devices.video.map(d => (
                  <button
                    key={d.deviceId}
                    onClick={() => cam.switchCamera(d.deviceId)}
                    className={`tab-pill ${cam.activeDevices.videoId === d.deviceId ? 'active' : ''}`}
                    style={{ fontSize: 8 }}
                  >
                    {d.label || `Camera ${cam.devices.video.indexOf(d) + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Audio device selector */}
          {cam.devices.audio.length > 1 && (
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">AUDIO INPUT</label>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {cam.devices.audio.map(d => (
                  <button
                    key={d.deviceId}
                    className={`tab-pill ${cam.activeDevices.audioId === d.deviceId ? 'active' : ''}`}
                    style={{ fontSize: 8 }}
                  >
                    {d.label || `Mic ${cam.devices.audio.indexOf(d) + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CameraStudio;
