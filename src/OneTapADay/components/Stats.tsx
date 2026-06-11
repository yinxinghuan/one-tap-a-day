import { t } from '../i18n';
import { nextMilestone } from '../hooks/useDailyTap';

interface Props {
  /** Continuous-days streak from platform stats. */
  streak: number;
  /** Lifetime cumulative unique tappers (total_user_count). Headline number
   *  the game now grows against — the daily reset was unreachable at the
   *  current ~5/day traffic, so the goal pivoted to cumulative
   *  milestones (totem unlocks every TOTEM_THRESHOLD unique users). */
  totalCount: number;
  /** Today's unique tappers (day_user_count). Kept as a smaller side-note
   *  so the social "circle today" feeling stays — but it's no longer the
   *  thing the goal line counts against. */
  todayCount: number;
  /** True once this user tapped today — flips the "5 others" phrasing
   *  to "5 today" so the player counts themselves in. */
  tapped: boolean;
}

export function Stats({ streak, totalCount, todayCount, tapped }: Props) {
  const target = nextMilestone(totalCount);
  const remaining = Math.max(0, target - totalCount);
  return (
    <div className="otd-stats">
      <div className="otd-stats__streak">
        {streak >= 1 ? t('streak', { n: streak }) : t('streak_zero')}
      </div>
      {/* Hero: lifetime cumulative. The growth-line the totem unlocks against. */}
      <div className="otd-stats__lifetime">
        {t('lifetime_count', { n: totalCount })}
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
