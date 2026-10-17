"""Packs the test build (SPROUT_ENV=teste) into one self-contained HTML file for
the Claude test link: script, styles and images inlined.

Usage: python3 scripts/build-claude-test.py <dist-dir> <template.html> <out.html>
"""
import base64
import glob
import os
import sys

dist, template, out = sys.argv[1:4]
js = open(glob.glob(f"{dist}/assets/*.js")[0]).read()
for f in glob.glob(f"{dist}/assets/*.png") + glob.glob(f"{dist}/assets/*.svg"):
    mime = "image/png" if f.endswith(".png") else "image/svg+xml"
    uri = f"data:{mime};base64," + base64.b64encode(open(f, "rb").read()).decode()
    name = os.path.basename(f)
    # base "./" emits `new URL("dog-x.png", import.meta.url).href`; swap in the data URI.
    js = js.replace(f'new URL("{name}",import.meta.url).href', f'"{uri}"')
    js = js.replace("./assets/" + name, uri).replace("/assets/" + name, uri)
js = js.replace("</script", "<\\/script")
css = open(glob.glob(f"{dist}/assets/*.css")[0]).read()
page = open(template).read()
a, b = page.index("<style>"), page.index("</style>")
page = page[:a] + "<style>:root{color-scheme:dark;background:#1a1a2e}\n" + css + page[b:]
a = page.index('<script type="module">') + len('<script type="module">')
b = page.rindex("</script>")
page = page[:a] + js + page[b:]
open(out, "w").write(page)
print(f"{out}: {len(page)} bytes")
