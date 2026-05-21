// Visual orbit of "today's tappers" — purely decorative.
//
// Count is driven by stats.day_user_count, but we cap rendered dots so the
// orbit never feels crowded. Beyond the cap, dots stay at the cap and we
// just visually pulse to show "more arriving".

import { useMemo } from 'react';

interface Props {
  count: number;     // day_user_count
  selfTapped: boolean;
}

const MAX_DOTS = 28;

export function Orbit({ count, selfTapped }: Props) {
  const dots = useMemo(() => {
    const n = Math.min(count, MAX_DOTS);
    const arr: { i: number; angle: number; r: number; delay: number; size: number }[] = [];
    for (let i = 0; i < n; i++) {
      // Stable pseudo-random per index — deterministic, no flicker on rerender.
      const seed = (i * 9301 + 49297) % 233280;
      const rand = seed / 233280;
      const angle = (i * 360) / n + rand * 24;
      const r = 130 + rand * 38;
      const delay = rand * 6;
      const size = 4 + rand * 4;
      arr.push({ i, angle, r, delay, size });
    }
    return arr;
  }, [count]);

  return (
    <div className="otd-orbit">
      {dots.map(d => (
        <span
          key={d.i}
          className={`otd-orbit__dot${selfTapped && d.i === dots.length - 1 ? ' otd-orbit__dot--self' : ''}`}
          style={{
            transform: `rotate(${d.angle}deg) translateY(-${d.r}px)`,
            animationDelay: `${d.delay}s`,
            width: `${d.size}px`,
            height: `${d.size}px`,
          }}
        />
      ))}
    </div>
  );
}
