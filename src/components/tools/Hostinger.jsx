import { useState } from 'react';
import T from '@/constants/colors.js';
import { MonoTag, Spinner } from '@/components/primitives/index.jsx';

const TLDS = [
  { ext: '.com', price: '$9.99/yr', available: false },
  { ext: '.io', price: '$29.99/yr', available: true },
  { ext: '.co', price: '$19.99/yr', available: true },
  { ext: '.live', price: '$24.99/yr', available: true },
  { ext: '.tv', price: '$39.99/yr', available: false },
];

const HOSTING_PLANS = [
  { name: 'Starter', price: '$2.99/mo', storage: '50GB', sites: '1 website', extras: [] },
  { name: 'Premium', price: '$3.99/mo', storage: '100GB', sites: '100 websites', extras: ['Free domain'] },
  { name: 'Business', price: '$5.99/mo', storage: '200GB + CDN', sites: '100 websites', extras: ['Free domain', 'Priority support'] },
  { name: 'Cloud', price: '$9.99/mo', storage: '300GB', sites: 'Unlimited', extras: ['Free domain', 'Dedicated resources', 'CDN'] },
];

const FILE_TREE = [
  { name: 'public_html', type: 'dir', depth: 0 },
  { name: 'index.php', type: 'file', depth: 1 },
  { name: 'wp-content', type: 'dir', depth: 1 },
  { name: 'uploads', type: 'dir', depth: 2 },
  { name: 'themes', type: 'dir', depth: 2 },
  { name: 'assets', type: 'dir', depth: 1 },
  { name: 'css', type: 'dir', depth: 2 },
  { name: 'style.css', type: 'file', depth: 3 },
  { name: 'js', type: 'dir', depth: 2 },
  { name: 'app.js', type: 'file', depth: 3 },
];

