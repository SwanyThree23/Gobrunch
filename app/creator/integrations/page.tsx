'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Key,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Zap,
  Webhook,
  ArrowRight,
  ArrowLeftRight,
  Shield,
  Trash2,
  Loader2,
  Play,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/lib/hooks/useAuthStore';

interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  trigger: string;
  modules: string[];
  blueprint: {
    name: string;
    flow: Array<{ module: string; action: string; note?: string }>;
    webhookPayloadExample?: Record<string, unknown>;
    inboundRequestExample?: Record<string, unknown>;
  };
}

interface SetupGuide {
  outbound: {
    title: string;
    steps: string[];
    verificationNote: string;
    signatureHeader: string;
    eventHeader: string;
    deliveryHeader: string;
  };
  inbound: {
    title: string;
    webhookUrl: string;
    apiKey: string | null;
    steps: string[];
    availableActions: Array<{ action: string; fields: string[]; description: string }>;
    exampleRequest: Record<string, unknown>;
  };
}

export default function IntegrationsPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [guide, setGuide] = useState<SetupGuide | null>(null);
  const [templates, setTemplates] = useState<ScenarioTemplate[]>([]);
  const [apiKey, setApiKey] = useState<{ key: string; name: string; createdAt: string } | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  const fetchIntegration = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/automation/make', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setGuide(data.data.guide);
        setTemplates(data.data.templates);
        setApiKey(data.data.apiKey);
      }
    } catch {
      // failed to load
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchIntegration();
  }, [fetchIntegration]);

  async function handleGenerateKey() {
    if (!token) return;
    setGeneratingKey(true);
    try {
      const res = await fetch('/api/automation/make', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'generate_key', name: 'Make.com API Key' }),
      });
      const data = await res.json();
      if (data.success) {
        setNewApiKey(data.data.key);
        setApiKey({ key: data.data.key, name: data.data.name, createdAt: data.data.createdAt });
      }
    } catch {
      // failed
    } finally {
      setGeneratingKey(false);
    }
  }

  async function handleRevokeKey() {
    if (!token) return;
    try {
      await fetch('/api/automation/make', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'revoke_key' }),
      });
      setApiKey(null);
      setNewApiKey(null);
    } catch {
      // failed
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/creator/automations" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} />
        Back to Automations
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
            <Zap size={28} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Make.com Integration</h1>
            <p className="text-white/40 text-sm">Connect your SeeWhy LIVE streams with 1,000+ apps via Make.com</p>
          </div>
        </div>

        {/* API Key Management */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key size={18} className="text-gold" />
              <h2 className="text-lg font-semibold">API Key</h2>
            </div>
            <p className="text-white/40 text-sm mt-1">
              Required for Make.com to send actions to your SeeWhy LIVE account
            </p>
          </CardHeader>
          <CardContent>
            {newApiKey ? (
              <div className="space-y-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="text-sm text-green-400 mb-2 font-medium">
                    <Shield size={14} className="inline mr-1" />
                    Your new API key (copy now — it won't be shown again):
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-black/30 px-3 py-2 rounded text-sm font-mono text-gold break-all">
                      {newApiKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newApiKey, 'apikey')}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      {copied === 'apikey' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <Button variant="danger" size="sm" onClick={() => setNewApiKey(null)}>
                  I've copied the key
                </Button>
              </div>
            ) : apiKey ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">{apiKey.name}</p>
                  <code className="text-xs text-white/30 font-mono">{apiKey.key}</code>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleGenerateKey} loading={generatingKey}>
                    <RefreshCw size={14} />
                    Regenerate
                  </Button>
                  <Button variant="danger" size="sm" onClick={handleRevokeKey}>
                    <Trash2 size={14} />
                    Revoke
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="gold" onClick={handleGenerateKey} loading={generatingKey}>
                <Key size={16} />
                Generate API Key
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Two-column guide: Outbound + Inbound */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Outbound: SeeWhy → Make.com */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ArrowRight size={18} className="text-blue-400" />
                <h2 className="text-lg font-semibold">Outbound</h2>
              </div>
              <p className="text-white/40 text-xs mt-1">{guide?.outbound.title}</p>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {guide?.outbound.steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/60">
                    <span className="text-gold font-semibold min-w-[20px]">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="mt-4 bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/40 mb-1">Verification Headers:</p>
                <div className="space-y-1">
                  <code className="block text-xs font-mono text-purple-300">{guide?.outbound.signatureHeader}</code>
                  <code className="block text-xs font-mono text-purple-300">{guide?.outbound.eventHeader}</code>
                  <code className="block text-xs font-mono text-purple-300">{guide?.outbound.deliveryHeader}</code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inbound: Make.com → SeeWhy */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ArrowLeftRight size={18} className="text-green-400" />
                <h2 className="text-lg font-semibold">Inbound</h2>
              </div>
              <p className="text-white/40 text-xs mt-1">{guide?.inbound.title}</p>
            </CardHeader>
            <CardContent>
              {/* Webhook URL */}
              <div className="mb-4">
                <p className="text-xs text-white/40 mb-1">Your webhook URL:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-black/30 px-2 py-1.5 rounded text-xs font-mono text-gold truncate">
                    {guide?.inbound.webhookUrl}
                  </code>
                  <button
                    onClick={() => copyToClipboard(guide?.inbound.webhookUrl || '', 'webhook-url')}
                    className="p-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    {copied === 'webhook-url' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Available actions */}
              <p className="text-xs text-white/40 mb-2">Available actions:</p>
              <div className="space-y-1.5">
                {guide?.inbound.availableActions.map((a) => (
                  <div key={a.action} className="bg-white/5 rounded px-2 py-1.5">
                    <code className="text-xs font-mono text-green-300">{a.action}</code>
                    <p className="text-xs text-white/40 mt-0.5">{a.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scenario Templates */}
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Play size={18} className="text-gold" />
          Ready-to-Use Scenario Templates
        </h2>
        <p className="text-white/40 text-sm mb-6">
          Pre-built Make.com automation flows. Follow the module steps to set up each scenario.
        </p>

        <div className="space-y-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <button
                className="w-full text-left p-4 flex items-center justify-between"
                onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{template.name}</h3>
                  <p className="text-xs text-white/40 mt-0.5">{template.description}</p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {template.modules.map((mod) => (
                      <Badge key={mod} variant="default">
                        {mod}
                      </Badge>
                    ))}
                  </div>
                </div>
                {expandedTemplate === template.id ? (
                  <ChevronUp size={18} className="text-white/40" />
                ) : (
                  <ChevronDown size={18} className="text-white/40" />
                )}
              </button>

              {expandedTemplate === template.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="border-t border-white/5 p-4"
                >
                  {/* Flow steps */}
                  <p className="text-xs text-white/40 mb-3 font-medium">Scenario Flow:</p>
                  <div className="space-y-2 mb-4">
                    {template.blueprint.flow.map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-xs text-gold font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className="text-gold font-medium">{step.module}</span>
                            {' → '}
                            <span className="text-white/70">{step.action}</span>
                          </p>
                          {step.note && <p className="text-xs text-white/40 mt-0.5">{step.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payload example */}
                  {template.blueprint.webhookPayloadExample && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-white/40 font-medium">Example Webhook Payload:</p>
                        <button
                          onClick={() => copyToClipboard(
                            JSON.stringify(template.blueprint.webhookPayloadExample, null, 2),
                            `payload-${template.id}`
                          )}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          {copied === `payload-${template.id}` ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <pre className="bg-black/30 rounded-lg p-3 text-xs font-mono text-white/60 overflow-x-auto">
                        {JSON.stringify(template.blueprint.webhookPayloadExample, null, 2)}
                      </pre>
                    </div>
                  )}

                  {template.blueprint.inboundRequestExample && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-white/40 font-medium">Example HTTP Request:</p>
                        <button
                          onClick={() => copyToClipboard(
                            JSON.stringify(template.blueprint.inboundRequestExample, null, 2),
                            `request-${template.id}`
                          )}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          {copied === `request-${template.id}` ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <pre className="bg-black/30 rounded-lg p-3 text-xs font-mono text-white/60 overflow-x-auto">
                        {JSON.stringify(template.blueprint.inboundRequestExample, null, 2)}
                      </pre>
                    </div>
                  )}
                </motion.div>
              )}
            </Card>
          ))}
        </div>

        {/* Quick links */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <Link href="/creator/automations">
            <Card className="hover:border-gold/30 transition-colors cursor-pointer">
              <div className="p-4 flex items-center gap-3">
                <Webhook size={20} className="text-gold" />
                <div>
                  <p className="text-sm font-semibold">Manage Webhooks</p>
                  <p className="text-xs text-white/40">Create and manage outbound webhooks</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/creator/earnings">
            <Card className="hover:border-gold/30 transition-colors cursor-pointer">
              <div className="p-4 flex items-center gap-3">
                <Zap size={20} className="text-gold" />
                <div>
                  <p className="text-sm font-semibold">Creator Earnings</p>
                  <p className="text-xs text-white/40">View revenue from tips and tickets</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
