export const fmtMoney = n => '$' + Number(n).toFixed(2);

export const durToSec = d => {
  const p = d.split(':');
  if (p.length === 3) return +p[0] * 3600 + +p[1] * 60 + +p[2];
  return +p[0] * 60 + +p[1];
};

export const fmtMMSS = s => {
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
};

export const fmtHHMMSS = s => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

export const clamp = (min, val, max) => Math.min(max, Math.max(min, val));

export const fmtCompact = n => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
};

export const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const timeAgo = date => {
  const now = Date.now();
  const d = date instanceof Date ? date.getTime() : date;
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export const copyToClipboard = async text => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  }
};
