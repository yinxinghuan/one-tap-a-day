import { useCallback, useEffect, useState } from 'react';
import { useDailyTap } from './hooks/useDailyTap';
import { TapButton } from './components/TapButton';
import { Orbit } from './components/Orbit';
import { Stats } from './components/Stats';
import { Countdown } from './components/Countdown';
import { Onboarding } from './components/Onboarding';
import { TotemReveal } from './components/TotemReveal';
import { Tombstone } from './components/Tombstone';
import { Archive } from './components/Archive';
import { prettyDate } from './utils/day';
import { startAmbient, playTap } from './utils/audio';
import { t } from './i18n';
import './OneTapADay.less';

export default function OneTapADay() {
  const {
    tappedToday,
    tap,
    justTapped,
    stats,
    seenOnboarding,
    markOnboarded,
    longestStreak,
    lastTapDay,
    showTombstone,
    acknowledgeTombstone,
    todayTotem,
    totemSummoning,
    totemSummonedAt,
    totemHistory,
    orbitUsers,
  } = useDailyTap();

  const [showTotem, setShowTotem] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const audioReadyRef = useState({ ready: false })[0];

  const ensureAudio = useCallback(() => {
    if (audioReadyRef.ready) return;
    audioReadyRef.ready = true;
    startAmbient();
  }, [audioReadyRef]);

  useEffect(() => {
    if ((todayTotem || totemSummoning) && tappedToday) {
      setShowTotem(true);
    }
  }, [todayTotem, totemSummoning, tappedToday]);

  const handleTap = useCallback(() => {
    ensureAudio();
    if (tappedToday) return;
    playTap();
    tap();
  }, [ensureAudio, tappedToday, tap]);

  const handleOnboardDismiss = useCallback(() => {
    ensureAudio();
    markOnboarded();
  }, [ensureAudio, markOnboarded]);

  const handleTombDismiss = useCallback(() => {
    ensureAudio();
    acknowledgeTombstone();
  }, [ensureAudio, acknowledgeTombstone]);

  const stageClass = `otd-stage${tappedToday ? ' otd-stage--tapped' : ''}`;

  return (
    <div className={stageClass} onPointerDown={ensureAudio}>
      <div className="otd-bg" />
      <div className="otd-relief otd-relief--bg" aria-hidden>
        <div className="otd-relief__highlight" />
        <div className="otd-relief__shadow" />
      </div>

      <header className="otd-header">
        <div className="otd-header__brand">
          ALTER<span className="otd-header__brand-u">U</span>
        </div>
        <div className="otd-header__date">{prettyDate()}</div>
      </header>

      <main className="otd-main">
        <div className="otd-stage__center">
          <div className="otd-halo" aria-hidden />
          <Orbit avatars={orbitUsers} count={stats.day_user_count} />
          <TapButton tapped={tappedToday} onTap={handleTap} />
        </div>

        {!tappedToday && !justTapped && (
          <div className="otd-hint">{t('hint')}</div>
        )}

        <Stats
          streak={stats.continuous_days}
          todayCount={stats.day_user_count}
          tapped={tappedToday}
        />

        {tappedToday && <Countdown />}

        {tappedToday && todayTotem && (
          <button
            type="button"
            className="otd-totem-trigger"
            onPointerDown={() => setShowTotem(true)}
          >
            {t('totem_title')}
          </button>
        )}
      </main>

      <footer className="otd-foot">
        <button
          type="button"
          className="otd-foot__archive"
          onPointerDown={() => setShowArchive(true)}
        >
          {t('archive_link')}
        </button>
        <img src="/one-tap-a-day/alteru.svg" alt="alteru" className="otd-foot__mark" />
      </footer>

      {!seenOnboarding && <Onboarding onDismiss={handleOnboardDismiss} />}

      {showTombstone && (
        <Tombstone
          bestStreak={longestStreak}
          lastTapDay={lastTapDay}
          onContinue={handleTombDismiss}
        />
      )}

      {showTotem && (
        <TotemReveal
          totem={todayTotem}
          summoning={totemSummoning && !todayTotem}
          summonCount={stats.day_user_count}
          summonedAt={totemSummonedAt}
          onClose={() => setShowTotem(false)}
          onArchive={() => {
            setShowTotem(false);
            setShowArchive(true);
          }}
        />
      )}

      {showArchive && (
        <Archive totems={totemHistory} onClose={() => setShowArchive(false)} />
      )}
    </div>
  );
}
