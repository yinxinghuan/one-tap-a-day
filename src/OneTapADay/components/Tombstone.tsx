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
      {/* Ashen brain-coral patina — same Turing pattern as the live screen
          but cream-tinted and very faint. 'The world is still there, just
          drained of color.' */}
      <div className="otd-tomb-screen__relief" aria-hidden />

      <div className="otd-tomb-screen__card" onPointerDown={e => e.stopPropagation()}>
        {/* Ashen altar — the tap disc gone cold, fractured across the face. */}
        <div className="otd-tomb-screen__sigil" aria-hidden>
          <span className="otd-tomb-screen__alpha">α</span>
          <svg
            className="otd-tomb-screen__crack"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Each crack uses two stacked strokes to suggest chisel depth:
                a soft highlight on one side, a deeper shadow on the other. */}
            <path
              d="M 40,2 L 48,18 L 41,32 L 53,48 L 45,64 L 57,82 L 49,100"
              stroke="rgba(255,238,210,0.10)" strokeWidth="1.4" fill="none"
            />
            <path
              d="M 40,2 L 48,18 L 41,32 L 53,48 L 45,64 L 57,82 L 49,100"
              stroke="rgba(0,0,0,0.78)" strokeWidth="0.55" fill="none"
            />
            <path
              d="M 53,48 L 66,43 L 73,55"
              stroke="rgba(255,238,210,0.07)" strokeWidth="1.0" fill="none"
            />
            <path
              d="M 53,48 L 66,43 L 73,55"
              stroke="rgba(0,0,0,0.55)" strokeWidth="0.4" fill="none"
            />
            <path
              d="M 45,64 L 33,70 L 28,80"
              stroke="rgba(255,238,210,0.05)" strokeWidth="0.9" fill="none"
            />
            <path
              d="M 45,64 L 33,70 L 28,80"
              stroke="rgba(0,0,0,0.5)" strokeWidth="0.4" fill="none"
            />
          </svg>
        </div>

        <div className="otd-tomb-screen__title">{t('streak_broken_title')}</div>
        <div className="otd-tomb-screen__lead">{t('streak_broken_lead')}</div>

        {/* Inscription tablet — pink memorial text flanked by hairlines like
            an engraved plaque. */}
        <div className="otd-tomb-screen__plaque">
          <span className="otd-tomb-screen__plaque-rule" aria-hidden />
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
          <span className="otd-tomb-screen__plaque-rule" aria-hidden />
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
