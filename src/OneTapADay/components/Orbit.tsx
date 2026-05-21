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
const RING_RADIUS = 152;  // px from center
const NAME_RADIUS = 178;  // px from center (slightly outside avatar)

interface Slot {
  i: number;
  angle: number;          // radians (0 = right, -PI/2 = top)
  avatar?: OrbitAvatar;
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
        const nameX = Math.cos(s.angle) * NAME_RADIUS;
        const nameY = Math.sin(s.angle) * NAME_RADIUS;

        if (s.avatar) {
          const av = s.avatar;
          return (
            <div key={s.i}>
              <span
                className={`otd-orbit__avatar${av.isSelf ? ' otd-orbit__avatar--self' : ''}`}
                style={{ transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` }}
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
                  style={{ transform: `translate(${nameX}px, ${nameY}px) translate(-50%, -50%)` }}
                >
                  {av.name}
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
