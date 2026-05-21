// Orbit of avatars circling the tap altar. Each represents another player
// who tapped today. Avatars come from the platform's get/data/list (last 6
// users with saves for this session); in demo mode they're populated with
// mock data.
//
// If fewer than `count` avatars are known, the remaining ring slots fill
// with ochre glyph dots (the original decorative fallback) so the ring
// still scales with the total day_user_count.

import { useMemo } from 'react';

export interface OrbitAvatar {
  id: string;
  url?: string;          // image url; falls back to initial + colored bg
  initial?: string;
  isSelf?: boolean;
}

interface Props {
  avatars: OrbitAvatar[];   // known users (max ~6)
  count: number;            // total tapped today (drives extra fallback dots)
}

const MAX_DOTS = 22;

export function Orbit({ avatars, count }: Props) {
  const items = useMemo(() => {
    const total = Math.min(Math.max(avatars.length, count), MAX_DOTS);
    const known = avatars.slice(0, total);
    const arr: Array<{
      i: number;
      angle: number;
      r: number;
      delay: number;
      avatar?: OrbitAvatar;
    }> = [];
    for (let i = 0; i < total; i++) {
      const seed = (i * 9301 + 49297) % 233280;
      const rand = seed / 233280;
      const angle = (i * 360) / total + rand * 14;
      const r = 138 + rand * 32;
      const delay = rand * 6;
      arr.push({
        i,
        angle,
        r,
        delay,
        avatar: known[i],
      });
    }
    return arr;
  }, [avatars, count]);

  return (
    <div className="otd-orbit">
      {items.map(d => (
        <span
          key={d.i}
          className={`otd-orbit__slot${d.avatar?.isSelf ? ' otd-orbit__slot--self' : ''}${d.avatar ? ' otd-orbit__slot--avatar' : ' otd-orbit__slot--dot'}`}
          style={{
            transform: `rotate(${d.angle}deg) translateY(-${d.r}px) rotate(${-d.angle}deg)`,
            animationDelay: `${d.delay}s`,
          }}
        >
          {d.avatar?.url ? (
            <img src={d.avatar.url} alt="" draggable={false} />
          ) : d.avatar?.initial ? (
            <span className="otd-orbit__initial">{d.avatar.initial}</span>
          ) : null}
        </span>
      ))}
    </div>
  );
}
