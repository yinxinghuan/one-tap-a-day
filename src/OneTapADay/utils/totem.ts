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
    // Style: traditional two-color woodblock print, but the second color is
    // the AlterU brand pink (cochineal-ish dusty rose, hex #f5b1c7) instead
    // of the conventional cinnabar — keeps the folk-art language while
    // carrying the platform color thread.
    `Two-color woodblock print: deep ink black and soft dusty rose pink (cochineal, #f5b1c7) on cream paper. No red, no orange — the second color must be a soft warm pink.`,
    // Composition: circular tondo. The subject must curl/coil/arrange to
    // fill a perfect circle — the final image is masked to a circle in-app,
    // so anything pushed to the corners is lost.
    `CIRCULAR MEDALLION COMPOSITION (tondo) — the subject curls and arranges to fill a perfect circle, with the round shape fully occupied edge to edge.`,
    `Bold simplified silhouette, visible carving texture, folk-art / Japanese ukiyo-e feel.`,
    `Cream paper background, no rectangular frame, no text, no border.`,
    `Square 1:1 image; the artwork itself is the circular medallion.`,
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
