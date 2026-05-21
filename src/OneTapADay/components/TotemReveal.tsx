import { useCallback, useEffect, useState } from 'react';
import { t } from '../i18n';
import type { TodayTotem } from '../hooks/useDailyTap';
import { playRevealChord } from '../utils/audio';
import { SummoningPoetry } from './SummoningPoetry';
import { durationSinceUtcMidnight } from '../utils/day';
import { saveTotem } from '../utils/saveTotem';

interface Props {
  totem: TodayTotem | null;
  summoning: boolean;
  /** Number of users that triggered the summoning (day_user_count). */
  summonCount?: number;
  /** Timestamp when the threshold was reached (ISO). */
  summonedAt?: string;
  onClose: () => void;
  onArchive?: () => void;
}

export function TotemReveal({ totem, summoning, summonCount, summonedAt, onClose, onArchive }: Props) {
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (totem) playRevealChord();
  }, [totem]);

  const handleSave = useCallback(async () => {
    if (!totem || saving) return;
    setSaving(true);
    try {
      await saveTotem({
        imageUrl: totem.imageUrl,
        date: totem.date,
        caption: totem.caption,
      });
    } finally {
      setSaving(false);
    }
  }, [totem, saving]);

  if (!totem && !summoning) return null;

  const isLoading = !totem && summoning;

  return (
    <div className="otd-totem" onPointerDown={onClose}>
      <div className="otd-totem__card" onPointerDown={e => e.stopPropagation()}>
        {isLoading ? (
          <>
            {summonCount != null && summonCount > 0 && (
              <div className="otd-totem__summoning-context">
                {t('totem_summoning_context', { n: summonCount })}
              </div>
            )}
            {summonedAt && (() => {
              const { hh, mm, ss } = durationSinceUtcMidnight(summonedAt);
              return (
                <div className="otd-totem__summoning-stat">
                  {t('totem_summoning_reached_in', { hh, mm, ss })}
                </div>
              );
            })()}
            <div className="otd-totem__title otd-totem__title--summoning">
              {t('totem_summoning_title')}
            </div>
          </>
        ) : (
          <div className="otd-totem__title">{t('totem_title')}</div>
        )}

        {totem ? (
          <>
            <div className="otd-totem__image">
              <img src={totem.imageUrl} alt="today's totem" draggable={false} />
            </div>
            <div className="otd-totem__caption">"{totem.caption}"</div>
            <div className="otd-totem__sub">{t('totem_subtitle', { n: totem.summonedBy })}</div>
          </>
        ) : (
          <div className="otd-totem__summoning">
            <div className="otd-totem__loading-disc" aria-hidden>
              <div className="otd-totem__loading-art" />
              <div className="otd-totem__loading-ring" />
            </div>
            <SummoningPoetry />
            <div className="otd-totem__summoning-hint">
              {t('totem_summoning_hint')}
            </div>
          </div>
        )}

        <div className="otd-totem__buttons">
          {totem && (
            <button
              type="button"
              className="otd-totem__save"
              onPointerDown={handleSave}
              disabled={saving}
            >
              {t('totem_save')}
            </button>
          )}
          {onArchive && (
            <button type="button" className="otd-totem__archive" onPointerDown={onArchive}>
              {t('totem_archive')}
            </button>
          )}
          <button type="button" className="otd-totem__close" onPointerDown={onClose}>
            {t('totem_close')}
          </button>
        </div>
      </div>
    </div>
  );
}
