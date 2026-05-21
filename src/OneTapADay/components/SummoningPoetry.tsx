// Cycles mystical lines under the totem-summoning spinner. ~5s per line,
// cross-fade. Lives only inside `TotemReveal`'s summoning branch.

import { useEffect, useState } from 'react';
import { poetryLines } from '../i18n';

const ROTATION_MS = 5000;
const FADE_MS = 600;

export function SummoningPoetry() {
  const lines = poetryLines();
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * lines.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const tick = () => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % lines.length);
        setVisible(true);
      }, FADE_MS);
    };
    const id = setInterval(tick, ROTATION_MS);
    return () => clearInterval(id);
  }, [lines.length]);

  return (
    <div className={`otd-poetry${visible ? '' : ' otd-poetry--out'}`}>
      {lines[idx]}
    </div>
  );
}
