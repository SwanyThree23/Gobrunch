import { useState, useCallback } from 'react';
import T from '@/constants/colors.js';
import { MonoTag } from '@/components/primitives/index.jsx';
import { copyToClipboard } from '@/utils/format.js';

// ── Stopwords for Selective compression ───────────────────────────────────────
const STOPWORDS = new Set([
  'very', 'really', 'quite', 'just', 'literally', 'basically', 'actually',
  'essentially', 'generally', 'certainly', 'definitely', 'absolutely', 'obviously',
  'clearly', 'simply', 'merely', 'truly', 'greatly', 'extremely', 'highly',
  'particularly', 'especially', 'specifically', 'primarily', 'mainly', 'largely',
  'the', 'a', 'an', 'and', 'or', 'but', 'so', 'yet', 'for', 'nor',
  'at', 'by', 'in', 'on', 'up', 'as', 'if', 'it', 'be', 'do',
  'have', 'has', 'had', 'was', 'were', 'is', 'are', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'shall', 'this', 'that', 'these', 'those',
]);

// Estimate tokens (rough approximation: ~1.3 tokens per word)
const estimateTokens = text => Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3);

// ── Compression methods ────────────────────────────────────────────────────────
function compressSelective(text, targetReduction) {
  const words = text.split(/(\s+)/);
  const result = [];
  let removed = 0;
  const targetRemove = Math.floor(words.filter(w => w.trim()).length * (targetReduction / 100));

  for (const word of words) {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    if (STOPWORDS.has(clean) && removed < targetRemove && word.trim()) {
      removed++;
    } else {
      result.push(word);
    }
  }
  return result.join('').replace(/\s{2,}/g, ' ').trim();
}

function compressExtractive(text, targetReduction) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  if (sentences.length <= 1) return compressSelective(text, targetReduction);

  // Score sentences by keyword density
  const wordFreq = {};
  text.toLowerCase().split(/\s+/).forEach(w => {
    const clean = w.replace(/[^a-z]/g, '');
    if (clean && !STOPWORDS.has(clean)) wordFreq[clean] = (wordFreq[clean] || 0) + 1;
  });

  const scored = sentences.map((s, i) => {
    const words = s.toLowerCase().split(/\s+/);
    const score = words.reduce((acc, w) => {
      const clean = w.replace(/[^a-z]/g, '');
      return acc + (wordFreq[clean] || 0);
    }, 0) / (words.length || 1);
    return { s, score, i };
  });

  const keepCount = Math.max(1, Math.ceil(sentences.length * (1 - targetReduction / 100)));
  const kept = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, keepCount)
    .sort((a, b) => a.i - b.i)
    .map(x => x.s);

  return kept.join(' ').trim();
}

function compressIterative(text, targetReduction) {
  const passReduction = Math.min(25, targetReduction / 3);
  let result = text;
  for (let i = 0; i < 3; i++) {
    const currentReduction = (1 - result.length / text.length) * 100;
    if (currentReduction >= targetReduction) break;
    const remaining = targetReduction - currentReduction;
    result = compressSelective(result, Math.min(passReduction, remaining));
  }
  return result;
}

const METHODS = [
  { id: 'selective', name: 'Selective', icon: '🔍', desc: 'Remove stopwords & filler' },
  { id: 'extractive', name: 'Extractive', icon: '📊', desc: 'Keep high-value sentences' },
  { id: 'iterative', name: 'Iterative', icon: '🔄', desc: '3-pass multi-method' },
];

