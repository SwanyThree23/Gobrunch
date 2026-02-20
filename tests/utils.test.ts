import { describe, it, expect } from 'vitest';
import {
  cn,
  formatDate,
  formatRelativeTime,
  formatViewerCount,
  formatDuration,
  generateInviteCode,
  truncate,
  extractYouTubeId,
  getInitials,
} from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('merges tailwind conflicts', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6');
  });
});

describe('formatViewerCount', () => {
  it('returns plain number for < 1000', () => {
    expect(formatViewerCount(500)).toBe('500');
  });

  it('formats thousands with K suffix', () => {
    expect(formatViewerCount(1500)).toBe('1.5K');
  });

  it('formats millions with M suffix', () => {
    expect(formatViewerCount(2500000)).toBe('2.5M');
  });
});

describe('formatDuration', () => {
  it('formats seconds to MM:SS', () => {
    expect(formatDuration(90)).toBe('01:30');
  });

  it('formats with hours when >= 3600', () => {
    expect(formatDuration(3661)).toBe('01:01:01');
  });

  it('handles zero', () => {
    expect(formatDuration(0)).toBe('00:00');
  });
});

describe('generateInviteCode', () => {
  it('returns an 8-character string', () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(8);
  });

  it('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateInviteCode()));
    expect(codes.size).toBeGreaterThan(90);
  });

  it('only contains allowed characters', () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^[A-Z2-9]+$/);
  });
});

describe('truncate', () => {
  it('returns text unchanged if within limit', () => {
    expect(truncate('short', 10)).toBe('short');
  });

  it('truncates long text with ellipsis', () => {
    expect(truncate('this is a long string', 10)).toBe('this is...');
  });
});

describe('extractYouTubeId', () => {
  it('extracts ID from standard URL', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from short URL', () => {
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from embed URL', () => {
    expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for non-YouTube URLs', () => {
    expect(extractYouTubeId('https://example.com')).toBeNull();
  });
});

describe('getInitials', () => {
  it('returns first letters of first two words', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('handles single name', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('limits to two initials', () => {
    expect(getInitials('John Michael Doe')).toBe('JM');
  });
});

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2026-01-15T12:00:00Z');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2026');
  });
});

describe('formatRelativeTime', () => {
  it('returns "just now" for recent times', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('returns minutes for times < 1 hour ago', () => {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    expect(formatRelativeTime(thirtyMinAgo)).toBe('30m ago');
  });
});
