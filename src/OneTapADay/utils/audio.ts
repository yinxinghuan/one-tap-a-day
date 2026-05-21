// WebAudio for One Tap a Day.
//
// Aesthetic: distant glass wind chime at dawn, not temple gong.
//   - Ambient: sparse high-frequency pentatonic pings (~C6-A6) with long
//     fades, plus a faint breath of filtered noise. Mostly silent.
//   - Tap: light glass touch — short, bright, ~1s decay.
//
// Init only on first pointerdown (Aigram preloads games; mount-time audio
// leaks into the previous game). startAmbient() is idempotent.

let ctx: AudioContext | null = null;
let ambientStarted = false;
let ambientStopRequested = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      const C = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    } catch {
      return null;
    }
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// ---------- Tap: light glass touch ----------

export function playTap(): void {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;

  // Glass-rim partials — bright, short, slight inharmonic shimmer.
  const partials: Array<[number, number, number]> = [
    [330, 1.0, 1.2],      // fundamental
    [330 * 2.76, 0.5, 0.9], // glass overtone
    [330 * 5.4, 0.2, 0.5],  // sparkle
  ];

  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.32, now + 0.008);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
  master.connect(ac.destination);

  partials.forEach(([freq, gain, dur]) => {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g).connect(master);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  });
}

// ---------- Ambient: sparse glass chime ----------

// C major pentatonic, octaves 5-6 — high enough to feel like distant
// wind chimes, low enough to remain soft.
const PENTATONIC_HZ = [
  523.25, 587.33, 659.25, 783.99, 880.00,    // C5 D5 E5 G5 A5
  1046.50, 1174.66, 1318.51, 1567.98, 1760.00, // C6 D6 E6 G6 A6
];

function playChime(ac: AudioContext, peakGain: number): void {
  const now = ac.currentTime;
  const freq = PENTATONIC_HZ[Math.floor(Math.random() * PENTATONIC_HZ.length)];
  const dur = rand(4.5, 6.5);

  // Two partials: fundamental + soft octave for body.
  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(peakGain, now + 0.4);
  master.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  master.connect(ac.destination);

  const o1 = ac.createOscillator();
  o1.type = 'sine';
  o1.frequency.value = freq;
  const g1 = ac.createGain();
  g1.gain.value = 1.0;
  o1.connect(g1).connect(master);
  o1.start(now);
  o1.stop(now + dur + 0.1);

  const o2 = ac.createOscillator();
  o2.type = 'sine';
  o2.frequency.value = freq * 2.0;
  const g2 = ac.createGain();
  g2.gain.value = 0.18;
  o2.connect(g2).connect(master);
  o2.start(now);
  o2.stop(now + dur + 0.1);
}

// A very faint highpassed pink-noise breath under the chimes — like air
// in a quiet room. Most listeners won't consciously notice it, but it
// thickens the silence.
function makeBreath(ac: AudioContext): { gain: GainNode; stop: () => void } {
  // Pink-ish noise via filtered white noise.
  const bufSize = 2 * ac.sampleRate;
  const buffer = ac.createBuffer(1, bufSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufSize; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.02 * white) / 1.02;
    data[i] = lastOut * 3.5;
  }
  const noise = ac.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 800;
  hp.Q.value = 0.5;

  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 3200;
  lp.Q.value = 0.5;

  const gain = ac.createGain();
  gain.gain.value = 0;

  noise.connect(hp).connect(lp).connect(gain).connect(ac.destination);
  noise.start();

  return {
    gain,
    stop: () => {
      try { noise.stop(); } catch { /* already stopped */ }
    },
  };
}

async function ambientLoop(ac: AudioContext): Promise<void> {
  const breath = makeBreath(ac);

  // Slow breath-amplitude envelope, looped independently.
  let breathRunning = true;
  (async () => {
    while (breathRunning && !ambientStopRequested) {
      const rise = rand(3.5, 5);
      const hold = rand(2, 4);
      const fall = rand(3.5, 5);
      const silence = rand(2, 5);
      const peak = rand(0.012, 0.022);

      const start = ac.currentTime;
      breath.gain.gain.cancelScheduledValues(start);
      breath.gain.gain.setValueAtTime(0.0001, start);
      breath.gain.gain.exponentialRampToValueAtTime(peak, start + rise);
      breath.gain.gain.setValueAtTime(peak, start + rise + hold);
      breath.gain.gain.exponentialRampToValueAtTime(0.0001, start + rise + hold + fall);
      await new Promise<void>(r => setTimeout(r, (rise + hold + fall + silence) * 1000));
    }
  })();

  // Glass chime scheduler — sparse, pentatonic.
  while (!ambientStopRequested) {
    const gap = rand(8, 15);
    await new Promise<void>(r => setTimeout(r, gap * 1000));
    if (ambientStopRequested) break;
    playChime(ac, rand(0.045, 0.075));
  }

  breathRunning = false;
  breath.stop();
}

export function startAmbient(): void {
  if (ambientStarted) return;
  const ac = getCtx();
  if (!ac) return;
  ambientStarted = true;
  ambientStopRequested = false;

  // Small grace period before the first chime so it lands shortly after
  // the user's first tap rather than immediately.
  setTimeout(() => {
    if (!ambientStopRequested) playChime(ac, 0.05);
  }, 2400);

  ambientLoop(ac);
}

export function stopAmbient(): void {
  ambientStopRequested = true;
  ambientStarted = false;
}

// Soft, brighter reveal chord for the totem reveal — a stack of high
// glass notes, not the previous low organ. Stays consistent with the
// "distant wind chime" aesthetic.
export function playRevealChord(): void {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;

  // Stacked pentatonic intervals high in the register.
  const notes = [659.25, 880.00, 1318.51, 1760.00]; // E5 A5 E6 A6

  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.09, now + 1.8);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);
  master.connect(ac.destination);

  notes.forEach((freq, i) => {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    const g = ac.createGain();
    g.gain.value = 1 - i * 0.18;
    o.connect(g).connect(master);
    o.start(now + i * 0.15);
    o.stop(now + 5.7);
  });
}
