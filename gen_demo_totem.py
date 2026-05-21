#!/usr/bin/env python3
"""
Generate placeholder totem images from the Gray-Scott brain-coral texture.

Produces:
  public/loading-totem.png      purple brain-coral disc — sits as faded
                                backdrop behind the totem-summoning spinner
  public/demo-totem.png         pink disc — the placeholder shown in
                                ?demo=totem state and on the archive wall
  public/demo-totem-2..6.png    extra variants (different rotations + tints)
                                so the archive demo wall has multiple cells

Run:
  ~/miniconda3/bin/python3 gen_demo_totem.py
"""

import os
import numpy as np
from PIL import Image


def coral_disc(pattern: np.ndarray, tint: tuple[int, int, int],
               glow: tuple[float, float, float] = (30, 18, 22),
               vignette_r: float = 250.0) -> Image.Image:
    """Build an RGB disc with the pattern tinted into a single hue, vignetted."""
    N = pattern.shape[0]
    y, x = np.ogrid[:N, :N]
    r = np.sqrt((x - N / 2) ** 2 + (y - N / 2) ** 2)
    vignette = np.clip(1.15 - r / vignette_r, 0.0, 1.0)
    intensity = np.clip(pattern * vignette * 1.05, 0.0, 1.0)

    rgb = np.zeros((N, N, 3), dtype=np.uint8)
    rgb[..., 0] = (intensity * tint[0]).astype(np.uint8)
    rgb[..., 1] = (intensity * tint[1]).astype(np.uint8)
    rgb[..., 2] = (intensity * tint[2]).astype(np.uint8)

    inner_glow = np.clip(1.4 - r / 140.0, 0.0, 1.0) ** 1.6
    rgb[..., 0] = np.clip(rgb[..., 0].astype(np.float32) + inner_glow * glow[0], 0, 255).astype(np.uint8)
    rgb[..., 1] = np.clip(rgb[..., 1].astype(np.float32) + inner_glow * glow[1], 0, 255).astype(np.uint8)
    rgb[..., 2] = np.clip(rgb[..., 2].astype(np.float32) + inner_glow * glow[2], 0, 255).astype(np.uint8)

    return Image.fromarray(rgb)


def main():
    here = os.path.dirname(__file__)
    src = Image.open(os.path.join(here, "public/turing.png")).convert("L")
    src = src.resize((640, 640), Image.LANCZOS)
    pattern = np.array(src, dtype=np.float32) / 255.0

    # Loading screen — deep purple, the "totem in progress" hue.
    coral_disc(pattern, tint=(145, 95, 200), glow=(40, 22, 60))\
        .save(os.path.join(here, "public/loading-totem.png"), optimize=True)

    # Default placeholder — pink (current).
    coral_disc(pattern, tint=(245, 177, 199), glow=(30, 18, 22))\
        .save(os.path.join(here, "public/demo-totem.png"), optimize=True)

    # Archive demo wall — variants by rotation + tint.
    tints = [
        (208, 156, 90),   # ochre
        (140, 180, 150),  # jade
        (200, 110, 130),  # rose
        (170, 130, 200),  # violet
        (220, 200, 130),  # gold
    ]
    for i, t in enumerate(tints, 2):
        # Rotate the pattern by 30 * i degrees for visual variety, then crop.
        rot = Image.fromarray((pattern * 255).astype(np.uint8))\
            .rotate(30 * i, resample=Image.BICUBIC, fillcolor=0)
        rot_arr = np.array(rot, dtype=np.float32) / 255.0
        coral_disc(rot_arr, tint=t, glow=(28, 18, 22))\
            .save(os.path.join(here, f"public/demo-totem-{i}.png"), optimize=True)

    print("totem variants saved.")


if __name__ == "__main__":
    main()
