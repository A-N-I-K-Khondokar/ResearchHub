/**
 * src/utils/date.ts — relative dates for cards and lists ("Just now", "3h ago").
 * Accepts a Firestore Timestamp, Date, ISO string or epoch milliseconds.
 */

type DateLike = { toMillis?: () => number } | Date | string | number | null | undefined;

export function toMillis(value: DateLike): number {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? 0 : ms;
  }
  if (value instanceof Date) return value.getTime();
  return typeof value.toMillis === 'function' ? value.toMillis() : 0;
}

export function formatRelativeDate(value: DateLike): string {
  const ms = toMillis(value);
  if (!ms) return 'Just now';
  const minutes = Math.floor((Date.now() - ms) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
