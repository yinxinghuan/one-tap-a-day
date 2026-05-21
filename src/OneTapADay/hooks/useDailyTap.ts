// Core game state machine. Owns:
//   - whether the user has tapped today
//   - the streak number (+ persisted "longest streak" tombstone)
//   - the today's-totem object (gen-image + caption when threshold hit)
//   - lifecycle: refreshing stats on tap, polling save list for totem reveal

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useGameEvent,
  useGameStats,
  useGenImage,
  useChat,
  callAigramAPI,
  postAigramAPI,
  telegramId,
  isInAigram,
  getGameUuid,
  type AigramResponse,
} from '@shared/runtime';
import { useGameSave } from '@shared/save';
import { utcDayString } from '../utils/day';
import { totemPrompt, captionPrompt, TOTEM_CAPTION_SYSTEM } from '../utils/totem';

const EVENT_NAME = 'tap';
export const TOTEM_THRESHOLD = 100;

// Demo / preview mode — when the game is opened outside Aigram (e.g. on the
// GitHub Pages preview URL) with a `?demo=<state>` query param, the hook
// returns mocked values so reviewers can step through every post-tap state
// without a real platform feed:
//   ?demo=tap        fresh tap state (default if no value)
//   ?demo=tapped     already tapped today, mid-streak, countdown showing
//   ?demo=summoning  totem-summoning spinner modal
//   ?demo=totem      full totem reveal modal with placeholder image + caption
//   ?demo=tombstone  streak-broken view with longest-streak tombstone
//   ?demo=crowded    dense visualization — all 47 of today's tappers as
//                    mock avatars (for evaluating the ring layout when
//                    every slot is a known user)
type DemoMode = 'tap' | 'tapped' | 'summoning' | 'totem' | 'tombstone' | 'crowded';
function readDemoMode(): DemoMode | null {
  if (typeof window === 'undefined') return null;
  const v = new URLSearchParams(window.location.search).get('demo');
  if (v === 'tap' || v === 'tapped' || v === 'summoning' || v === 'totem' || v === 'tombstone' || v === 'crowded') {
    return v;
  }
  return null;
}

export interface TodayTotem {
  date: string;             // YYYY-MM-DD (UTC)
  imageUrl: string;
  caption: string;
  summonedBy: number;       // day_user_count at the moment of generation
}

export interface LocalState {
  lastTapDay: string | null;   // last UTC day string we tapped
  longestStreak: number;       // best continuous_days we've ever seen for this user
  lastSeenStreak: number;      // last known continuous_days (for tombstone detection)
  seenOnboarding: boolean;
  acknowledgedTombFor: string | null;   // day string of the last tombstone the user dismissed
  totemHistory: TodayTotem[];           // past totems the player has been part of
}

const DEFAULT_LOCAL: LocalState = {
  lastTapDay: null,
  longestStreak: 0,
  lastSeenStreak: 0,
  seenOnboarding: false,
  acknowledgedTombFor: null,
  totemHistory: [],
};

export interface OrbitUser {
  id: string;
  name?: string;        // shown radially outside the avatar
  url?: string;         // avatar image
  initial?: string;     // fallback when url is missing
  isSelf?: boolean;
}

interface TotemSaveRow {
  user_id: string;
  resource_data: string;
}

