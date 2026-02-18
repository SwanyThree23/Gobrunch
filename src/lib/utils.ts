import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return target.toLocaleDateString();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: 'text-gray-500',
    uncommon: 'text-green-500',
    rare: 'text-blue-500',
    epic: 'text-purple-500',
    legendary: 'text-yellow-500',
  };
  return colors[rarity] || 'text-gray-500';
}

export function getRarityBgColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: 'bg-gray-100 dark:bg-gray-800',
    uncommon: 'bg-green-100 dark:bg-green-900',
    rare: 'bg-blue-100 dark:bg-blue-900',
    epic: 'bg-purple-100 dark:bg-purple-900',
    legendary: 'bg-yellow-100 dark:bg-yellow-900',
  };
  return colors[rarity] || 'bg-gray-100 dark:bg-gray-800';
}
