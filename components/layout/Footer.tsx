'use client';

import Link from 'next/link';
import { Tv } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-dark-600/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-burgundy to-gold flex items-center justify-center">
                <Tv size={16} className="text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">{APP_NAME}</span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed">
              Enterprise live streaming platform. Stream, watch, and connect with your audience in real time.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white/80 mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li><Link href="/pricing" className="text-sm text-white/40 hover:text-gold transition-colors">Pricing</Link></li>
              <li><Link href="/dashboard" className="text-sm text-white/40 hover:text-gold transition-colors">Dashboard</Link></li>
              <li><span className="text-sm text-white/40">Watch Parties</span></li>
              <li><span className="text-sm text-white/40">AI Assistant</span></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white/80 mb-4">Company</h4>
            <ul className="space-y-2.5">
              <li><span className="text-sm text-white/40">About</span></li>
              <li><span className="text-sm text-white/40">Blog</span></li>
              <li><span className="text-sm text-white/40">Careers</span></li>
              <li><span className="text-sm text-white/40">Contact</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white/80 mb-4">Legal</h4>
            <ul className="space-y-2.5">
              <li><span className="text-sm text-white/40">Privacy Policy</span></li>
              <li><span className="text-sm text-white/40">Terms of Service</span></li>
              <li><span className="text-sm text-white/40">Cookie Policy</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} SWANYTHREE EntTech. All rights reserved.
          </p>
          <p className="text-xs text-white/30">
            Powered by OpenRouter AI
          </p>
        </div>
      </div>
    </footer>
  );
}
