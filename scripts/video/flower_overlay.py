"""Render a "flower bloom" transition as a transparent PNG sequence.

The bloom opens from the centre, covers the frame at the midpoint (hiding the
cut between clips), then keeps expanding past the edges while fading out.

usage: python3 flower_overlay.py OUT_DIR [--w 1280] [--h 720] [--frames 36] [--seed 1]
                                         [--palette mavic|avata]
"""
import argparse
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

PALETTES = {
    # Mavic 3 accent (#D97706) with soft blossom tones
    "mavic": [
        # (petal count, length factor, width factor, colour, rotation speed)
        (12, 1.00, 0.36, (217, 119, 6), 0.9),    # amber outer ring
        (10, 0.78, 0.40, (244, 114, 182), -1.2),  # pink
        (8, 0.56, 0.44, (253, 230, 200), 1.6),    # cream
        (6, 0.34, 0.50, (255, 250, 240), -2.0),   # white heart
    ],
    # AVATA accent (#7C5CFF) — violet / lilac blossom
    "avata": [
        (12, 1.00, 0.36, (124, 92, 255), 0.9),    # violet outer ring
        (10, 0.78, 0.40, (236, 132, 214), -1.2),  # orchid pink
        (8, 0.56, 0.44, (221, 214, 254), 1.6),    # lilac
        (6, 0.34, 0.50, (250, 248, 255), -2.0),   # white heart
    ],
}
LAYERS = PALETTES["mavic"]


def ease_in_out(t):
    return 0.5 - 0.5 * math.cos(math.pi * t)


def petal(cx, cy, angle, length, width, steps=28):
    """Teardrop petal polygon starting at the centre, pointing along angle."""
    pts = []
    for i in range(steps + 1):
        s = i / steps
        x = length * s
        y = width * math.sin(math.pi * s) * (1 - 0.35 * s)
        pts.append((x, y))
    for i in range(steps, -1, -1):
        s = i / steps
        x = length * s
        y = -width * math.sin(math.pi * s) * (1 - 0.35 * s)
        pts.append((x, y))
    ca, sa = math.cos(angle), math.sin(angle)
    return [(cx + x * ca - y * sa, cy + x * sa + y * ca) for x, y in pts]


def render(out_dir, w, h, frames, seed):
    os.makedirs(out_dir, exist_ok=True)
    rng = random.Random(seed)
    phase = rng.uniform(0, math.tau)
    diag = math.hypot(w, h)
    ss = 2  # supersampling for smooth edges
    for f in range(frames):
        t = f / (frames - 1)
        # size grows the whole time; strongest coverage at t=0.5
        grow = ease_in_out(min(1.0, t / 0.5)) if t <= 0.5 else 1 + 0.9 * ease_in_out((t - 0.5) / 0.5)
        alpha_mul = 1.0 if t <= 0.5 else 1 - ease_in_out((t - 0.5) / 0.5)
        img = Image.new("RGBA", (w * ss, h * ss), (0, 0, 0, 0))
        cx, cy = w * ss / 2, h * ss / 2
        base = diag * ss * 0.62 * grow
        for li, (count, lf, wf, col, spin) in enumerate(LAYERS):
            layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
            d = ImageDraw.Draw(layer)
            rot = phase + spin * t * math.pi + li * 0.3
            length = base * lf
            width = length * wf
            a = int(255 * alpha_mul * (0.92 if li == 0 else 0.97))
            for p in range(count):
                ang = rot + p * math.tau / count
                d.polygon(petal(cx, cy, ang, length, width), fill=col + (a,))
            # soft glow edge on each layer
            layer = layer.filter(ImageFilter.GaussianBlur(1.5 * ss))
            img = Image.alpha_composite(img, layer)
        # golden pollen dots in the heart
        if base > 0:
            d = ImageDraw.Draw(img)
            r = base * 0.06
            for k in range(14):
                ang = phase * 2 + k * math.tau / 14 + t * 2
                rr = r * (0.6 + 0.4 * ((k * 7) % 5) / 4)
                px, py = cx + math.cos(ang) * rr, cy + math.sin(ang) * rr
                dot = max(1, r * 0.18)
                d.ellipse([px - dot, py - dot, px + dot, py + dot],
                          fill=(234, 179, 8, int(255 * alpha_mul)))
        img = img.resize((w, h), Image.LANCZOS)
        img.save(os.path.join(out_dir, f"f{f:03d}.png"))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("out_dir")
    ap.add_argument("--w", type=int, default=1280)
    ap.add_argument("--h", type=int, default=720)
    ap.add_argument("--frames", type=int, default=36)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--palette", choices=sorted(PALETTES), default="mavic")
    a = ap.parse_args()
    LAYERS = PALETTES[a.palette]
    render(a.out_dir, a.w, a.h, a.frames, a.seed)
