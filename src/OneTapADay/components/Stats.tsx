import { t } from '../i18n';
import { TOTEM_THRESHOLD } from '../hooks/useDailyTap';

interface Props {
  streak: number;
  todayCount: number;
  tapped: boolean;
}

export function Stats({ streak, todayCount, tapped }: Props) {
  const remaining = Math.max(0, TOTEM_THRESHOLD - todayCount);
  return (
    <div className="otd-stats">
      <div className="otd-stats__streak">
        {streak >= 1 ? t('streak', { n: streak }) : t('streak_zero')}
      </div>
      <div className="otd-stats__row">
        <span className="otd-stats__today">
          {tapped ? t('today_total', { n: todayCount }) : t('today_others', { n: todayCount })}
        </span>
        {remaining > 0 && (
          <>
            <span className="otd-stats__sep">·</span>
            <span className="otd-stats__totem">{t('to_totem', { n: remaining })}</span>
          </>
        )}
      </div>
    </div>
  );
}
