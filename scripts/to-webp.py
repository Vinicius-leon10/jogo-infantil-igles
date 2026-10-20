"""Converts illustrations to WebP (about a third of the PNG size, same look, transparency kept)
and deletes the PNGs. The app loads src/assets/<category>/<id>.webp.

Usage: python3 scripts/to-webp.py <file.png> [...]
"""
import os
import sys

from PIL import Image

for src in sys.argv[1:]:
    out = os.path.splitext(src)[0] + ".webp"
    Image.open(src).save(out, "WEBP", quality=88, method=6)
    print(f"{src}: {os.path.getsize(src) // 1024} KB -> {os.path.getsize(out) // 1024} KB")
    os.remove(src)
