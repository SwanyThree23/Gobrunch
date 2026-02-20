'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Tv,
  Users,
  Sparkles,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Play,
  MessageSquare,
  Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { APP_NAME } from '@/lib/constants';

const features = [
  {
    icon: Tv,
    title: 'Live Streaming',
    description: 'Broadcast to thousands with ultra-low latency. Professional-grade streaming for everyone.',
  },
  {
    icon: Users,
    title: 'Watch Parties',
    description: 'Watch videos together in perfect sync. Invite friends, react, and chat in real time.',
  },
  {
    icon: Brain,
    title: 'AI Assistant',
    description: 'Powered by OpenRouter. Get AI-driven insights, summaries, and interactive Q&A during streams.',
  },
  {
    icon: MessageSquare,
    title: 'Real-time Chat',
    description: 'Rich chat with reactions, threads, and moderation tools to keep conversations flowing.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'End-to-end encryption, role-based access control, and compliance-ready infrastructure.',
  },
  {
    icon: Globe,
    title: 'Global CDN',
    description: 'Stream to viewers worldwide with adaptive bitrate and edge-optimized delivery.',
  },
];

const stats = [
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<200ms', label: 'Latency' },
  { value: '100K+', label: 'Concurrent Viewers' },
  { value: '4K HDR', label: 'Max Quality' },
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-burgundy/20 rounded-full blur-[128px]" />
        <div className="absolute top-60 -left-40 w-[400px] h-[400px] bg-gold/10 rounded-full blur-[128px]" />
      </div>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-32">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Badge variant="gold" className="mb-6">
            <Sparkles size={12} />
            Now with OpenRouter AI Integration
          </Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
            <span className="text-white">Stream, Watch &</span>
            <br />
            <span className="gradient-text">Connect Live</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 text-balance">
            {APP_NAME} is the enterprise live streaming platform that brings AI-powered watch parties,
            real-time collaboration, and professional broadcasting to your audience.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button variant="gold" size="lg">
                Start Streaming Free
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg">
                <Play size={18} />
                Watch Demo
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-5 text-center">
              <div className="text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-white/40 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <motion.div className="text-center mb-16" {...fadeUp}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything You Need to <span className="gradient-text">Go Live</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            From personal streams to enterprise broadcasts, {APP_NAME} provides the tools to create
            unforgettable live experiences.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <Card hover className="h-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-burgundy/50 to-gold/20 flex items-center justify-center mb-4">
                  <feature.icon size={22} className="text-gold" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <motion.div
          className="glass-card p-12 sm:p-16 text-center relative overflow-hidden"
          {...fadeUp}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-burgundy/20 via-transparent to-gold/10 pointer-events-none" />
          <div className="relative z-10">
            <Zap size={40} className="text-gold mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to <span className="gradient-text">Transform</span> Your Streams?
            </h2>
            <p className="text-white/50 max-w-xl mx-auto mb-8">
              Join thousands of creators and enterprises who trust {APP_NAME} for their live streaming needs.
            </p>
            <Link href="/auth/register">
              <Button variant="gold" size="lg">
                Get Started Free
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
