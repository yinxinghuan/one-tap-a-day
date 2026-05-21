import { useCallback, useState } from 'react';
import { t } from '../i18n';

interface Props {
  tapped: boolean;
  onTap: () => void;
}

export function TapButton({ tapped, onTap }: Props) {
  const [pressed, setPressed] = useState(false);

  const handlePointerDown = useCallback(() => {
    if (tapped) return;
    setPressed(true);
    onTap();
    setTimeout(() => setPressed(false), 220);
  }, [tapped, onTap]);

  return (
    <button
      type="button"
      className={`otd-tap-btn${tapped ? ' otd-tap-btn--tapped' : ''}${pressed ? ' otd-tap-btn--pressed' : ''}`}
      onPointerDown={handlePointerDown}
      disabled={tapped}
      aria-label={tapped ? t('tapped') : t('tap_label')}
    >
      <span className="otd-tap-btn__inner">
        <span className="otd-tap-btn__alpha">α</span>
        <span className="otd-tap-btn__label">
          {tapped ? t('tapped') : t('tap_label')}
        </span>
      </span>
      <span className="otd-tap-btn__ring" />
      {pressed && <span className="otd-tap-btn__ripple" />}
    </button>
  );
}
