import { t } from '../i18n';

interface Props {
  bestStreak: number;
}

export function Tombstone({ bestStreak }: Props) {
  return (
    <div className="otd-tomb">
      <div className="otd-tomb__title">{t('streak_broken_title')}</div>
      <div className="otd-tomb__sub">{t('streak_broken_sub')}</div>
      <div className="otd-tomb__best">{t('tombstone', { n: bestStreak })}</div>
    </div>
  );
}
