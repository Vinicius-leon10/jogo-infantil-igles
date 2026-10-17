// Renders scripts/sprout-icon.svg into the PNG/ICO icons in public/.
// Usage: node scripts/make-icons.mjs  (needs Playwright + Chromium)
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const svg = readFileSync(new URL("./sprout-icon.svg", import.meta.url), "utf8");
const out = (name) => new URL(`../public/${name}`, import.meta.url);
const sizes = [16, 32, 57, 60, 72, 76, 114, 120, 144, 152, 167, 180, 192, 256, 384, 512];

const browser = await chromium.launch();
const page = await browser.newPage();
const png = {};
for (const s of sizes) {
  await page.setViewportSize({ width: s, height: s });
  await page.setContent(
    `<html><body style="margin:0">${svg.replace('width="512" height="512"', `width="${s}" height="${s}"`)}</body></html>`,
  );
  png[s] = await page.screenshot({ omitBackground: true });
  writeFileSync(out(s <= 32 ? `favicon-${s}x${s}.png` : `apple-touch-icon-${s}x${s}.png`), png[s]);
}
await browser.close();

writeFileSync(out("apple-touch-icon.png"), png[180]);
writeFileSync(out("apple-touch-icon-precomposed.png"), png[180]);

// ICO containing the 16, 32 and 48-ish (use 32) PNGs.
const entries = [16, 32];
const header = Buffer.alloc(6 + 16 * entries.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(entries.length, 4);
let offset = header.length;
entries.forEach((s, i) => {
  const b = 6 + i * 16;
  header.writeUInt8(s, b);
  header.writeUInt8(s, b + 1);
  header.writeUInt16LE(1, b + 4);
  header.writeUInt16LE(32, b + 6);
  header.writeUInt32LE(png[s].length, b + 8);
  header.writeUInt32LE(offset, b + 12);
  offset += png[s].length;
});
writeFileSync(out("favicon.ico"), Buffer.concat([header, ...entries.map((s) => png[s])]));
console.log("icons written");
