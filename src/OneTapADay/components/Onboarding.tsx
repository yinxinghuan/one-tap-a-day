import { useCallback } from 'react';
import { t } from '../i18n';

interface Props {
  onDismiss: () => void;
}

export function Onboarding({ onDismiss }: Props) {
  const handle = useCallback(() => onDismiss(), [onDismiss]);

  return (
    <div className="otd-onboard" onPointerDown={handle}>
      <div className="otd-onboard__card">
        {/* Hero — woodblock totem fades in first as the visual hook. */}
        <div className="otd-onboard__hero" aria-hidden>
          <div className="otd-onboard__hero-halo" />
          <img
            src={`${import.meta.env.BASE_URL}demo-totem.png`}
            alt=""
            draggable={false}
          />
        </div>

        <div className="otd-onboard__title">{t('onboard_title')}</div>
        <div className="otd-onboard__line otd-onboard__line--1">
          {t('onboard_line1')}
        </div>
        <div className="otd-onboard__line otd-onboard__line--2">
          {t('onboard_line2')}
        </div>

        <button
          type="button"
          className="otd-onboard__cta"
          onPointerDown={handle}
        >
          {t('onboard_cta')}
        </button>
      </div>
    </div>
  );
}
