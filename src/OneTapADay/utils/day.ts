// UTC day boundary helpers — all clients share the same "today" regardless of
// local timezone. This is critical for the collective ritual feeling:
// everyone is tapping the same button on the same day.

export function utcDayString(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function msUntilNextUtcMidnight(now: Date = new Date()): number {
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0,
  ));
  return next.getTime() - now.getTime();
}

export function formatHM(ms: number): { hh: string; mm: string } {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  return { hh: String(hh).padStart(2, '0'), mm: String(mm).padStart(2, '0') };
}

export function prettyDate(d: Date = new Date()): string {
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
