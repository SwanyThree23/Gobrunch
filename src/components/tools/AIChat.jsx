import { useState, useRef, useEffect } from 'react';
import T from '@/constants/colors.js';
import { AI_MODELS, AI_PERSONAS } from '@/constants/data.js';
import { Avatar, Spinner, MonoTag } from '@/components/primitives/index.jsx';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Falls back to VITE_OPENROUTER_KEY env var if no key stored in state
const ENV_KEY = import.meta.env.VITE_OPENROUTER_KEY || '';

export function AIChat({ state, dispatch }) {
  const { aiChat } = state;
  const [input, setInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(aiChat.apiKey || ENV_KEY);
  const [customSystem, setCustomSystem] = useState(aiChat.customSystem || '');
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [aiChat.messages]);

  const getSystemPrompt = () => {
    const persona = AI_PERSONAS.find(p => p.id === aiChat.persona);
    if (aiChat.persona === 'custom') return customSystem;
    return persona?.system || '';
  };

  const send = async () => {
    if (!input.trim() || aiChat.streaming) return;
    const key = aiChat.apiKey || apiKeyInput || ENV_KEY;
    if (!key) { setShowKey(true); return; }

    const userMsg = input.trim();
    setInput('');
    dispatch({ type: 'AI_SEND_MSG', content: userMsg });

    // Build message history
    const history = [
      ...(getSystemPrompt() ? [{ role: 'system', content: getSystemPrompt() }] : []),
      ...aiChat.messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMsg },
    ];

    const assistantId = Date.now() + 1;
    dispatch({ type: 'AI_START_RESPONSE', id: assistantId });

    try {
      abortRef.current = new AbortController();
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://seewhylive.com',
          'X-Title': 'SeeWhy LIVE AI Tools',
        },
        body: JSON.stringify({
          model: aiChat.model,
          messages: history,
          stream: true,
          max_tokens: 1024,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        dispatch({ type: 'AI_APPEND_RESPONSE', id: assistantId, chunk: `⚠ Error: ${err.error?.message || res.statusText}` });
        dispatch({ type: 'AI_DONE', promptTokens: 0, completionTokens: 0 });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let promptTokens = 0, completionTokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content || '';
            if (delta) dispatch({ type: 'AI_APPEND_RESPONSE', id: assistantId, chunk: delta });
            if (json.usage) {
              promptTokens = json.usage.prompt_tokens || 0;
              completionTokens = json.usage.completion_tokens || 0;
            }
          } catch {}
        }
      }
      dispatch({ type: 'AI_DONE', promptTokens, completionTokens });
    } catch (err) {
      if (err.name !== 'AbortError') {
        dispatch({ type: 'AI_APPEND_RESPONSE', id: assistantId, chunk: `⚠ Connection error: ${err.message}` });
        dispatch({ type: 'AI_DONE', promptTokens: 0, completionTokens: 0 });
      }
    }
  };

  const saveKey = () => {
    dispatch({ type: 'SET_AI_KEY', key: apiKeyInput });
    localStorage.setItem('sw_openrouter_key', apiKeyInput);
    setShowKey(false);
  };

  const currentModel = AI_MODELS.find(m => m.id === aiChat.model);
  const currentPersona = AI_PERSONAS.find(p => p.id === aiChat.persona);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header controls */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Model selector */}
        <div>
          <label className="field-label">AI MODEL</label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {AI_MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => dispatch({ type: 'SET_AI_MODEL', model: m.id })}
                className={`tab-pill ${aiChat.model === m.id ? 'active' : ''}`}
                style={{ fontSize: 8, borderColor: aiChat.model === m.id ? m.color : undefined }}
              >
                {m.name.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Persona selector */}
        <div>
          <label className="field-label">SYSTEM PERSONA</label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {AI_PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => dispatch({ type: 'SET_AI_PERSONA', persona: p.id })}
                className={`tab-pill ${aiChat.persona === p.id ? 'active' : ''}`}
                style={{ fontSize: 8 }}
              >
                {p.name}
              </button>
            ))}
          </div>
          {aiChat.persona === 'custom' && (
            <textarea
              className="field-input"
              value={customSystem}
              onChange={e => { setCustomSystem(e.target.value); dispatch({ type: 'SET_CUSTOM_SYSTEM', system: e.target.value }); }}
              placeholder="Enter your custom system prompt..."
              style={{ marginTop: 8, height: 70, resize: 'vertical' }}
            />
          )}
        </div>

        {/* Token usage + controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <MonoTag color={T.muted}>↑ {aiChat.tokenUsage.prompt}</MonoTag>
            <MonoTag color={T.muted}>↓ {aiChat.tokenUsage.completion}</MonoTag>
            <MonoTag color={aiChat.tokenUsage.total > 0 ? T.acid : T.muted}>Σ {aiChat.tokenUsage.total}</MonoTag>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setShowKey(!showKey)}
              style={{ background: T.dim, border: `1px solid ${aiChat.apiKey ? T.green : T.border}`, color: aiChat.apiKey ? T.green : T.muted, borderRadius: 2, padding: '3px 8px', fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: 1, cursor: 'pointer' }}
            >
              {aiChat.apiKey ? '🔑 KEY SET' : '🔑 API KEY'}
            </button>
            {aiChat.messages.length > 0 && (
              <button
                onClick={() => dispatch({ type: 'AI_CLEAR' })}
                style={{ background: T.dim, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 2, padding: '3px 8px', fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: 1, cursor: 'pointer' }}
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* API key input */}
        {showKey && (
          <div style={{ display: 'flex', gap: 8 }} className="fade-up">
            <input
              className="field-input"
              type="password"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="sk-or-..."
              style={{ flex: 1, fontSize: 12 }}
              onKeyDown={e => e.key === 'Enter' && saveKey()}
            />
            <button className="btn-acid" onClick={saveKey} style={{ padding: '8px 14px', fontSize: 11 }}>SAVE</button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {aiChat.messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, marginBottom: 6 }}>
              OPENROUTER AI CHAT
            </div>
            <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 13, color: T.muted, fontStyle: 'italic', lineHeight: 1.6 }}>
              {aiChat.apiKey
                ? `Connected to ${currentModel?.name}. Ask anything.`
                : 'Enter your OpenRouter API key above to get started.'}
            </div>
            {/* Quick prompts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
              {[
                'What are the best stream title ideas for tech content?',
                'How do I grow my live streaming audience fast?',
                'Write a 60-second stream intro script for me',
              ].map(p => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  style={{
                    background: T.panel, border: `1px solid ${T.border}`, color: T.textD,
                    borderRadius: 2, padding: '8px 12px', textAlign: 'left',
                    fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, cursor: 'pointer',
                    transition: 'border-color .2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.v; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          aiChat.messages.map(m => (
            <div
              key={m.id}
              className={m.role === 'user' ? 'ai-msg-user' : 'ai-msg-assistant'}
            >
              {m.role === 'assistant' && (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: currentModel?.color || T.vb, letterSpacing: 2, marginBottom: 6 }}>
                  {currentModel?.name?.toUpperCase()}
                </div>
              )}
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {m.content}
                {m.role === 'assistant' && aiChat.streaming && m === aiChat.messages[aiChat.messages.length - 1] && (
                  <span className="ai-cursor" />
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 16px 20px', borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            className="field-input"
            placeholder={aiChat.apiKey ? `Message ${currentModel?.name || 'AI'}... (Enter to send)` : 'Set your API key first...'}
            style={{ flex: 1, height: 56, resize: 'none', fontSize: 13 }}
            disabled={aiChat.streaming}
          />
          <button
            onClick={aiChat.streaming ? () => abortRef.current?.abort() : send}
            style={{
              width: 48, height: 56, borderRadius: 2, border: 'none',
              background: aiChat.streaming ? `${T.sig}cc` : T.v,
              color: '#fff', fontSize: aiChat.streaming ? 11 : 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'DM Mono',monospace",
            }}
          >
            {aiChat.streaming ? '■' : '➤'}
          </button>
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: T.muted, letterSpacing: 1, marginTop: 5, textAlign: 'center' }}>
          SHIFT+ENTER FOR NEW LINE · POWERED BY OPENROUTER.AI
        </div>
      </div>
    </div>
  );
}

export default AIChat;
