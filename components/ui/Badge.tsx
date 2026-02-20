'use client';

import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'live' | 'gold' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-white/70',
  live: 'bg-red-500/20 text-red-400',
  gold: 'bg-gold/20 text-gold-300',
  success: 'bg-green-500/20 text-green-400',
  warning: 'bg-yellow-500/20 text-yellow-400',
  danger: 'bg-red-500/20 text-red-400',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full',
        variantStyles[variant],
        className
      )}
    >
      {variant === 'live' && <span className="live-dot" />}
      {children}
    </span>
  );
}
