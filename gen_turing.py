#!/usr/bin/env python3
"""
Generate Gray-Scott reaction-diffusion patterns for One Tap a Day.

Pearson canonical parameters (dA=0.16, dB=0.08, dt=1.0) — CFL-stable on a
unit grid. Periodic boundaries (np.roll) so output tiles seamlessly.

Generates several parameter variants so we can visually pick the labyrinth/
brain-coral pattern that matches the reference images.

Run:
  ~/miniconda3/bin/python3 gen_turing.py
"""

import os
import numpy as np
from PIL import Image


def gray_scott(N=512, F=0.039, k=0.058, dA=0.16, dB=0.08, steps=20000, seed=42):
    rng = np.random.default_rng(seed)
    A = np.ones((N, N), dtype=np.float32)
    B = np.zeros((N, N), dtype=np.float32)

    # Seed with random rectangular blobs of B (breaks symmetry, lets pattern emerge)
    for _ in range(80):
        cx, cy = rng.integers(0, N, size=2)
        sz = rng.integers(3, 9)
        xs = (np.arange(-sz, sz) + cx) % N
        ys = (np.arange(-sz, sz) + cy) % N
        A[np.ix_(ys, xs)] = 0.5
        B[np.ix_(ys, xs)] = 0.25

    B += 0.01 * rng.standard_normal((N, N)).astype(np.float32)

    for step in range(steps):
        LA = (np.roll(A, 1, 0) + np.roll(A, -1, 0)
              + np.roll(A, 1, 1) + np.roll(A, -1, 1) - 4.0 * A)
        LB = (np.roll(B, 1, 0) + np.roll(B, -1, 0)
              + np.roll(B, 1, 1) + np.roll(B, -1, 1) - 4.0 * B)
        rxn = A * B * B
        A = A + dA * LA - rxn + F * (1.0 - A)
        B = B + dB * LB + rxn - (F + k) * B
        np.clip(A, 0.0, 1.0, out=A)
        np.clip(B, 0.0, 1.0, out=B)

    return B


def save_pattern(B, path, lo=0.05, hi=0.45, gamma=1.0):
    B = np.clip(B, lo, hi)
    B = (B - lo) / (hi - lo)
    if gamma != 1.0:
        B = np.power(B, gamma)
    # Save as RGBA where alpha = brightness, RGB = white. This keeps the
    # mask mobile-compatible: standard CSS mask-image defaults to alpha
    # (works everywhere) instead of luminance (iOS/Android buggy → treats
    # the opaque grayscale PNG as 'fully passing' so the layer's bg color
    # leaks through as a solid block).
    a = (B * 255).astype(np.uint8)
    N = a.shape[0]
    rgba = np.zeros((N, N, 4), dtype=np.uint8)
    rgba[..., 0] = 255
    rgba[..., 1] = 255
    rgba[..., 2] = 255
    rgba[..., 3] = a
    Image.fromarray(rgba, "RGBA").save(path, optimize=True)
    print(f"  saved {path}  ({rgba.shape}, {os.path.getsize(path)//1024} KB)")


def main():
    out = os.path.join(os.path.dirname(__file__), "public")
    os.makedirs(out, exist_ok=True)

    # E_classic — brain-coral labyrinth, picked from parameter sweep as the
    # closest match to the reference brain-coral images. F=0.034, k=0.060
    # sits near "lambda" in Pearson parameter space — thick interlocking
    # curves with even line spacing.
    print("\n[turing] brain-coral labyrinth, F=0.034 k=0.060 ...")
    B = gray_scott(N=512, F=0.034, k=0.060, steps=20000, seed=7)
    save_pattern(B, os.path.join(out, "turing.png"))

    print("\nDone.")


if __name__ == "__main__":
    main()
