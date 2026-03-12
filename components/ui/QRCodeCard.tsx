'use client';

/**
 * QRCodeCard - Display QR codes for joining rooms, tipping, or sharing
 */
import { useState } from 'react';
import type { QRCodeConfig } from '@/types';

interface QRCodeCardProps {
  config: QRCodeConfig;
  label: string;
  description?: string;
  showUrl?: boolean;
}

export function QRCodeCard({ config, label, description, showUrl = false }: QRCodeCardProps) {
  const [copied, setCopied] = useState(false);

  // Use Google Charts API for QR code generation
  const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=${config.size}x${config.size}&chl=${encodeURIComponent(config.targetUrl)}&choe=UTF-8&chld=M|2`;

  const copyUrl = () => {
    navigator.clipboard.writeText(config.targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card p-4 text-center space-y-3">
      <h4 className="font-medium text-white">{label}</h4>
      {description && <p className="text-xs text-white/50">{description}</p>}

      {/* QR Code Image */}
      <div className="flex justify-center">
        <div className="bg-white p-2 rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt={`QR Code: ${label}`}
            width={config.size}
            height={config.size}
            className="rounded"
          />
        </div>
      </div>

      {/* URL & Copy */}
      {showUrl && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={config.targetUrl}
            className="input-field text-xs flex-1"
          />
          <button
            onClick={copyUrl}
            className="px-3 py-2 text-xs bg-gold/20 hover:bg-gold/30 text-gold rounded-lg transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}

export default QRCodeCard;