export function Hostinger() {
  const [tab, setTab] = useState('panel');
  const [domain, setDomain] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [ftpHost, setFtpHost] = useState('ftp.seewhylive.com');
  const [sshUser, setSshUser] = useState('seewhy');
  const [sshHost, setSshHost] = useState('server.seewhylive.com');
  const [sshPort, setSshPort] = useState('22');

  const searchDomain = () => {
    if (!domain.trim()) return;
    setSearching(true);
    setTimeout(() => { setSearching(false); setSearched(true); }, 1200);
  };

  const deploy = () => {
    setDeploying(true);
    setTimeout(() => { setDeploying(false); setDeployed(true); }, 2000);
  };

  const sshConfig = `Host seewhylive-prod
  HostName ${sshHost}
  User ${sshUser}
  Port ${sshPort}
  IdentityFile ~/.ssh/id_rsa
  ServerAliveInterval 60`;

  return (
    <div style={{ padding: '14px 16px 0' }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, marginBottom: 4 }}>
        🌐 HOSTINGER PANEL
      </div>
      <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 12, color: T.muted, fontStyle: 'italic', marginBottom: 14 }}>
        Site management, domains, FTP, SSH & hosting plans.
      </div>

      <div style={{ display: 'flex', gap: 5, marginBottom: 14, overflowX: 'auto' }}>
        {['panel', 'domains', 'files', 'ftp', 'plans'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`tab-pill ${tab === t ? 'active' : ''}`}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Control Panel */}
      {tab === 'panel' && (
        <div>
          <div className="card-flat" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: 2 }}>SEEWHYLIVE.COM</div>
                <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
                  <MonoTag color={deployed ? T.green : T.gold}>{deployed ? 'ONLINE' : 'PENDING DEPLOY'}</MonoTag>
                  <MonoTag color={T.cyan}>SSL ✓</MonoTag>
                  <MonoTag color={T.vb}>PHP 8.2</MonoTag>
                </div>
              </div>
              <button
                className="btn-primary"
                onClick={deploy}
                style={{ padding: '8px 14px', fontSize: 11, justifyContent: 'center' }}
              >
                {deploying ? <Spinner size={14} /> : '🚀 DEPLOY'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
              {[
                ['DAILY HITS', '12,450', T.cyan],
                ['STORAGE', '14.2 GB / 200 GB', T.acid],
                ['PHP VER', '8.2.15', T.vb],
              ].map(([l, v, c]) => (
                <div key={l} style={{ background: T.panel, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: c }}>{v}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: T.muted, letterSpacing: 1 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: '🔒', label: 'SSL CERTIFICATE', val: 'Valid · Expires Mar 2027', color: T.green },
              { icon: '📊', label: 'BANDWIDTH', val: '45 GB / 200 GB used', color: T.acid },
              { icon: '📧', label: 'EMAIL ACCOUNTS', val: '3 / 100 active', color: T.vb },
              { icon: '🗄', label: 'DATABASES', val: '2 MySQL, 8.0', color: T.cyan },
            ].map(item => (
              <div key={item.label} className="card-flat" style={{ padding: 12 }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, letterSpacing: 1, color: item.color, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: T.muted }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domain search */}
      {tab === 'domains' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              className="field-input"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="yourdomain"
              onKeyDown={e => e.key === 'Enter' && searchDomain()}
              style={{ flex: 1 }}
            />
            <button className="btn-acid" onClick={searchDomain} style={{ padding: '0 16px', fontSize: 12 }}>
              {searching ? <Spinner size={16} /> : 'SEARCH'}
            </button>
          </div>

          {searched && (
            <div className="card-flat" style={{ padding: 14 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 2, marginBottom: 10 }}>
                RESULTS FOR "{domain}"
              </div>
              {TLDS.map(tld => (
                <div key={tld.ext} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 0', borderBottom: `1px solid ${T.border}`,
                }}>
                  <div>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: tld.available ? T.text : T.muted }}>
                      {domain}{tld.ext}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted }}>{tld.price}</span>
                    {tld.available ? (
                      <button className="btn-acid" style={{ padding: '3px 12px', fontSize: 10 }}>ADD</button>
                    ) : (
                      <MonoTag color={T.sig}>TAKEN</MonoTag>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <label className="field-label">CONNECTED DOMAINS</label>
            {['seewhylive.com', 'seewhylive.io', 'seewhy.live'].map(d => (
              <div key={d} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 600 }}>{d}</div>
                <MonoTag color={T.green}>ACTIVE</MonoTag>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File manager */}
      {tab === 'files' && (
        <div className="card-flat" style={{ padding: 14 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 2, marginBottom: 10 }}>FILE MANAGER</div>
          {FILE_TREE.map((f, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 0',
                paddingLeft: f.depth * 14,
                borderBottom: f.type === 'dir' ? `1px solid ${T.border}` : 'none',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 12 }}>{f.type === 'dir' ? '📁' : '📄'}</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: f.type === 'dir' ? T.vb : T.textD }}>
                {f.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* FTP/SFTP */}
      {tab === 'ftp' && (
        <div>
          <div className="card-flat" style={{ padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 2, marginBottom: 12 }}>FTP CONNECTION</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label className="field-label">FTP HOST</label>
                <input className="field-input" value={ftpHost} onChange={e => setFtpHost(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label className="field-label">USERNAME</label>
                  <input className="field-input" defaultValue="seewhy_ftp" />
                </div>
                <div>
                  <label className="field-label">PORT</label>
                  <input className="field-input" defaultValue="21" />
                </div>
              </div>
              <button className="btn-ghost" style={{ width: '100%', textAlign: 'center' }}>CONNECT VIA SFTP</button>
            </div>
          </div>

          <div className="card-flat" style={{ padding: 14 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 2, marginBottom: 12 }}>SSH CONFIG GENERATOR</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label className="field-label">SSH HOST</label>
                  <input className="field-input" value={sshHost} onChange={e => setSshHost(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">PORT</label>
                  <input className="field-input" value={sshPort} onChange={e => setSshPort(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="field-label">USERNAME</label>
                <input className="field-input" value={sshUser} onChange={e => setSshUser(e.target.value)} />
              </div>
            </div>
            <label className="field-label">GENERATED ~/.ssh/config BLOCK</label>
            <pre style={{
              background: T.obs, border: `1px solid ${T.border}`, borderRadius: 2,
              padding: 12, fontFamily: "'DM Mono',monospace", fontSize: 10,
              color: T.acid, overflow: 'auto', whiteSpace: 'pre',
            }}>
              {sshConfig}
            </pre>
          </div>
        </div>
      )}

      {/* Hosting plans */}
      {tab === 'plans' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {HOSTING_PLANS.map((plan, i) => (
            <div key={plan.name} className="card-flat" style={{ padding: 14, border: `1px solid ${i === 2 ? T.v : T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2 }}>{plan.name}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted }}>{plan.sites}</div>
                </div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: T.acid }}>{plan.price}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <MonoTag color={T.cyan}>{plan.storage}</MonoTag>
                {plan.extras.map(e => <MonoTag key={e} color={T.vb}>{e}</MonoTag>)}
              </div>
              <button className={i === 2 ? 'btn-primary' : 'btn-ghost'} style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}>
                SELECT {plan.name.toUpperCase()}
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 20 }} />
    </div>
  );
}

export default Hostinger;
