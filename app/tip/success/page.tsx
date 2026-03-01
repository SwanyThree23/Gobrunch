'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function TipSuccessPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Card>
          <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-6">
            <Heart className="text-gold" size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Tip Sent!</h1>
          <p className="text-white/50 mb-6">
            Thank you for supporting the creator. Your generosity helps them keep creating amazing content.
          </p>
          <Link href="/dashboard">
            <Button variant="gold">
              Back to Dashboard
              <ArrowRight size={16} />
            </Button>
          </Link>
        </Card>
      </motion.div>
    </div>
  );
}
