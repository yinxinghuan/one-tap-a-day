import { useEffect, useState } from 'react';
import { msUntilNextUtcMidnight, formatHM } from '../utils/day';
import { t } from '../i18n';

export function Countdown() {
  const [ms, setMs] = useState(() => msUntilNextUtcMidnight());

  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNextUtcMidnight()), 30_000);
    return () => clearInterval(id);
  }, []);

  const { hh, mm } = formatHM(ms);
  return <div className="otd-countdown">{t('next_tap', { hh, mm })}</div>;
}
