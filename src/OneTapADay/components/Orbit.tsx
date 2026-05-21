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

import { useMemo } from 'react';

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

const MAX_SLOTS = 60;     // hard cap — beyond this, the ring is just dense regardless
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

const NAME_MAX_CHARS = 8;
function truncate(name: string): string {
  if (name.length <= NAME_MAX_CHARS) return name;
  return name.slice(0, NAME_MAX_CHARS - 1) + '…';
}

export function Orbit({ avatars, count }: Props) {
  const slots = useMemo<Slot[]>(() => {
    const total = Math.max(avatars.length, Math.min(count, MAX_SLOTS));
    if (total === 0) return [];
    const known = avatars.slice(0, Math.min(avatars.length, total));
    const k = known.length;

    // Spread known avatars evenly across the ring.
    // E.g. total=47, k=6 → avatars at slot indices 0, 7, 14, 21, 28, 35.
    const step = k > 0 ? Math.floor(total / k) : 0;
    const out: Slot[] = [];
    for (let i = 0; i < total; i++) {
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2; // start at top
      const avatarIdx = step > 0 && i % step === 0 && i / step < k
        ? Math.floor(i / step)
        : -1;
      out.push({
        i,
        angle,
        avatar: avatarIdx >= 0 ? known[avatarIdx] : undefined,
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
          // The extra translate(-x, -50%) compensates for the box-size
          // offset between the anchor (element-local) and the translated
          // position (stage-coord), so the inner edge sits exactly at the
          // anchor point rather than h/2 below it.
          const nameOrigin = flipped ? '100% 50%' : '0% 50%';
          const nameAlign = flipped ? 'translate(-100%, -50%)' : 'translate(0, -50%)';

          return (
            <div key={s.i}>
              <span
                className={`otd-orbit__avatar${av.isSelf ? ' otd-orbit__avatar--self' : ''}`}
                style={{
                  transform:
                    `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rotDeg}deg)`,
                }}
              >
                {av.url ? (
                  <img src={av.url} alt="" draggable={false} />
                ) : (
                  <span className="otd-orbit__initial">{av.initial}</span>
                )}
              </span>
              {av.name && (
                <span
                  className={`otd-orbit__name${av.isSelf ? ' otd-orbit__name--self' : ''}`}
                  style={{
                    transform: `translate(${nameX}px, ${nameY}px) ${nameAlign} rotate(${rotDeg}deg)`,
                    transformOrigin: nameOrigin,
                  }}
                >
                  {truncate(av.name)}
                </span>
              )}
            </div>
          );
        }

        return (
          <span
            key={s.i}
            className="otd-orbit__dot"
            style={{ transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` }}
          />
        );
      })}
    </div>
  );
}
