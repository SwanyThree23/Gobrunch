'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Loader2,
  ExternalLink,
  Webhook,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/lib/hooks/useAuthStore';
import { formatRelativeTime } from '@/lib/utils';
import type { AutomationTrigger, AutomationWebhook } from '@/types';

interface TriggerInfo {
  trigger: AutomationTrigger;
  description: string;
  example: Record<string, unknown>;
}

export default function AutomationsPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [webhooks, setWebhooks] = useState<AutomationWebhook[]>([]);
  const [availableTriggers, setAvailableTriggers] = useState<TriggerInfo[]>([]);
  const [inboundUrl, setInboundUrl] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  // Create form
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newTriggers, setNewTriggers] = useState<AutomationTrigger[]>([]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/automation/webhooks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setWebhooks(data.data.webhooks);
        setAvailableTriggers(data.data.availableTriggers);
        setInboundUrl(data.data.inboundWebhookUrl);
      }
    } catch {
      setError('Failed to load automations');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCopy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleCreate() {
    if (!newName || !newUrl || newTriggers.length === 0) {
      setError('Name, URL, and at least one trigger are required');
      return;
    }
    setError('');
    try {
      const res = await fetch('/api/automation/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'create', name: newName, targetUrl: newUrl, triggers: newTriggers }),
      });
      const data = await res.json();
      if (data.success) {
        setWebhooks([...webhooks, data.data]);
        setNewName('');
        setNewUrl('');
        setNewTriggers([]);
        setShowCreate(false);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to create webhook');
    }
  }

  async function handleDelete(webhookId: string) {
    try {
      await fetch('/api/automation/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete', webhookId }),
      });
      setWebhooks(webhooks.filter((w) => w.id !== webhookId));
    } catch {
      // silent
    }
  }

  async function handleToggle(webhookId: string) {
    try {
      const res = await fetch('/api/automation/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'toggle', webhookId }),
      });
      const data = await res.json();
      if (data.success) {
        setWebhooks(webhooks.map((w) => (w.id === webhookId ? data.data : w)));
      }
    } catch {
      // silent
    }
  }

  function toggleTrigger(trigger: AutomationTrigger) {
    setNewTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  }

  function CopyBtn({ text, label }: { text: string; label: string }) {
    return (
      <button onClick={() => handleCopy(text, label)} className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Copy">
        {copied === label ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-white/40" />}
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Zap size={24} className="text-gold" />
              Automations
            </h1>
            <p className="text-white/40 text-sm mt-1">Connect n8n, Zapier, Make, or any webhook-based automation</p>
          </div>
          <Button variant="gold" size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            New Webhook
          </Button>
        </div>

        {error && (
          <Card className="mb-6 !bg-red-500/10 border-red-500/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-400" size={18} />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </Card>
        )}

        {/* Inbound Webhook URL */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Webhook size={18} className="text-gold" />
              Inbound Webhook (n8n pushes TO SeeWhy)
            </h2>
            <p className="text-xs text-white/40 mt-1">Use this URL in n8n HTTP Request nodes to trigger actions in your streams</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm font-mono text-white/80 overflow-x-auto">
                {inboundUrl}
              </div>
              <CopyBtn text={inboundUrl} label="inbound" />
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-xs text-white/50 font-mono space-y-1">
              <p className="text-white/70 font-semibold mb-2">Available actions (send as JSON body):</p>
              <p>{`{ "action": "stream.start", "roomId": "your-room-id" }`}</p>
              <p>{`{ "action": "stream.end", "roomId": "your-room-id" }`}</p>
              <p>{`{ "action": "room.update", "roomId": "...", "updates": { "title": "New Title" } }`}</p>
              <p>{`{ "action": "ping" }`}</p>
            </div>
          </CardContent>
        </Card>

        {/* Create Webhook Form */}
        {showCreate && (
          <Card className="mb-6 ring-1 ring-gold/20">
            <CardHeader>
              <h2 className="text-lg font-bold">New Outbound Webhook</h2>
              <p className="text-xs text-white/40">SeeWhy sends events TO your n8n/Zapier webhook URL</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input id="wh-name" label="Webhook Name" placeholder="e.g. n8n Stream Alerts" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <Input id="wh-url" label="Target URL" placeholder="https://your-n8n.example.com/webhook/..." value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Triggers</label>
                  <div className="flex flex-wrap gap-2">
                    {availableTriggers.map((t) => (
                      <button
                        key={t.trigger}
                        onClick={() => toggleTrigger(t.trigger)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          newTriggers.includes(t.trigger)
                            ? 'bg-gold/20 text-gold ring-1 ring-gold/30'
                            : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                        title={t.description}
                      >
                        {t.trigger}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="gold" size="sm" onClick={handleCreate}>Create Webhook</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Webhooks List */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold">Outbound Webhooks ({webhooks.length})</h2>
            <p className="text-xs text-white/40">SeeWhy sends signed payloads to these URLs when triggers fire</p>
          </CardHeader>
          <CardContent>
            {webhooks.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">
                No webhooks configured yet. Create one to start automating.
              </p>
            ) : (
              <div className="space-y-4">
                {webhooks.map((wh) => (
                  <div key={wh.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm">{wh.name}</span>
                        <Badge variant={wh.enabled ? 'success' : 'default'}>
                          {wh.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                        {wh.failCount > 0 && (
                          <Badge variant="warning">{wh.failCount} failures</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleToggle(wh.id)} className="p-1.5 rounded hover:bg-white/10 transition-colors">
                          {wh.enabled ? <ToggleRight size={18} className="text-green-400" /> : <ToggleLeft size={18} className="text-white/30" />}
                        </button>
                        <button onClick={() => handleDelete(wh.id)} className="p-1.5 rounded hover:bg-red-500/20 transition-colors">
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-white/40 font-mono mb-2 truncate">{wh.targetUrl}</div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-white/40">Secret:</span>
                      <code className="text-xs font-mono text-white/50">
                        {showSecrets[wh.id] ? wh.secret : '\u2022'.repeat(20)}
                      </code>
                      <button onClick={() => setShowSecrets({ ...showSecrets, [wh.id]: !showSecrets[wh.id] })} className="p-1 rounded hover:bg-white/10">
                        {showSecrets[wh.id] ? <EyeOff size={10} /> : <Eye size={10} />}
                      </button>
                      <CopyBtn text={wh.secret} label={`secret-${wh.id}`} />
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {wh.triggers.map((t) => (
                        <Badge key={t} variant="default">{t}</Badge>
                      ))}
                    </div>

                    {wh.lastTriggeredAt && (
                      <p className="text-xs text-white/30 flex items-center gap-1">
                        <Clock size={10} />
                        Last triggered {formatRelativeTime(wh.lastTriggeredAt)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