export function useDailyTap() {
  const today = utcDayString();
  const sessionId = getGameUuid();
  const { trigger, canEmit } = useGameEvent();
  const { stats, refresh } = useGameStats(EVENT_NAME);
  const { generate } = useGenImage();
  const { send: chatSend } = useChat({ system: TOTEM_CAPTION_SYSTEM, maxHistory: 0 });
  const { savedData, persist } = useGameSave<LocalState>('one-tap-a-day');

  const [local, setLocal] = useState<LocalState>(DEFAULT_LOCAL);
  const [todayTotem, setTodayTotem] = useState<TodayTotem | null>(null);
  const [totemSummoning, setTotemSummoning] = useState(false);
  const [justTapped, setJustTapped] = useState(false);

  const generationStartedRef = useRef(false);

  // Initial local load
  useEffect(() => {
    if (savedData === undefined) return;        // still loading
    setLocal(savedData ?? DEFAULT_LOCAL);
  }, [savedData]);

  // Mirror "longest streak" tombstone + detect streak break
  useEffect(() => {
    if (!stats) return;
    setLocal(prev => {
      const longest = Math.max(prev.longestStreak, stats.continuous_days);
      // Streak break: previous lastSeenStreak >= 2 AND the platform now shows
      // continuous_days === 0 (or strictly less than lastSeenStreak by >= 2,
      // meaning we missed at least one day).
      const broken = prev.lastSeenStreak >= 1 && stats.continuous_days === 0;
      const next: LocalState = {
        ...prev,
        longestStreak: longest,
        lastSeenStreak: stats.continuous_days,
      };
      if (broken || JSON.stringify(next) !== JSON.stringify(prev)) {
        persist(next);
      }
      return next;
    });
  }, [stats, persist]);

  // Has the user tapped today? Two truthy signals — either is enough:
  //   1. localStorage day marker matches today (we just tapped this session)
  //   2. continuous_days >= 1 AND lastTapDay === today (we previously tapped)
  // The first one handles the post-tap state before refresh returns; the
  // second survives reload.
  const tappedToday = local.lastTapDay === today;

  // Fetch today's totem from save list (any user's save for today wins —
  // there's only one "today's totem" globally).
  const fetchTodayTotem = useCallback(async (): Promise<TodayTotem | null> => {
    if (!isInAigram || !sessionId) return null;
    try {
      const res = await callAigramAPI<AigramResponse<TotemSaveRow[]>>(
        `/note/aigram/ai/game/get/data/list?session_id=${encodeURIComponent(sessionId)}`,
        'GET',
      );
      const rows = Array.isArray(res?.data) ? res.data : [];
      for (const row of rows) {
        if (!row.resource_data) continue;
        try {
          const parsed = JSON.parse(row.resource_data);
          // Match either of two save shapes — local user state or totem record.
          if (parsed && parsed.date === today && parsed.imageUrl && parsed.caption) {
            return parsed as TodayTotem;
          }
          // Some users' saves may carry .totem field
          if (parsed && parsed.totem && parsed.totem.date === today) {
            return parsed.totem as TodayTotem;
          }
        } catch { /* skip corrupt */ }
      }
    } catch { /* network */ }
    return null;
  }, [sessionId, today]);

  // Write the totem out to save list so others can read it.
  const writeTotem = useCallback((totem: TodayTotem) => {
    if (!isInAigram || !sessionId || !telegramId) return;
    postAigramAPI('/note/aigram/ai/game/save/data', {
      session_id: sessionId,
      resource_data: JSON.stringify(totem),
    });
  }, [sessionId]);

  // Threshold watcher — when day_user_count crosses TOTEM_THRESHOLD and we
  // have no totem yet, the first browser to notice kicks off generation.
  useEffect(() => {
    if (!stats) return;
    if (todayTotem) return;
    if (stats.day_user_count < TOTEM_THRESHOLD) return;
    if (generationStartedRef.current) return;

    let cancelled = false;
    generationStartedRef.current = true;

    (async () => {
      // Re-fetch first — maybe someone else already generated.
      const existing = await fetchTodayTotem();
      if (cancelled) return;
      if (existing) {
        setTodayTotem(existing);
        return;
      }

      setTotemSummoning(true);
      try {
        const [imageUrl, caption] = await Promise.all([
          generate({ prompt: totemPrompt(today) }),
          chatSend(captionPrompt(today)).catch(() => 'an ordinary day, somehow held'),
        ]);
        if (cancelled) return;
        const totem: TodayTotem = {
          date: today,
          imageUrl,
          caption: (caption || '').trim().toLowerCase().replace(/[.!?]+$/, ''),
          summonedBy: stats.day_user_count,
        };
        setTodayTotem(totem);
        writeTotem(totem);
      } catch {
        // Generation failed — clear the "started" flag so a refresh can retry.
        generationStartedRef.current = false;
      } finally {
        if (!cancelled) setTotemSummoning(false);
      }
    })();

    return () => { cancelled = true; };
  }, [stats, todayTotem, today, generate, chatSend, fetchTodayTotem, writeTotem]);

  // Look for an already-existing totem on mount / day change.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const existing = await fetchTodayTotem();
      if (!cancelled && existing) setTodayTotem(existing);
    })();
    return () => { cancelled = true; };
  }, [fetchTodayTotem]);

  // The single act: trigger event, mark locally, refresh stats.
  const tap = useCallback(() => {
    if (tappedToday) return;
    if (!canEmit) {
      // Out-of-Aigram preview: still progress the local UI for testing.
      setLocal(prev => {
        const next = { ...prev, lastTapDay: today };
        persist(next);
        return next;
      });
      setJustTapped(true);
      return;
    }
    trigger(EVENT_NAME);
    setLocal(prev => {
      const next = { ...prev, lastTapDay: today };
      persist(next);
      return next;
    });
    setJustTapped(true);
    // Small delay so platform finishes recording before we read.
    setTimeout(() => { void refresh(); }, 600);
    setTimeout(() => { void refresh(); }, 2200);
  }, [tappedToday, canEmit, trigger, today, persist, refresh]);

  const markOnboarded = useCallback(() => {
    setLocal(prev => {
      if (prev.seenOnboarding) return prev;
      const next = { ...prev, seenOnboarding: true };
      persist(next);
      return next;
    });
  }, [persist]);

  // User has stared at the tombstone long enough — dismiss for today.
  const acknowledgeTombstone = useCallback(() => {
    setLocal(prev => {
      const next = { ...prev, acknowledgedTombFor: today };
      persist(next);
      return next;
    });
  }, [persist, today]);

  // When a brand-new totem is revealed, push it into history (deduped by date).
  useEffect(() => {
    if (!todayTotem) return;
    setLocal(prev => {
      const exists = prev.totemHistory.some(t => t.date === todayTotem.date);
      if (exists) return prev;
      const next: LocalState = {
        ...prev,
        totemHistory: [todayTotem, ...prev.totemHistory].slice(0, 365),
      };
      persist(next);
      return next;
    });
  }, [todayTotem, persist]);

  const streakBroken =
    local.longestStreak >= 1 && stats.continuous_days === 0 && !tappedToday;

  // Build orbit avatar list. Real mode: leave empty (renderer falls back to
  // abstract ring dots). Demo mode below populates with mocks.
  const orbitUsers: OrbitUser[] = [];

  const baseReturn = {
    today,
    tappedToday,
    tap,
    justTapped,
    stats,
    canEmit,
    isInAigram,
    seenOnboarding: local.seenOnboarding,
    markOnboarded,
    longestStreak: local.longestStreak,
    streakBroken,
    showTombstone: streakBroken && local.acknowledgedTombFor !== today,
    acknowledgeTombstone,
    todayTotem,
    totemSummoning,
    /** ISO timestamp captured the moment the platform crossed the totem
     * threshold — passed to the summoning screen so it can report "how
     * long into the day it was reached". For now we set it on the
     * frontend when summoning starts; once the platform exposes it on
     * record/play, swap in the real value. */
    totemSummonedAt: undefined as string | undefined,
    totemHistory: local.totemHistory,
    orbitUsers,
  };

  // ---------- Demo-mode override ----------
  const demoMode = readDemoMode();
  if (!demoMode) return baseReturn;

  const demoStats = {
    day_click_count: 0,
    total_click_count: 0,
    total_user_count: 0,
    day_user_count: 0,
    continuous_days: 0,
  };
  const demoTotem: TodayTotem = {
    date: today,
    imageUrl: '/one-tap-a-day/demo-totem.png',
    caption: 'the small bell no one rang today',
    summonedBy: 142,
  };
  // Mock orbit avatars — used in every demo state to show the avatar ring
  // rather than the abstract glyph dots.
  const demoAvatars: OrbitUser[] = [
    { id: 'm', isSelf: true, name: 'Marina', initial: 'M' },
    { id: 'a', name: 'Aria',   initial: 'A', url: 'https://i.pravatar.cc/64?img=12' },
    { id: 'i', name: 'Iris',   initial: 'I', url: 'https://i.pravatar.cc/64?img=33' },
    { id: 'j', name: 'Juno',   initial: 'J', url: 'https://i.pravatar.cc/64?img=47' },
    { id: 'g', name: 'Galen',  initial: 'G', url: 'https://i.pravatar.cc/64?img=5' },
    { id: 'b', name: 'Beck',   initial: 'B', url: 'https://i.pravatar.cc/64?img=68' },
  ];
  // Densely-populated mock — 47 fake avatars with names. Used by
  // ?demo=crowded to visualize the ring at full daily count.
  //
  // Names mix short nicknames ("Wenjun", "Bjørn"), Telegram-style handles
  // ("alex_chen", "yasmine.n"), and full first-last pairs ("Marina Reyes",
  // "Kai Watanabe"). The orbit's `truncate()` takes the first word, then
  // ellipsis-caps at 10 characters — closer to real production data.
  const CROWD_NAMES = [
    'Marina Reyes', 'alex_chen', 'Jenny Park', 'ghostpixel', 'IsabelM',
    'Aleksandar', 'Catherine_K', 'yasmine.n', 'Theo Vargas', 'Wenjun',
    'Sage Holm', 'Leo Martín', 'Mira Tan', 'Akinori', 'Ren Naka',
    'Liora Rosen', 'Eva Sanchez', 'Cleo Adekun', 'Otto Schmidt', 'Zara Sahin',
    'Kai Watanabe', 'Anya Petrov', 'Bjørn', 'Cora MacLean', 'Daxton',
    'Elin Berg', 'Finnegan', 'Gemma Costa', 'Hugo Lara', 'Inés Vega',
    'Jax Reed', 'Klara Wojcik', 'Lev Sokol', 'Maya Patel', 'Niko Vasili',
    "Owen O'Brien", 'Pia Bauer', 'Quinlan', 'Rae Hartman', 'Sol Cabrera',
    'Tora Suzuki', 'Uri Naveh', 'Vera Petrenko', 'Wes Davies', 'Xander',
    'Yara Habibi', 'Zen Yamashita',
  ];
  const crowdedAvatars: OrbitUser[] = CROWD_NAMES.map((name, i) => ({
    id: `u${i}`,
    name,
    initial: name[0],
    url: `https://i.pravatar.cc/64?img=${(i % 70) + 1}`,
    isSelf: i === 0,
  }));
  // Mock past totems for the archive demo. Uses the totem variants
  // generated by gen_demo_totem.py.
  const demoHistory: TodayTotem[] = [
    { date: '2026-05-20', imageUrl: '/one-tap-a-day/demo-totem-2.png',
      caption: 'the candle that chose its flame', summonedBy: 156 },
    { date: '2026-05-19', imageUrl: '/one-tap-a-day/demo-totem-3.png',
      caption: 'a feather decided how to fall', summonedBy: 134 },
    { date: '2026-05-18', imageUrl: '/one-tap-a-day/demo-totem-4.png',
      caption: 'the river chose its color', summonedBy: 188 },
    { date: '2026-05-17', imageUrl: '/one-tap-a-day/demo-totem-5.png',
      caption: 'a small bell was cast', summonedBy: 119 },
    { date: '2026-05-16', imageUrl: '/one-tap-a-day/demo-totem-6.png',
      caption: 'the smoke found its shape', summonedBy: 101 },
    { date: '2026-05-15', imageUrl: '/one-tap-a-day/demo-totem.png',
      caption: 'todays stone has not landed', summonedBy: 142 },
  ];

  switch (demoMode) {
    case 'tap':
      return {
        ...baseReturn,
        seenOnboarding: true,
        tappedToday: false,
        orbitUsers: demoAvatars,
        totemHistory: demoHistory,
        stats: { ...demoStats, day_user_count: 23, total_user_count: 1840 },
      };
    case 'tapped':
      return {
        ...baseReturn,
        seenOnboarding: true,
        tappedToday: true,
        orbitUsers: demoAvatars,
        totemHistory: demoHistory,
        stats: { ...demoStats, day_user_count: 47, continuous_days: 7, total_user_count: 1840 },
      };
    case 'summoning':
      return {
        ...baseReturn,
        seenOnboarding: true,
        tappedToday: true,
        orbitUsers: demoAvatars,
        totemHistory: demoHistory,
        stats: { ...demoStats, day_user_count: 100, continuous_days: 12, total_user_count: 2370 },
        totemSummoning: true,
        // Mock: threshold reached 9h 32m 14s into today (UTC).
        totemSummonedAt: `${today}T09:32:14Z`,
      };
    case 'totem':
      return {
        ...baseReturn,
        seenOnboarding: true,
        tappedToday: true,
        orbitUsers: demoAvatars,
        totemHistory: demoHistory,
        stats: { ...demoStats, day_user_count: 142, continuous_days: 12, total_user_count: 2370 },
        todayTotem: demoTotem,
      };
    case 'tombstone':
      return {
        ...baseReturn,
        seenOnboarding: true,
        tappedToday: false,
        longestStreak: 23,
        streakBroken: true,
        showTombstone: true,
        orbitUsers: demoAvatars,
        totemHistory: demoHistory,
        stats: { ...demoStats, day_user_count: 12, total_user_count: 2200 },
      };
    case 'crowded':
      return {
        ...baseReturn,
        seenOnboarding: true,
        tappedToday: true,
        orbitUsers: crowdedAvatars,
        totemHistory: demoHistory,
        stats: { ...demoStats, day_user_count: 47, continuous_days: 7, total_user_count: 1840 },
      };
  }
}
