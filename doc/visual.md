# Visual Bible — One Tap a Day

## 1. Visual thesis

- Game and audience: a quiet daily social ritual for mobile players.
- Emotional promise: one decisive press becomes a shared, slowly revealed omen.
- One-sentence visual thesis: tactile brass, aged cream paper and dusty-pink woodblock ink turn a tiny daily action into a communal relic.
- Signature visual moment: the circular generated totem resolves above the global milestone count.
- Three required qualities: ceremonial, tactile, restrained.
- Three directions to avoid: glossy casino UI, neon sci-fi, generic AI-fantasy illustration.

## 2. Composition and camera

- Orientation and aspect ratios: portrait-first at 390×844 and 320×568; the generated asset is square.
- Camera and perspective: flat DOM composition with object-like depth from restrained shadows.
- Playfield focal area: the central brass button before tapping, then the circular totem reveal.
- Foreground, midground, background: controls and status; ritual object; cream-paper field.
- HUD safe areas: title and count remain clear of mobile safe-area insets.
- Attention path: daily action → global progress → revealed image and oracle line.

## 3. Color

- Background, surfaces, text, and muted text: warm cream, aged paper, near-black ink and warm gray.
- Player/subject, action, reward, danger, success: brass for the action; dusty rose #f5b1c7 for AlterU recognition and generated print accents.
- Usage ratios: roughly 70% cream, 20% ink/neutral, 10% brass and pink accents.
- Forbidden combinations: saturated red-orange, rainbow gradients and high-energy neon.

## 4. Typography

- Display, UI/body, numeric/HUD, CJK fallback: editorial serif display, compact readable UI sans, tabular numerals, system CJK fallback.
- Size, weight, case, tracking, and outline rules: short uppercase labels may use tracked caps; body copy stays sentence case with no text outlines.

## 5. Shape, material, and lighting

- Dominant shapes and corner language: circles, medallions and softened rectangular archive cards.
- Outline, border, and shadow rules: thin ink rules and shallow warm shadows; no heavy glassmorphism.
- Materials and textures: aged paper, worn brass and visible woodblock carving grain.
- Light direction and atmosphere: soft overhead museum-like light.

## 6. Characters, environments, and assets

- Proportions and silhouettes: no character art; the generated subject must fill a circular medallion silhouette.
- Expression and pose range: not applicable.
- Perspective, scale, detail density, edge treatment: bold simplified centered emblem with legible carving marks at phone size.
- Export size, format, alpha, and cropping rules: AlterU media service text mode, 512×512; cream background, no text, border or rectangular frame.

## 7. UI and icons

- Icon family and sizing: coherent line SVG icons only.
- Button hierarchy and targets: one dominant 44px-or-larger daily action; archive actions remain secondary.
- HUD and panel treatment: information is embedded into the paper composition instead of floating dashboard chrome.
- Default, pressed, focus, disabled, loading, warning, success states: each state must remain readable through color, copy and motion together.
- Emoji policy: never use emoji as functional UI icons.

## 8. Motion and VFX

- Motion personality and duration tokens: slow ceremonial easing for summoning; faster tactile compression for the press.
- Hit/reward timing: button response is immediate; generation progress continues asynchronously.
- Particle shape, palette, density, and lifetime: sparse paper dust or ink flecks only.
- Screen shake/freeze limits: no full-screen shake.
- Reduced-motion behavior: remove orbiting and drifting while preserving state changes.

## 9. References translated into principles

- Reference: traditional two-color woodblock prints and devotional medallions.
- Useful principle: a strict limited palette makes each generated image feel like part of one collection.
- Adaptation: conventional cinnabar is replaced by AlterU dusty rose.
- Element not to copy: religious symbols or identifiable historical works.

## 10. Anti-patterns

- Forbidden icon/asset styles: emoji controls, mixed icon families and photorealistic stock decoration.
- Forbidden effects and color behavior: neon bloom, chrome gradients and multicolor generated imagery.
- Generic patterns to avoid: generic AI tarot cards, dashboard stat tiles and modal-heavy flows.
- Examples of visual drift: square framed art that is clipped by the circular mask, legible text inside generated images, orange-red replacing dusty rose.

## 11. Vertical-slice acceptance

- Entry/start: the daily action is unmistakable within one glance.
- Gameplay: the press responds before network work begins.
- High-feedback moment: summoning progress and milestone ownership are clear.
- Completion/end: the revealed totem remains circular, coherent and readable.
- Narrow mobile: no horizontal overflow at 320×568; action target stays at least 44×44.
- Visual QA findings and decision: real 512×512 task `mt_e7feb3885b8bc2c181e871ed4aaad347` passed—cream ground, black/dusty-rose two-color print, full circular occupancy and no text; retain the established UI.
