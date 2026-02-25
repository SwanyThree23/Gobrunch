'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PartyPopper, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/lib/hooks/useAuthStore';

export default function NewWatchPartyPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    videoUrl: '',
    videoSource: 'youtube' as const,
    maxParticipants: '10',
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/watchparty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          videoUrl: form.videoUrl,
          videoSource: form.videoSource,
          maxParticipants: parseInt(form.maxParticipants) || 10,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to create watch party');
        setLoading(false);
        return;
      }

      router.push(`/watchparty/${data.data.id}`);
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
              <PartyPopper size={24} className="text-purple-400" />
              New Watch Party
            </h1>
            <p className="text-white/40 text-sm mt-1">Watch videos together in sync</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="title"
                label="Party Title"
                placeholder="e.g. Movie Night: Sci-Fi Marathon"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                required
              />

              <Input
                id="videoUrl"
                label="Video URL"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={form.videoUrl}
                onChange={(e) => updateField('videoUrl', e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/70">Video Source</label>
                <select
                  value={form.videoSource}
                  onChange={(e) => updateField('videoSource', e.target.value)}
                  className="input-field"
                >
                  <option value="youtube">YouTube</option>
                  <option value="vimeo">Vimeo</option>
                  <option value="custom">Custom URL</option>
                </select>
              </div>

              <Input
                id="maxParticipants"
                label="Max Participants"
                type="number"
                placeholder="10"
                value={form.maxParticipants}
                onChange={(e) => updateField('maxParticipants', e.target.value)}
              />

              {error && <p className="text-sm text-red-400">{error}</p>}

              <Button type="submit" loading={loading} className="w-full">
                <PartyPopper size={16} />
                Create Watch Party
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
