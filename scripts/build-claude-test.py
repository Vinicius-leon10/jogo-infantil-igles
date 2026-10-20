"""Packs the test build (SPROUT_ENV=teste) into one self-contained HTML file for
the Claude test link: script, styles, images and recorded words (MP3) inlined.

Usage: python3 scripts/build-claude-test.py <dist-dir> scripts/claude-test-template.html <out.html>
Use the template in the repo, never a page downloaded from the artifact: that one carries the old styles
inside it, and the test page then shipped them (map without its animation).
"""
import base64
import glob
import os
import sys

dist, template, out = sys.argv[1:4]


def only(pattern):
    # A dist folder reused without --emptyOutDir keeps old bundles; picking one at random shipped stale CSS.
    found = glob.glob(f"{dist}/assets/{pattern}")
    if len(found) != 1:
        sys.exit(f"esperava 1 arquivo {pattern} em {dist}/assets, achei {len(found)}: rode o build com --emptyOutDir")
    return found[0]


js = open(only("*.js")).read()
MIME = {".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg"}
for f in [f for ext in MIME for f in glob.glob(f"{dist}/assets/*{ext}")]:
    mime = MIME[os.path.splitext(f)[1]]
    uri = f"data:{mime};base64," + base64.b64encode(open(f, "rb").read()).decode()
    name = os.path.basename(f)
    # base "./" emits `new URL("dog-x.png", import.meta.url).href`; swap in the data URI.
    js = js.replace(f'new URL("{name}",import.meta.url).href', f'"{uri}"')
    js = js.replace("./assets/" + name, uri).replace("/assets/" + name, uri)
js = js.replace("</script", "<\\/script")
css = open(only("*.css")).read()
page = open(template).read()
a, b = page.index("<style>"), page.index("</style>")
page = page[:a] + "<style>:root{color-scheme:light;background:#dff4ff}\n" + css + page[b:]
a = page.index('<script type="module">') + len('<script type="module">')
b = page.rindex("</script>")
page = page[:a] + js + page[b:]
open(out, "w").write(page)
print(f"{out}: {len(page)} bytes")
