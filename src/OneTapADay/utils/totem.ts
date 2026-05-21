// Today's-totem generation logic.
//
// Theme rotates by UTC day-of-week so prompts feel varied but predictable
// across a week.

const DAY_THEMES: { word: string; tone: string }[] = [
  { word: 'creature',  tone: 'mythical animal, half-real half-spirit' },
  { word: 'plant',     tone: 'sacred herb, single leaf or bloom' },
  { word: 'tool',      tone: 'ritual implement, archaic and worn' },
  { word: 'symbol',    tone: 'geometric sigil, hand-drawn lines' },
  { word: 'fire',      tone: 'flame shape, ember, controlled burn' },
  { word: 'water',     tone: 'wave, tear, single droplet' },
  { word: 'star',      tone: 'celestial body, lone star or moon' },
];

export function themeForDay(dayString: string): { word: string; tone: string } {
  // Stable hash of YYYY-MM-DD → 0..6
  let h = 0;
  for (let i = 0; i < dayString.length; i++) h = (h * 31 + dayString.charCodeAt(i)) | 0;
  const idx = ((h % DAY_THEMES.length) + DAY_THEMES.length) % DAY_THEMES.length;
  return DAY_THEMES[idx];
}

export function totemPrompt(dayString: string): string {
  const { word, tone } = themeForDay(dayString);
  return [
    `A symbolic ritual emblem of a ${word} — ${tone}.`,
    `Ink and watercolor on aged parchment, soft glow, candle light, mystic ambient.`,
    `Single object centered, minimal palette, muted earth tones, no text, no border.`,
    `Square 1:1 composition.`,
  ].join(' ');
}

export const TOTEM_CAPTION_SYSTEM =
  "You are an ambiguous oracle voice. You answer with ONE line, all lowercase, " +
  "no quotes, no punctuation at the end, max 10 words, melancholic but warm. " +
  "Examples: 'the moth that forgot where it was going', 'a small fire kept by " +
  "someone who isn't watching', 'the stone you didn't pick up'.";

export function captionPrompt(dayString: string): string {
  const { word } = themeForDay(dayString);
  return `Today's totem is a ${word}. Give the one-line oracle for it.`;
}
