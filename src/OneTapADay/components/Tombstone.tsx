import { useCallback } from 'react';
import { t } from '../i18n';

interface Props {
  bestStreak: number;
  onContinue: () => void;
}

export function Tombstone({ bestStreak, onContinue }: Props) {
  const handle = useCallback(() => onContinue(), [onContinue]);
  return (
    <div className="otd-tomb-screen" onPointerDown={handle}>
      <div className="otd-tomb-screen__card" onPointerDown={e => e.stopPropagation()}>
        <div className="otd-tomb-screen__sigil" aria-hidden>
          <span className="otd-tomb-screen__alpha">α</span>
        </div>

        <div className="otd-tomb-screen__title">{t('streak_broken_title')}</div>
        <div className="otd-tomb-screen__lead">{t('streak_broken_lead')}</div>

        <div className="otd-tomb-screen__rule" aria-hidden />

        <div className="otd-tomb-screen__best">{t('tombstone', { n: bestStreak })}</div>

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
