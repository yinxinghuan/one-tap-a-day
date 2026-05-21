#!/usr/bin/env python3
"""
Generate a placeholder demo totem image — a stylized brain-coral roundel
in AlterU pink, built from the existing turing.png. Used by the in-app
demo mode so the totem reveal modal has something to display before we
wire up real gen-image production.

Run:
  ~/miniconda3/bin/python3 gen_demo_totem.py
"""

import os
import numpy as np
from PIL import Image


def main():
    here = os.path.dirname(__file__)
    src = Image.open(os.path.join(here, "public/turing.png")).convert("L")
    src = src.resize((640, 640), Image.LANCZOS)
    pattern = np.array(src, dtype=np.float32) / 255.0

    # Circular vignette — strong in the center, fades to black past r=260.
    N = 640
    y, x = np.ogrid[:N, :N]
    r = np.sqrt((x - N / 2) ** 2 + (y - N / 2) ** 2)
    vignette = np.clip(1.15 - r / 250.0, 0.0, 1.0)
    intensity = pattern * vignette

    # Tint into AlterU pink (#f5b1c7) on a near-black background, with a
    # warm bone hint for the brightest peaks.
    rgb = np.zeros((N, N, 3), dtype=np.uint8)
    rgb[..., 0] = (np.clip(intensity * 1.05, 0, 1) * 245).astype(np.uint8)
    rgb[..., 1] = (np.clip(intensity * 1.05, 0, 1) * 177).astype(np.uint8)
    rgb[..., 2] = (np.clip(intensity * 1.05, 0, 1) * 199).astype(np.uint8)

    # Add a soft inner glow — a radial gradient that lifts the center mass.
    glow = np.clip(1.4 - r / 140.0, 0.0, 1.0) ** 1.6
    rgb[..., 0] = np.clip(rgb[..., 0].astype(np.float32) + glow * 30, 0, 255).astype(np.uint8)
    rgb[..., 1] = np.clip(rgb[..., 1].astype(np.float32) + glow * 18, 0, 255).astype(np.uint8)
    rgb[..., 2] = np.clip(rgb[..., 2].astype(np.float32) + glow * 22, 0, 255).astype(np.uint8)

    out = os.path.join(here, "public/demo-totem.png")
    Image.fromarray(rgb).save(out, optimize=True)
    print(f"saved {out}  ({os.path.getsize(out) // 1024} KB)")


if __name__ == "__main__":
    main()
