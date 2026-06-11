// Totem archive wall — the days you were here. Browse past summoned
// totems as a grid of circular medallions; tap one to open the original
// reveal modal.

import { useCallback, useState } from 'react';
import { t } from '../i18n';
import type { TodayTotem } from '../hooks/useDailyTap';
import { TotemReveal } from './TotemReveal';
import { prettyDateShort } from '../utils/day';

interface Props {
  totems: TodayTotem[];
  onClose: () => void;
}

export function Archive({ totems, onClose }: Props) {
  const [opened, setOpened] = useState<TodayTotem | null>(null);

  // Sort by date descending — most recent first.
  const sorted = [...totems].sort((a, b) => (a.date < b.date ? 1 : -1));

  const handleBackdrop = useCallback(() => onClose(), [onClose]);

  return (
    <div className="otd-archive" onPointerDown={handleBackdrop}>
      <div className="otd-archive__panel" onPointerDown={e => e.stopPropagation()}>
        <div className="otd-archive__head">
          <div className="otd-archive__title">{t('archive_title')}</div>
          <div className="otd-archive__sub">{t('archive_subtitle')}</div>
          {sorted.length > 0 && (
            <>
              <div className="otd-archive__count">
                {t('archive_count', { n: sorted.length })}
              </div>
              <div className="otd-archive__hint">{t('archive_hint')}</div>
            </>
          )}
        </div>

        {sorted.length === 0 ? (
          <div className="otd-archive__empty">{t('archive_empty')}</div>
        ) : (
          <div className="otd-archive__grid">
            {sorted.map((totem, i) => (
              <button
                key={totem.date}
                type="button"
                className={`otd-archive__cell${i === 0 ? ' otd-archive__cell--latest' : ''}`}
                onPointerDown={() => setOpened(totem)}
              >
                <span className="otd-archive__cell-img">
                  <img src={totem.imageUrl} alt="" draggable={false} />
                </span>
                {totem.milestone != null && (
                  <span className="otd-archive__cell-milestone">
                    {t('totem_milestone_label', { n: totem.milestone })}
                  </span>
                )}
                <span className="otd-archive__cell-date">{prettyDateShort(totem.date)}</span>
                {totem.caption && (
                  <span className="otd-archive__cell-caption">"{trimCaption(totem.caption)}"</span>
                )}
              </button>
            ))}
          </div>
        )}

        <button type="button" className="otd-archive__close" onPointerDown={handleBackdrop}>
          {t('back')}
        </button>
      </div>

      {opened && (
        <TotemReveal
          totem={opened}
          summoning={false}
          onClose={() => setOpened(null)}
        />
      )}
    </div>
  );
}

const MAX_CAPTION = 36;
function trimCaption(s: string): string {
  if (s.length <= MAX_CAPTION) return s;
  return s.slice(0, MAX_CAPTION - 1).trimEnd() + '…';
}
