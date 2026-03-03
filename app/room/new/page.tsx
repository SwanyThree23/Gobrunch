'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Radio, ArrowLeft, Ticket, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/lib/hooks/useAuthStore';

export default function NewRoomPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresTicket, setRequiresTicket] = useState(false);
  const [ticketPrice, setTicketPrice] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    visibility: 'public',
    tags: '',
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (requiresTicket && (!ticketPrice || parseFloat(ticketPrice) < 1)) {
      setError('Ticket price must be at least $1.00');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          visibility: form.visibility,
          tags: form.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          requiresTicket,
          ticketPrice: requiresTicket ? Math.round(parseFloat(ticketPrice) * 100) : undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to create room');
        setLoading(false);
        return;
      }

      // Redirect to stream settings so the host can configure stream keys
      router.push(`/room/${data.data.id}/settings`);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Radio size={24} className="text-gold" />
              Go Live
            </h1>
            <p className="text-white/40 text-sm mt-1">Create a new streaming room</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="title"
                label="Room Title"
                placeholder="e.g. Tech Talk: Building Real-time Apps"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/70">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="What will you be streaming about?"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/70">Visibility</label>
                <select
                  value={form.visibility}
                  onChange={(e) => updateField('visibility', e.target.value)}
                  className="input-field"
                >
                  <option value="public">Public - Anyone can discover</option>
                  <option value="unlisted">Unlisted - Only with link</option>
                  <option value="private">Private - Invite only</option>
                </select>
              </div>

              <Input
                id="tags"
                label="Tags (comma separated)"
                placeholder="e.g. tech, webdev, tutorial"
                value={form.tags}
                onChange={(e) => updateField('tags', e.target.value)}
              />

              {/* Ticket Pricing Section */}
              <div className="border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket size={16} className="text-gold" />
                    <span className="text-sm font-medium text-white/70">Paid Event</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequiresTicket(!requiresTicket)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      requiresTicket ? 'bg-gold' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        requiresTicket ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-white/40">
                  Require viewers to purchase a ticket via Stripe Connect before accessing your stream.
                </p>

                {requiresTicket && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        step="0.01"
                        value={ticketPrice}
                        onChange={(e) => setTicketPrice(e.target.value)}
                        placeholder="0.00"
                        className="input-field pl-8"
                      />
                    </div>
                    <p className="text-xs text-white/30 mt-1.5">
                      15% platform fee applies. Funds deposited directly to your Stripe Connect account.
                    </p>
                  </motion.div>
                )}
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <Button type="submit" loading={loading} className="w-full">
                <Radio size={16} />
                {requiresTicket ? 'Create Paid Event' : 'Start Streaming'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
