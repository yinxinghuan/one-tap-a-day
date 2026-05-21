import { useEffect } from 'react';
import { t } from '../i18n';
import type { TodayTotem } from '../hooks/useDailyTap';
import { playRevealChord } from '../utils/audio';

interface Props {
  totem: TodayTotem | null;
  summoning: boolean;
  onClose: () => void;
}

export function TotemReveal({ totem, summoning, onClose }: Props) {
  useEffect(() => {
    if (totem) playRevealChord();
  }, [totem]);

  if (!totem && !summoning) return null;

  return (
    <div className="otd-totem" onPointerDown={onClose}>
      <div className="otd-totem__card" onPointerDown={e => e.stopPropagation()}>
        <div className="otd-totem__title">{t('totem_title')}</div>
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
            <div className="otd-totem__spinner" />
            <div>{t('totem_summoning')}</div>
          </div>
        )}
        <button type="button" className="otd-totem__close" onPointerDown={onClose}>
          {t('totem_close')}
        </button>
      </div>
    </div>
  );
}
