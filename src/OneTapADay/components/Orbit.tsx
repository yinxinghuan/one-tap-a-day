// Orbit ring around the tap altar.
//
// Layout: a single perfectly-circular ring at radius R. Every "tapper today"
// gets one slot, evenly distributed by angle. Known users render as an
// avatar circle with the user's name written radially outside; the rest
// fall back to small ochre glyph dots. As the day's count grows the ring
// gets denser and slots naturally start to overlap.
//
// Avatar slot positions are spread evenly across the ring rather than
// clustered at the start, so the ~6 known faces are visible "around" the
// circle of community rather than all on one side.

import { useMemo, useCallback, useState } from 'react';
import { openAigramProfile } from '../../shared/runtime';

export interface OrbitAvatar {
  id: string;
  name?: string;
  url?: string;
  initial?: string;
  isSelf?: boolean;
}

interface Props {
  avatars: OrbitAvatar[];
  count: number;
}

// Hard cap — past 50 the ring already looks fully crowded; additional
// participants are reflected in the count text below the altar instead of
// being squeezed into more ring slots.
const MAX_SLOTS = 50;
const RING_RADIUS = 148;  // px from center to avatar center
const AVATAR_HALF = 16;   // half the avatar size (so outer edge = RING + AVATAR_HALF)
const NAME_GAP = 8;       // gap from avatar's outer edge to name's inner edge
// Anchor for the name's inner edge — kept constant so every name has the
// same distance from its avatar, regardless of name length.
const NAME_ANCHOR_R = RING_RADIUS + AVATAR_HALF + NAME_GAP;

interface Slot {
  i: number;
  angle: number;          // radians (0 = right, -PI/2 = top)
  avatar?: OrbitAvatar;
}

// Display the user's first word at most NAME_MAX_CHARS characters; if it
// overflows, add an ellipsis. Telegram-style usernames range from short
// nicknames to full "First Last" strings — the first-word + cap rule keeps
// the orbit legible without truncating short names.
const NAME_MAX_CHARS = 10;
function truncate(name: string): string {
  const firstWord = name.split(/\s+/)[0] || name;
  if (firstWord.length <= NAME_MAX_CHARS) return firstWord;
  return firstWord.slice(0, NAME_MAX_CHARS - 1) + '…';
}

export function Orbit({ avatars, count }: Props) {
  // On-screen tap debug toast — confirms the tap landed in JS even
  // when console isn't available (e.g. Aigram iOS WKWebView).
  const [debug, setDebug] = useState<string | null>(null);

  // Tap on an avatar/name jumps to that user's Aigram profile. No-ops
  // outside Aigram (e.g. standalone demos) because openAigramProfile
  // returns early when api_origin is not set.
  const openProfile = useCallback((id: string, name: string | undefined, source: 'avatar' | 'name') => {
    const label = `${source}: ${name || id}`;
    setDebug(label);
    window.setTimeout(() => setDebug(null), 1800);
    // eslint-disable-next-line no-console
    console.log(`[otd] open profile ${id} via ${source}`);
    openAigramProfile(id);
  }, []);

  const slots = useMemo<Slot[]>(() => {
    // Cap both arms at MAX_SLOTS so the ring never holds more than that
    // many positions even if `avatars` or `count` go higher.
    const known = avatars.slice(0, MAX_SLOTS);
    const total = Math.max(known.length, Math.min(count, MAX_SLOTS));
    if (total === 0) return [];
    const k = known.length;

    // Spread known avatars evenly across the ring by mapping each known
    // index j → slot floor(j * total / k). This is the only distribution
    // that stays balanced when k is close to total (e.g. k=36, total=40):
    // the old `step = floor(total/k)` collapsed to step=1 in that range
    // and clustered every avatar at slots 0..k-1, leaving an obvious
    // empty arc. With floor(j*total/k), positions are interleaved across
    // the full ring regardless of the k:total ratio.
    const slotToAvatar = new Map<number, OrbitAvatar>();
    for (let j = 0; j < k; j++) {
      const slotIdx = Math.floor((j * total) / k);
      slotToAvatar.set(slotIdx, known[j]);
    }

    const out: Slot[] = [];
    for (let i = 0; i < total; i++) {
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2; // start at top
      out.push({
        i,
        angle,
        avatar: slotToAvatar.get(i),
      });
    }
    return out;
  }, [avatars, count]);

  return (
    <div className="otd-orbit">
      {slots.map(s => {
        const x = Math.cos(s.angle) * RING_RADIUS;
        const y = Math.sin(s.angle) * RING_RADIUS;
        // Name anchor is the point at the avatar's outer edge + gap. The
        // name's transform-origin is set so this point is the *inner* edge
        // of the text — keeping the gap visually constant.
        const nameX = Math.cos(s.angle) * NAME_ANCHOR_R;
        const nameY = Math.sin(s.angle) * NAME_ANCHOR_R;

        if (s.avatar) {
          const av = s.avatar;
          // Both avatar and name rotate together along the radial direction.
          // For the left half of the ring (cos < 0) we flip an extra 180°
          // so contents stay right-side-up.
          const flipped = Math.cos(s.angle) < 0;
          const rotDeg = (s.angle * 180) / Math.PI + (flipped ? 180 : 0);
          // transform-origin pins the name's *inner edge* to the anchor
          // point so the avatar-to-name gap stays constant for every slot.
          const nameOrigin = flipped ? '100% 50%' : '0% 50%';
          const nameAlign = flipped ? 'translate(-100%, -50%)' : 'translate(0, -50%)';

          // Key by the avatar's ID so React keeps the same DOM element
          // across reflows — when new users tap and angles recalculate,
          // the existing avatars just have their inline transform updated
          // and the CSS transition glides them to their new slot.
          //
          // Avatar = transparent <button> wrapper (52×52 hit target) with
          // the inner 32×32 visual circle. The button gets the radial
          // positioning + click handler; the inner circle stays purely
          // visual (overflow: hidden for the cropped image).
          return (
            <div key={`avatar-${av.id}`}>
              <button
                type="button"
                className="otd-orbit__hit"
                style={{
                  transform: `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rotDeg}deg)`,
                }}
                aria-label={av.name ? `Open ${av.name}'s profile` : 'Open profile'}
                onPointerDown={() => openProfile(av.id, av.name, 'avatar')}
              >
                <span
                  className={`otd-orbit__avatar${av.isSelf ? ' otd-orbit__avatar--self' : ''}`}
                  aria-hidden
                >
                  {av.url ? (
                    <img src={av.url} alt="" draggable={false} />
                  ) : (
                    <span className="otd-orbit__initial">{av.initial}</span>
                  )}
                </span>
              </button>
              {av.name && (
                <button
                  type="button"
                  className={`otd-orbit__name${av.isSelf ? ' otd-orbit__name--self' : ''}`}
                  style={{
                    transform: `translate(${nameX}px, ${nameY}px) ${nameAlign} rotate(${rotDeg}deg)`,
                    transformOrigin: nameOrigin,
                  }}
                  aria-label={`Open ${av.name}'s profile`}
                  onPointerDown={() => openProfile(av.id, av.name, 'name')}
                >
                  {truncate(av.name)}
                </button>
              )}
            </div>
          );
        }

        return (
          <span
            key={`dot-${s.i}`}
            className="otd-orbit__dot"
            style={{ transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` }}
          />
        );
      })}
      {debug && (
        <div className="otd-orbit__debug" role="status">
          tapped: {debug}
        </div>
      )}
    </div>
  );
}
