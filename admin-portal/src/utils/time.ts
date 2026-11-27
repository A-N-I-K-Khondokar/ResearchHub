/** Date helpers for Firestore Timestamps / Dates (consistent across the portal). */

export function toDate(ts: any): Date | null {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (ts instanceof Date) return ts;
  if (typeof ts === 'number' || typeof ts === 'string') {
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** "Mar 4, 2026, 10:12 AM" */
export function exactTime(ts: any): string {
  const d = toDate(ts);
  return d ? d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}

/** "just now", "5 min ago", "3 h ago", "2 days ago", then "Mar 4". */
export function relativeTime(ts: any, now: number = Date.now()): string {
  const d = toDate(ts);
  if (!d) return '—';
  const s = Math.round((now - d.getTime()) / 1000);
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: d.getFullYear() === new Date(now).getFullYear() ? undefined : 'numeric' });
}

/** Whole days since the timestamp (0 for today / unknown). */
export function daysSince(ts: any, now: number = Date.now()): number {
  const d = toDate(ts);
  return d ? Math.max(0, Math.floor((now - d.getTime()) / 86_400_000)) : 0;
}
