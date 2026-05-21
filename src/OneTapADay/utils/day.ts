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

/**
 * Hours + minutes elapsed from the UTC midnight that began the day of `ts`.
 * Used to show "the threshold was reached N hours into the day" on the
 * summoning screen.
 */
/** Difference in whole UTC days between two YYYY-MM-DD strings (or
 *  dates). Positive if `b` is later than `a`. */
export function daysBetween(a: string, b: string): number {
  const da = Date.UTC(
    Number(a.slice(0, 4)),
    Number(a.slice(5, 7)) - 1,
    Number(a.slice(8, 10)),
  );
  const db = Date.UTC(
    Number(b.slice(0, 4)),
    Number(b.slice(5, 7)) - 1,
    Number(b.slice(8, 10)),
  );
  return Math.round((db - da) / 86400000);
}

/** YYYY-MM-DD → "MAY 18" style. UTC-stable. */
export function prettyDateShort(d: string): string {
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const m = months[Math.max(0, Math.min(11, Number(d.slice(5, 7)) - 1))];
  return `${m} ${Number(d.slice(8, 10))}`;
}

export function durationSinceUtcMidnight(ts: string | number | Date): { hh: number; mm: number; ss: number } {
  const t = new Date(ts);
  const dayStart = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
  const ms = t.getTime() - dayStart;
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    hh: Math.floor(total / 3600),
    mm: Math.floor((total % 3600) / 60),
    ss: total % 60,
  };
}
