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

/** Cohort milestone interval. The game unlocks one totem every time the
 *  lifetime-cumulative number of unique tappers crosses another multiple
 *  of this value. Was "100 unique users TODAY"; user reported daily
 *  traffic is ~5-6 so the daily target was structurally unreachable.
 *  2026-06-12 pivoted to lifetime cumulative — at ~5/day cadence the
 *  first totem lands in ~3 weeks, then a new totem every milestone after. */
export const TOTEM_THRESHOLD = 100;

/** The highest milestone the lifetime tappers count has crossed (0 if not
 *  yet hit the first one). */
export function currentMilestone(totalUsers: number): number {
  return Math.floor(totalUsers / TOTEM_THRESHOLD) * TOTEM_THRESHOLD;
}

/** The next milestone the lifetime tappers count is climbing toward. */
export function nextMilestone(totalUsers: number): number {
  return currentMilestone(totalUsers) + TOTEM_THRESHOLD;
}

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
  /** UTC day the totem was unlocked (when its milestone was crossed). */
  date: string;
  imageUrl: string;
  caption: string;
  /** Lifetime total_user_count at the moment of generation. */
  summonedBy: number;
  /** The lifetime-cumulative milestone this totem represents (100, 200,
   *  300, ...). Optional for backward compat — pre-2026-06-12 saves are
   *  date-keyed, no milestone. The archive still displays them. */
  milestone?: number;
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

/** Does this save row indicate the user tapped today? Accepts either the
 *  LocalState shape (has lastTapDay) or the TodayTotem shape (has date +
 *  imageUrl — whoever wrote the totem is by definition a today-tapper). */
