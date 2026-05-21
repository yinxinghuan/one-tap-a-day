// Totem archive wall — past totems the player has been part of. Each cell
// is a small disc + date + caption. Tap a cell to open the original totem
// reveal modal.

import { useCallback, useState } from 'react';
import { t } from '../i18n';
import type { TodayTotem } from '../hooks/useDailyTap';
import { TotemReveal } from './TotemReveal';

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
        </div>

        {sorted.length === 0 ? (
          <div className="otd-archive__empty">{t('archive_empty')}</div>
        ) : (
          <div className="otd-archive__grid">
            {sorted.map(totem => (
              <button
                key={totem.date}
                type="button"
                className="otd-archive__cell"
                onPointerDown={() => setOpened(totem)}
              >
                <span className="otd-archive__cell-img">
                  <img src={totem.imageUrl} alt="" draggable={false} />
                </span>
                <span className="otd-archive__cell-date">{prettyDateShort(totem.date)}</span>
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

function prettyDateShort(yyyymmdd: string): string {
  // "2026-05-21" → "MAY 21"
  const [, mm, dd] = yyyymmdd.split('-');
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const m = months[Math.max(0, Math.min(11, parseInt(mm, 10) - 1))];
  return `${m} ${parseInt(dd, 10)}`;
}
