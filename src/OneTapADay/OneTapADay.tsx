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
    // Auto-open the reveal modal only when:
    //   · the user just tapped today AND
    //   · either a summon is in flight (their tap may be the one that
    //     crossed the milestone), or the cached totem we have was
    //     unlocked on today's UTC date (it's the freshly-summoned one).
    // Past-milestone totems (from previous days) stay accessible via
    // the totem-trigger button, but don't auto-popup on every tap.
    if (!tappedToday) return;
    if (totemSummoning) { setShowTotem(true); return; }
    if (todayTotem && todayTotem.date === todayTotem.date /* date present */) {
      const unlockedToday = todayTotem.date && todayTotem.date.length === 10 &&
        todayTotem.date === new Date().toISOString().slice(0, 10);
      if (unlockedToday) setShowTotem(true);
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

  // ?debug=1 surfaces the raw platform stats inline. The user reported
  // day_user_count seems suspiciously stuck >= 99 in prod — this panel
  // lets us see exactly what the API returned without needing a
  // remote debugger attached.
  const debugOn = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('debug') === '1';

  return (
    <div className={stageClass} onPointerDown={ensureAudio}>
      <div className="otd-bg" />
      <div className="otd-relief otd-relief--bg" aria-hidden>
        <div className="otd-relief__highlight" />
        <div className="otd-relief__shadow" />
      </div>

      {debugOn && (
        <div className="otd-debug-panel" role="note">
          <div className="otd-debug-panel__title">STATS · DEBUG</div>
          <div className="otd-debug-panel__row">
            <span>day_click</span><strong>{stats.day_click_count}</strong>
          </div>
          <div className="otd-debug-panel__row">
            <span>day_user</span><strong>{stats.day_user_count}</strong>
          </div>
          <div className="otd-debug-panel__row">
            <span>total_click</span><strong>{stats.total_click_count}</strong>
          </div>
          <div className="otd-debug-panel__row">
            <span>total_user</span><strong>{stats.total_user_count}</strong>
          </div>
          <div className="otd-debug-panel__row">
            <span>cont_days</span><strong>{stats.continuous_days}</strong>
          </div>
          <div className="otd-debug-panel__row">
            <span>orbitUsers</span><strong>{orbitUsers.length}</strong>
          </div>
        </div>
      )}

      <header className="otd-header">
        <div className="otd-header__brand">
          ALTER<span className="otd-header__brand-u">U</span>
        </div>
        <div className="otd-header__date">{prettyDate()}</div>
      </header>

      <main className="otd-main">
        <div className="otd-stage__center">
          <div className="otd-halo" aria-hidden />
          <Orbit avatars={orbitUsers} count={stats.total_user_count} />
          <TapButton tapped={tappedToday} onTap={handleTap} />
        </div>

        {!tappedToday && !justTapped && (
          <div className="otd-hint">{t('hint')}</div>
        )}

        <Stats
          streak={stats.continuous_days}
          totalCount={stats.total_user_count}
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
        <img src={`${import.meta.env.BASE_URL}alteru.svg`} alt="alteru" className="otd-foot__mark" />
        <button
          type="button"
          className="otd-foot__archive"
          onPointerDown={() => setShowArchive(true)}
          aria-label={t('archive_link')}
        >
          {/* Three-circle stacked-cards icon — reads as a pile of totems */}
          <svg className="otd-foot__archive-icon" viewBox="0 0 24 24" aria-hidden>
            <circle cx="6" cy="13" r="5" />
            <circle cx="12" cy="11" r="5" />
            <circle cx="18" cy="13" r="5" />
          </svg>
          <span className="otd-foot__archive-text">{t('archive_link')}</span>
        </button>
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
          summonCount={stats.total_user_count}
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
