"""Removes the white background (and an optional grey floor shadow) from an illustration
and saves a square, transparent 512 px PNG for src/assets/.

Usage: python3 scripts/cutout.py <input.png> <output.png> [--shadow]

Background = near-white pixels connected to the image border. With --shadow, warm-grey
pixels (a floor shadow) also count, so pockets enclosed by legs and shoes are cleared too;
bluish whites such as shoe soles are kept.
"""
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, out = sys.argv[1], sys.argv[2]
shadow = "--shadow" in sys.argv
im = Image.open(src).convert("RGB")
rgb = np.array(im).astype(np.int32)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]

candidate = (r >= 250) & (g >= 250) & (b >= 250)
if shadow:
    grey = (r >= 222) & (r <= 248) & (abs(r - g) <= 6) & (b <= r + 2)
    candidate |= grey

mask = Image.fromarray(np.where(candidate, 255, 0).astype(np.uint8), "L").copy()  # copy: writable
w, h = mask.size
for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
    if mask.getpixel(xy) == 255:
        ImageDraw.floodfill(mask, xy, 128)
bg = np.array(mask) == 128

alpha = np.where(bg, 0.0, 1.0)
# Soften a 3 px band next to the background (anti-aliased edges blended with white).
near = np.array(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 0
band = near & ~bg
rgbf = rgb.astype(np.float64)
edge_alpha = np.clip((255 - rgbf).max(axis=2) / 255.0 / 0.35, 0, 1)
alpha = np.where(band, np.minimum(alpha, edge_alpha), alpha)
safe = np.maximum(alpha, 1e-3)[..., None]
col = np.clip((rgbf - (1 - alpha[..., None]) * 255) / safe, 0, 255)
img = Image.fromarray(np.dstack([col, alpha * 255]).astype(np.uint8), "RGBA")

bbox = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
img = img.crop(bbox)
side = int(max(img.size) * 1.06)
canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
canvas.resize((512, 512), Image.LANCZOS).save(out, optimize=True)
print(out)
