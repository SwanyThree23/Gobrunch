'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function TipCancelledPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Card>
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="text-white/40" size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Tip Cancelled</h1>
          <p className="text-white/50 mb-6">
            No worries! You can always tip later.
          </p>
          <Link href="/dashboard">
            <Button variant="secondary">
              Back to Dashboard
              <ArrowRight size={16} />
            </Button>
          </Link>
        </Card>
      </motion.div>
    </div>
  );
}
