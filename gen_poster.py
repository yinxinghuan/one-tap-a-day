#!/usr/bin/env python3
"""
Compose the One Tap a Day launch poster — 1024×1024 PNG suitable for
the Aigram games list. Uses the AI-generated woodblock totem as the
hero artwork.

Layout:
  - Deep obsidian background with a faint cream Turing-pattern patina
  - Soft pink radial halo behind the totem
  - The 640px totem scaled up to ~700px, centered
  - "ONE TAP A DAY" in Trajan Pro above
  - "AlterU" small mark below

Run:
  ~/miniconda3/bin/python3 gen_poster.py
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1024, 1024
HERE = os.path.dirname(__file__)
PUBLIC = os.path.join(HERE, "public")
OUTPUT_PATH = "/Users/yin/code/games/games/posters/one-tap-a-day.png"

# Colors
BG = (10, 9, 7)            # obsidian
PINK = (245, 177, 199)     # AlterU pink
CREAM = (243, 237, 225)
CREAM_DIM = (200, 191, 170)

TRAJAN_BOLD = "/Library/Fonts/TrajanPro3-Bold.otf"
TRAJAN = "/Library/Fonts/TrajanPro3-Regular.otf"


def add_radial_halo(img: Image.Image, center=(W // 2, H // 2 + 30), r=600,
                    color=PINK, peak_alpha=42) -> Image.Image:
    """Soft pink radial glow behind the totem."""
    halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(halo)
    # Build a series of expanding circles with fading alpha.
    for i in range(r, 0, -16):
        alpha = int(peak_alpha * (1 - i / r) ** 1.6)
        draw.ellipse(
            (center[0] - i, center[1] - i, center[0] + i, center[1] + i),
            fill=(*color, alpha),
        )
    halo = halo.filter(ImageFilter.GaussianBlur(40))
    return Image.alpha_composite(img.convert("RGBA"), halo)


def add_turing_patina(img: Image.Image, opacity: int = 30) -> Image.Image:
    """Tile the brain-coral Turing pattern faintly across the bg."""
    turing = Image.open(os.path.join(PUBLIC, "turing.png")).convert("L")
    turing = turing.resize((256, 256), Image.LANCZOS)
    # Tile to fill canvas
    tiled = Image.new("L", (W, H), 0)
    for y in range(0, H, 256):
        for x in range(0, W, 256):
            tiled.paste(turing, (x, y))
    # Use luminance as alpha for cream tint
    layer = Image.new("RGBA", (W, H), (*CREAM, 0))
    layer.putalpha(tiled.point(lambda v: int(v * opacity / 255)))
    # Radial vignette so corners stay clean
    vignette = Image.new("L", (W, H), 0)
    vdraw = ImageDraw.Draw(vignette)
    for i in range(700, 0, -20):
        a = int(255 * (1 - (700 - i) / 700) ** 1.2)
        vdraw.ellipse(
            (W // 2 - i, H // 2 - i, W // 2 + i, H // 2 + i),
            fill=a,
        )
    vignette = vignette.filter(ImageFilter.GaussianBlur(60))
    layer.putalpha(
        Image.eval(layer.getchannel("A"), lambda v: v).point(
            lambda v: int(v * 1)
        )
    )
    layer.putalpha(
        Image.eval(layer.getchannel("A"), lambda v: v)
    )
    # Combine alpha with vignette
    a = layer.getchannel("A")
    new_a = Image.eval(a, lambda v: v).point(lambda v: v)
    new_a = Image.eval(
        Image.merge("L", [new_a]), lambda v: v
    )
    # Simpler: just multiply existing alpha by vignette
    final_a = Image.new("L", (W, H), 0)
    for i in range(W):
        pass  # too slow; use ImageChops instead
    from PIL import ImageChops
    final_a = ImageChops.multiply(layer.getchannel("A"), vignette)
    layer.putalpha(final_a)
    return Image.alpha_composite(img.convert("RGBA"), layer)


def main():
    # 1. Base canvas
    canvas = Image.new("RGB", (W, H), BG)

    # 2. Turing patina
    canvas = add_turing_patina(canvas, opacity=18)

    # 3. Pink halo behind totem
    canvas = add_radial_halo(canvas)

    # 4. Paste the totem (centered, slightly above middle so there's room
    #    for the title above and the brand below)
    totem = Image.open(os.path.join(PUBLIC, "demo-totem.png")).convert("RGBA")
    totem = totem.resize((720, 720), Image.LANCZOS)
    # Soft outer drop shadow
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse(
        (W // 2 - 360, H // 2 - 360 + 40, W // 2 + 360, H // 2 + 360 + 40),
        fill=(0, 0, 0, 110),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(40))
    canvas = Image.alpha_composite(canvas, shadow)
    canvas.paste(totem, ((W - 720) // 2, (H - 720) // 2 + 30), totem)

    # 5. Title — "ONE TAP A DAY" in Trajan Pro Bold, generous letter-spacing
    title_font = ImageFont.truetype(TRAJAN_BOLD, 70)
    title_text = "ONE  TAP  A  DAY"
    # Manual letter-spacing: render char by char
    draw = ImageDraw.Draw(canvas)
    chars = list(title_text)
    spacing = 6  # extra px between chars
    widths = [draw.textlength(c, font=title_font) for c in chars]
    total = sum(widths) + spacing * (len(chars) - 1)
    cx = (W - total) // 2
    cy = 70
    for i, c in enumerate(chars):
        # Subtle dark shadow for legibility on the patina
        draw.text((cx + 2, cy + 3), c, font=title_font, fill=(0, 0, 0, 200))
        draw.text((cx, cy), c, font=title_font, fill=CREAM)
        cx += widths[i] + spacing

    # 6. Subtitle — "a daily ritual" italic-like in Trajan regular
    sub_font = ImageFont.truetype(TRAJAN, 28)
    sub_text = "a daily ritual"
    sw = draw.textlength(sub_text, font=sub_font)
    draw.text(((W - sw) // 2, 160), sub_text, font=sub_font, fill=CREAM_DIM)

    # 7. Brand mark below — "ALTERU" tiny pink
    brand_font = ImageFont.truetype(TRAJAN_BOLD, 26)
    brand_text = "A  L  T  E  R    U"
    bw = draw.textlength(brand_text, font=brand_font)
    by = H - 100
    draw.text(((W - bw) // 2, by), brand_text, font=brand_font, fill=PINK)

    # 8. Save
    out = canvas.convert("RGB")
    out.save(OUTPUT_PATH, optimize=True)
    print(f"saved {OUTPUT_PATH} ({os.path.getsize(OUTPUT_PATH) // 1024} KB)")


if __name__ == "__main__":
    main()
