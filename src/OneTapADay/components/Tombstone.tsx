import { useCallback } from 'react';
import { t } from '../i18n';
import { daysBetween, prettyDateShort, utcDayString } from '../utils/day';

interface Props {
  bestStreak: number;
  /** ISO YYYY-MM-DD of the user's last tap. Used to show "N days silent". */
  lastTapDay?: string | null;
  onContinue: () => void;
}

export function Tombstone({ bestStreak, lastTapDay, onContinue }: Props) {
  const handle = useCallback(() => onContinue(), [onContinue]);

  // Days silent = whole UTC days from last tap to today.
  const today = utcDayString();
  const silentDays = lastTapDay ? Math.max(1, daysBetween(lastTapDay, today)) : null;

  // Date range that the streak covered: from {best-1 days before last tap}
  // to {last tap}. Approximation — we don't track the exact first day.
  let streakStart: string | null = null;
  if (lastTapDay && bestStreak >= 1) {
    const d = new Date(`${lastTapDay}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (bestStreak - 1));
    streakStart = d.toISOString().slice(0, 10);
  }

  return (
    <div className="otd-tomb-screen" onPointerDown={handle}>
      <div className="otd-tomb-screen__card" onPointerDown={e => e.stopPropagation()}>
        {/* Ashen altar — the tap disc gone cold. Cracked across the face. */}
        <div className="otd-tomb-screen__sigil" aria-hidden>
          <span className="otd-tomb-screen__alpha">α</span>
          <svg
            className="otd-tomb-screen__crack"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Two thin meandering cracks — irregular so they don't read as
                geometry but as fractures in the disc face. */}
            <path
              d="M 38,3 L 46,18 L 40,30 L 52,46 L 44,62 L 56,80 L 48,98"
              stroke="rgba(0,0,0,0.65)"
              strokeWidth="0.6"
              fill="none"
            />
            <path
              d="M 52,46 L 64,42 L 70,52"
              stroke="rgba(0,0,0,0.45)"
              strokeWidth="0.4"
              fill="none"
            />
            <path
              d="M 44,62 L 32,68 L 28,76"
              stroke="rgba(0,0,0,0.4)"
              strokeWidth="0.4"
              fill="none"
            />
          </svg>
        </div>

        <div className="otd-tomb-screen__title">{t('streak_broken_title')}</div>
        <div className="otd-tomb-screen__lead">{t('streak_broken_lead')}</div>

        <div className="otd-tomb-screen__rule" aria-hidden />

        {/* Inscription: the streak's length + date range */}
        <div className="otd-tomb-screen__inscription">
          <div className="otd-tomb-screen__best">{t('tombstone', { n: bestStreak })}</div>
          {streakStart && lastTapDay && (
            <div className="otd-tomb-screen__dates">
              {t('tombstone_dates', {
                from: prettyDateShort(streakStart),
                to: prettyDateShort(lastTapDay),
              })}
            </div>
          )}
        </div>

        {silentDays != null && (
          <div className="otd-tomb-screen__silent">
            {silentDays === 1
              ? t('tombstone_since_one')
              : t('tombstone_since', { n: silentDays })}
          </div>
        )}

        <button
          type="button"
          className="otd-tomb-screen__cta"
          onPointerDown={handle}
        >
          {t('streak_broken_cta')}
        </button>
      </div>
    </div>
  );
}
