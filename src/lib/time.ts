const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/** Compact relative time: "just now", "5 min ago", "3 h ago". */
export function timeAgo(date: Date, now: Date): string {
  const elapsed = Math.max(0, now.getTime() - date.getTime());
  if (elapsed < MINUTE_MS) return 'just now';
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)} min ago`;
  return `${Math.floor(elapsed / HOUR_MS)} h ago`;
}
