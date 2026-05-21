import { useEffect } from 'react';
import { t } from '../i18n';
import type { TodayTotem } from '../hooks/useDailyTap';
import { playRevealChord } from '../utils/audio';
import { SummoningPoetry } from './SummoningPoetry';

interface Props {
  totem: TodayTotem | null;
  summoning: boolean;
  onClose: () => void;
  onArchive?: () => void;
}

export function TotemReveal({ totem, summoning, onClose, onArchive }: Props) {
  useEffect(() => {
    if (totem) playRevealChord();
  }, [totem]);

  if (!totem && !summoning) return null;

  const isLoading = !totem && summoning;

  return (
    <div className="otd-totem" onPointerDown={onClose}>
      <div className="otd-totem__card" onPointerDown={e => e.stopPropagation()}>
        {isLoading ? (
          <div className="otd-totem__title otd-totem__title--summoning">
            {t('totem_summoning_title')}
          </div>
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
