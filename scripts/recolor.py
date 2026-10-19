"""Recolours a cut-out illustration (transparent PNG) whose body is one hue, keeping its
shading, highlights and face. Used to make the colour splashes from the owner's blue one.

Usage: python3 scripts/recolor.py <in.png> <out.png> <#rrggbb | white | black | gray>

Body pixels = the source hue (±22°). Each keeps how much white it has (highlights) and how
dark it is (shadows); the new colour replaces the hue. White/gray/black get extra shading
so they still read on the app's light backgrounds.
"""
import colorsys
import sys

import numpy as np
from PIL import Image, ImageFilter

src, out, target = sys.argv[1:4]
im = np.array(Image.open(src).convert("RGBA")).astype(np.float64) / 255
rgb, alpha = im[..., :3], im[..., 3]

hsv = np.vectorize(colorsys.rgb_to_hsv, otypes=[float, float, float])(rgb[..., 0], rgb[..., 1], rgb[..., 2])
h, s, v = hsv
body_hue = np.median(h[(alpha > 0.9) & (s > 0.6)])
dh = np.abs(((h - body_hue + 0.5) % 1) - 0.5)
body = (dh < 22 / 360) & (s > 0.12) & (alpha > 0)

tint = 1 - s  # white mixed in (highlights)
shade = 1 - v  # darkness (shadows, outlines, eyebrows)

special = {"white": "#f6f7fa", "gray": "#9ea4ad", "black": "#34343a"}
base = np.array([int(special.get(target, target)[i : i + 2], 16) for i in (1, 3, 5)]) / 255
gain = {"white": 5.0, "gray": 2.0, "black": 1.0}.get(target, 1.0)

new = base * (1 - np.clip(shade * gain, 0, 0.85))[..., None]
if target == "black":
    # Dark features (eyebrows) would vanish on black: draw them light instead.
    new = np.where((shade > 0.35)[..., None], np.array([0.62, 0.62, 0.66]), new)
new = new + (1 - new) * (tint * (0.55 if target in special else 1.0))[..., None]
rgb = np.where(body[..., None], new, rgb)

res = Image.fromarray((np.dstack([rgb, alpha]) * 255).round().astype(np.uint8), "RGBA")
if target == "white":
    # A soft grey rim so the white splash shows on white cards.
    a = res.getchannel("A")
    rim = a.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(1.5))
    under = Image.new("RGBA", res.size, (176, 186, 200, 0))
    under.putalpha(rim)
    res = Image.alpha_composite(under, res)
res.save(out)
print(out)