function savedRowIsTappedToday(resourceData: string | undefined, today: string): boolean {
  if (!resourceData) return false;
  try {
    const parsed = JSON.parse(resourceData);
    if (!parsed || typeof parsed !== 'object') return false;
    if (parsed.lastTapDay === today) return true;
    if (parsed.date === today && parsed.imageUrl) return true;
    return false;
  } catch { return false; }
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

  // Has the user tapped today? ONE signal — the local save's lastTapDay.
  // `useGameSave` already round-trips through the platform cloud save, so
  // a webview that drops localStorage still recovers `lastTapDay` from the
  // cloud copy on next mount.
  //
  // DO NOT add a platform-stats fallback here. Two earlier traps:
  //   - `continuous_days` carries yesterday's value, so it cannot mean
  //     "tapped today" — phantom-locked every returning user.
  //   - `day_click_count >= 1` was suspected of stale state across UTC
  //     midnight (see feedback_platform_daily_stat_lock_trap.md). When
  //     that stat doesn't reset, OR-ing it into `tappedToday` locks the
  //     user permanently on day N+1. Removed 2026-05-31 after the
  //     user-reported "can't tap again the next day" bug.
  const tappedToday = local.lastTapDay === today;

  // Fetch the totem for a given milestone (e.g. 100, 200) from save list.
  // Any user's save that matches the milestone wins — there's only one
  // totem per milestone globally. If none match by milestone, falls back
  // to the most recent date-keyed save (for legacy support: pre-2026-06-12
  // saves had no milestone field).
  const fetchTotemForMilestone = useCallback(async (milestone: number): Promise<TodayTotem | null> => {
    if (!isInAigram || !sessionId) return null;
    try {
      const res = await callAigramAPI<AigramResponse<TotemSaveRow[]>>(
        `/note/aigram/ai/game/get/data/list?session_id=${encodeURIComponent(sessionId)}`,
        'GET',
      );
      const rows = Array.isArray(res?.data) ? res.data : [];
      // First pass — match by milestone (the new shape).
      for (const row of rows) {
        if (!row.resource_data) continue;
        try {
          const parsed = JSON.parse(row.resource_data);
          if (parsed && parsed.milestone === milestone && parsed.imageUrl && parsed.caption) {
            return parsed as TodayTotem;
          }
          if (parsed && parsed.totem && parsed.totem.milestone === milestone) {
            return parsed.totem as TodayTotem;
          }
        } catch { /* skip corrupt */ }
      }
    } catch { /* network */ }
    return null;
  }, [sessionId]);

  // Write the totem out to save list so others can read it.
  const writeTotem = useCallback((totem: TodayTotem) => {
    if (!isInAigram || !sessionId || !telegramId) return;
    postAigramAPI('/note/aigram/ai/game/save/data', {
      session_id: sessionId,
      resource_data: JSON.stringify(totem),
    });
  }, [sessionId]);

  // Threshold watcher — when total_user_count crosses a milestone (100,
  // 200, 300, ...) and we don't already have a totem for that milestone,
  // the first browser to notice kicks off generation. Lifetime cumulative
  // model since 2026-06-12 (was daily; daily target unreachable at
  // current traffic).
  useEffect(() => {
    if (!stats) return;
    const cm = currentMilestone(stats.total_user_count);
    if (cm < TOTEM_THRESHOLD) return; // haven't crossed first milestone
    // Already have THIS milestone's totem cached? Skip.
    if (todayTotem && todayTotem.milestone === cm) return;
    if (generationStartedRef.current) return;

    let cancelled = false;
    generationStartedRef.current = true;

    (async () => {
      // Re-fetch first — maybe someone else already generated this milestone.
      const existing = await fetchTotemForMilestone(cm);
      if (cancelled) return;
      if (existing) {
        setTodayTotem(existing);
        generationStartedRef.current = false;
        return;
      }

      setTotemSummoning(true);
      try {
        const [imageUrl, caption] = await Promise.all([
          generate({ prompt: totemPrompt(today) }),
          chatSend(captionPrompt(today)).catch(() => 'a small thing carried by many'),
        ]);
        if (cancelled) return;
        const totem: TodayTotem = {
          date: today,
          imageUrl,
          caption: (caption || '').trim().toLowerCase().replace(/[.!?]+$/, ''),
          summonedBy: stats.total_user_count,
          milestone: cm,
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
  }, [stats, todayTotem, today, generate, chatSend, fetchTotemForMilestone, writeTotem]);

  // Look for the current milestone's totem on mount / stats arrival.
  useEffect(() => {
    if (!stats) return;
    const cm = currentMilestone(stats.total_user_count);
    if (cm < TOTEM_THRESHOLD) return;
    if (todayTotem && todayTotem.milestone === cm) return;
    let cancelled = false;
    (async () => {
      const existing = await fetchTotemForMilestone(cm);
      if (!cancelled && existing) setTodayTotem(existing);
    })();
    return () => { cancelled = true; };
  }, [stats, todayTotem, fetchTotemForMilestone]);

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

  // Build orbit avatar list. We fetch:
  //   1. The current user's own avatar + name (from the platform user
  //      info API) — this is the player's slot in the orbit.
  //   2. Recent users from get/data/list, **filtered to those whose
  //      latest save indicates they tapped today**, then per-user info
  //      lookups for each — so the orbit visualizes today's ritual
  //      circle, not the all-time community.
  // Real mode only; demo mode overrides this with mocks below.
  const [orbitUsers, setOrbitUsers] = useState<OrbitUser[]>([]);

  useEffect(() => {
    // Standalone fallback — when the game is opened directly on GitHub
    // Pages (not inside the Aigram iframe), the platform user-info API
    // isn't available, so we can't fetch a real name+avatar. Still seed
    // a generic "you" avatar so post-tap the player sees themselves
    // appear in the orbit. Replaced with the real user when available.
    if (!isInAigram || !telegramId || !sessionId) {
      setOrbitUsers([{
        id: 'you',
        name: 'You',
        initial: '?',
        isSelf: true,
      }]);
      return;
    }
    let cancelled = false;
    (async () => {
      const fetchUser = async (id: string): Promise<OrbitUser | null> => {
        try {
          const res = await callAigramAPI<AigramResponse<{
            telegram_id: string;
            name?: string;
            head_url?: string;
          }>>(
            `/note/telegram/user/get/info/by/telegram_id?telegram_id=${encodeURIComponent(id)}`,
            'GET',
          );
          if (!res?.data) return null;
          return {
            id: String(res.data.telegram_id || id),
            name: res.data.name,
            url: res.data.head_url,
            initial: (res.data.name || '?').slice(0, 1).toUpperCase(),
            isSelf: String(id) === String(telegramId),
          };
        } catch { return null; }
      };

      // Self first — instant feedback that "I'm in the orbit".
      const self = await fetchUser(String(telegramId));
      if (cancelled) return;
      if (self) setOrbitUsers([self]);

      // Then the rest of the recent community.
      try {
        const res = await callAigramAPI<AigramResponse<Array<{
          user_id: string;
          time?: string;
          resource_data?: string;
        }>>>(
          `/note/aigram/ai/game/get/data/list?session_id=${encodeURIComponent(sessionId)}`,
          'GET',
        );
        const rows = Array.isArray(res?.data) ? res.data : [];
        const otherIds: string[] = [];
        const seen = new Set<string>([String(telegramId)]);
        for (const row of rows) {
          if (!row.user_id || seen.has(String(row.user_id))) continue;
          // Only include users whose save indicates they tapped today.
          // Two acceptable save shapes:
          //   - LocalState:  { lastTapDay: "YYYY-MM-DD", ... }
          //   - TodayTotem:  { date: "YYYY-MM-DD", imageUrl, caption, ... }
          // (the totem writer is by definition someone who tapped today)
          if (!savedRowIsTappedToday(row.resource_data, today)) continue;
          seen.add(String(row.user_id));
          otherIds.push(String(row.user_id));
          if (otherIds.length >= 5) break;
        }
        const others = (await Promise.all(otherIds.map(fetchUser)))
          .filter((u): u is OrbitUser => u != null);
        if (!cancelled) {
          setOrbitUsers(self ? [self, ...others] : others);
        }
      } catch { /* network / bridge — keep just self */ }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

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
    lastTapDay: local.lastTapDay,
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
    // The player's own slot joins the orbit only after they've tapped
    // today — that way the post-tap moment carries a visible "you've
    // entered the ring" animation. Pre-tap the orbit only shows other
    // recent tappers.
    orbitUsers: tappedToday ? orbitUsers : orbitUsers.filter(u => !u.isSelf),
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
    summonedBy: 1900,
    milestone: 1900,
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
  // Mock past totems for the archive demo. Each is a real AI-generated
  // woodblock medallion matching the daily theme (plant / tool / fire /
  // water / star / creature) — see gen_demo_totem.py.
  const demoHistory: TodayTotem[] = [
    { date: '2026-05-20', imageUrl: '/one-tap-a-day/demo-totem-2.png',
      caption: 'the lotus that opened in the dark', summonedBy: 1800, milestone: 1800 },
    { date: '2026-05-19', imageUrl: '/one-tap-a-day/demo-totem-3.png',
      caption: 'the cup that held a small fire', summonedBy: 1700, milestone: 1700 },
    { date: '2026-05-18', imageUrl: '/one-tap-a-day/demo-totem-4.png',
      caption: 'a flame remembered its own ember', summonedBy: 1600, milestone: 1600 },
    { date: '2026-05-17', imageUrl: '/one-tap-a-day/demo-totem-5.png',
      caption: 'the wave that decided how to crest', summonedBy: 1500, milestone: 1500 },
    { date: '2026-05-16', imageUrl: '/one-tap-a-day/demo-totem-6.png',
      caption: 'the moon that lost its name', summonedBy: 1400, milestone: 1400 },
    { date: '2026-05-15', imageUrl: '/one-tap-a-day/demo-totem.png',
      caption: 'a creature half-real half-spirit', summonedBy: 1300, milestone: 1300 },
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
    case 'tombstone': {
      // Mock: last tap was 3 days ago (silent for 3 days). Compute against
      // `today` so the demo is stable regardless of when it's viewed.
      const t = new Date(`${today}T00:00:00Z`);
      t.setUTCDate(t.getUTCDate() - 3);
      const lastTap = t.toISOString().slice(0, 10);
      return {
        ...baseReturn,
        seenOnboarding: true,
        tappedToday: false,
        longestStreak: 23,
        lastTapDay: lastTap,
        streakBroken: true,
        showTombstone: true,
        orbitUsers: demoAvatars,
        totemHistory: demoHistory,
        stats: { ...demoStats, day_user_count: 12, total_user_count: 2200 },
      };
    }
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