export function LLMLingua() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [method, setMethod] = useState('selective');
  const [target, setTarget] = useState(40);
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);

  const compress = useCallback(() => {
    if (!input.trim()) return;

    let compressed;
    switch (method) {
      case 'selective': compressed = compressSelective(input, target); break;
      case 'extractive': compressed = compressExtractive(input, target); break;
      case 'iterative': compressed = compressIterative(input, target); break;
      default: compressed = input;
    }

    const origTokens = estimateTokens(input);
    const compTokens = estimateTokens(compressed);
    const saved = origTokens - compTokens;
    const reduction = Math.round((saved / origTokens) * 100);

    setOutput(compressed);
    setStats({ origTokens, compTokens, saved: Math.max(0, saved), reduction: Math.max(0, reduction) });
  }, [input, method, target]);

  const handleCopy = async () => {
    if (!output) return;
    await copyToClipboard(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ padding: '14px 16px 0' }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, marginBottom: 4 }}>
        📦 LLMLINGUA COMPRESSION
      </div>
      <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 12, color: T.muted, fontStyle: 'italic', marginBottom: 14 }}>
        Compress prompts to reduce token costs while preserving intent.
      </div>

      {/* Method selector */}
      <div style={{ marginBottom: 14 }}>
        <label className="field-label">COMPRESSION METHOD</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {METHODS.map(m => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              style={{
                flex: 1, padding: 10, borderRadius: 2, textAlign: 'center', cursor: 'pointer',
                background: method === m.id ? `${T.v}18` : T.panel,
                border: `2px solid ${method === m.id ? T.vm : T.border}`,
                color: T.text, transition: 'all .2s',
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>{m.icon}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, letterSpacing: 1, color: method === m.id ? T.vb : T.text }}>
                {m.name}
              </div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, color: T.muted, marginTop: 2 }}>{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Target reduction */}
      <div style={{ marginBottom: 14 }}>
        <label className="field-label">
          TARGET REDUCTION: <span style={{ color: T.acid }}>{target}%</span>
        </label>
        <input
          type="range"
          min={10}
          max={85}
          value={target}
          className="input-range"
          onChange={e => setTarget(+e.target.value)}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono',monospace", fontSize: 7, color: T.muted, marginTop: 4 }}>
          <span>10%</span><span>LIGHT</span><span>MODERATE</span><span>AGGRESSIVE</span><span>85%</span>
        </div>
      </div>

      {/* Input */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label className="field-label" style={{ margin: 0 }}>ORIGINAL PROMPT</label>
          {input && <MonoTag color={T.muted}>~{estimateTokens(input)} tokens</MonoTag>}
        </div>
        <textarea
          className="field-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste your prompt here to compress..."
          style={{ minHeight: 100, resize: 'vertical' }}
        />
      </div>

      <button
        className="btn-acid"
        onClick={compress}
        disabled={!input.trim()}
        style={{ width: '100%', marginBottom: 14, justifyContent: 'center', fontSize: 14 }}
      >
        📦 COMPRESS PROMPT
      </button>

      {/* Stats */}
      {stats && (
        <div className="card-flat" style={{ padding: 12, marginBottom: 12 }} >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: T.border, borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
            {[
              ['ORIGINAL', stats.origTokens + ' tok', T.muted],
              ['COMPRESSED', stats.compTokens + ' tok', T.vb],
              ['SAVED', stats.saved + ' tok', T.green],
              ['REDUCTION', stats.reduction + '%', stats.reduction >= target ? T.acid : T.gold],
            ].map(([l, v, c]) => (
              <div key={l} style={{ background: T.panel, padding: '8px 6px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: c }}>{v}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: T.muted, letterSpacing: 1 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(100, stats.reduction)}%`, background: `linear-gradient(90deg,${T.green},${T.acid})` }} />
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: T.muted, marginTop: 4, textAlign: 'right' }}>
            {stats.reduction}% reduced (target: {target}%)
          </div>
        </div>
      )}

      {/* Output */}
      {output && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label className="field-label" style={{ margin: 0 }}>COMPRESSED OUTPUT</label>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? `${T.green}18` : T.dim,
                border: `1px solid ${copied ? T.green : T.border}`,
                color: copied ? T.green : T.muted,
                borderRadius: 2, padding: '3px 10px',
                fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: 1, cursor: 'pointer',
              }}
            >
              {copied ? '✓ COPIED' : '📋 COPY'}
            </button>
          </div>
          <textarea
            className="field-input"
            value={output}
            readOnly
            style={{ minHeight: 100, resize: 'vertical', opacity: 0.9 }}
          />
        </div>
      )}
    </div>
  );
}

export default LLMLingua;
