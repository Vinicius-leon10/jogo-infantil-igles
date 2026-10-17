// Draws the number characters (0, 2–10) in src/assets/numbers/, in the style of the
// reference "1" (one.png): a glossy, rounded digit with a face, waving arms, legs and
// sneakers. Each digit is rendered in a browser canvas with the Fredoka Bold font.
//
// Usage: node scripts/make-numbers.mjs   (needs Playwright's Chromium and @fontsource/fredoka)
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const font = readFileSync(require.resolve("@fontsource/fredoka/files/fredoka-latin-700-normal.woff2")).toString("base64");

// id, text, body colour, darker outline, sneaker colour
const NUMBERS = [
  ["zero", "0", "#ff6b6b", "#e04848", "#1e88e5"],
  ["two", "2", "#ff9f2e", "#e97c0c", "#1e88e5"],
  ["three", "3", "#4cc95a", "#2fa43d", "#1e88e5"],
  ["four", "4", "#36b7ec", "#1593c8", "#ef5350"],
  ["five", "5", "#a77cf2", "#8257d6", "#1e88e5"],
  ["six", "6", "#ff74b1", "#e44f92", "#1e88e5"],
  ["seven", "7", "#22c4a6", "#119f86", "#ef5350"],
  ["eight", "8", "#6a8cff", "#4a68e0", "#ef5350"],
  ["nine", "9", "#8fd43d", "#6cb21f", "#1e88e5"],
  ["ten", "10", "#ffbe2e", "#f29a0c", "#1e88e5"],
];

const draw = async ([id, text, body, dark, shoe]) => {
  const S = 1024; // drawn at 2x, saved at 512
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  const size = text.length > 1 ? 600 : 760;
  const fontCss = `700 ${size}px Fredoka`;

  // 1. Glyph mask (with a thick outline so thin strokes stay chunky).
  const mask = document.createElement("canvas");
  mask.width = mask.height = S;
  const m = mask.getContext("2d");
  m.font = fontCss;
  m.textAlign = "center";
  m.textBaseline = "alphabetic";
  const metrics = m.measureText(text);
  const glyphH = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  const baseY = 90 + metrics.actualBoundingBoxAscent + (690 - glyphH) / 2;
  m.lineJoin = "round";
  m.lineWidth = 34;
  m.strokeStyle = "#000";
  m.fillStyle = "#000";
  m.strokeText(text, S / 2, baseY);
  m.fillText(text, S / 2, baseY);
  const md = m.getImageData(0, 0, S, S).data;
  const solid = new Uint8Array(S * S);
  for (let i = 0; i < S * S; i++) solid[i] = md[i * 4 + 3] > 127 ? 1 : 0;

  // 2. Holes (the inside of 0, 4, 6, 8, 9): transparent pixels not reachable from the edge.
  const outside = new Uint8Array(S * S);
  const stack = [0];
  outside[0] = 1;
  while (stack.length) {
    const p = stack.pop();
    const x = p % S, y = (p / S) | 0;
    for (const q of [x > 0 && p - 1, x < S - 1 && p + 1, y > 0 && p - S, y < S - 1 && p + S]) {
      if (q !== false && !outside[q] && !solid[q]) {
        outside[q] = 1;
        stack.push(q);
      }
    }
  }
  const blob = new Uint8Array(S * S); // digit with its holes filled
  for (let i = 0; i < S * S; i++) blob[i] = solid[i] || !outside[i] ? 1 : 0;

  // 3. Face goes at the point of the filled digit farthest from its edge.
  const dist = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) dist[i] = blob[i] ? 1e9 : 0;
  for (let y = 1; y < S - 1; y++)
    for (let x = 1; x < S - 1; x++) {
      const i = y * S + x;
      if (dist[i]) dist[i] = Math.min(dist[i], dist[i - 1] + 1, dist[i - S] + 1, dist[i - S - 1] + 1.414, dist[i - S + 1] + 1.414);
    }
  for (let y = S - 2; y > 0; y--)
    for (let x = S - 2; x > 0; x--) {
      const i = y * S + x;
      if (dist[i]) dist[i] = Math.min(dist[i], dist[i + 1] + 1, dist[i + S] + 1, dist[i + S + 1] + 1.414, dist[i + S - 1] + 1.414);
    }
  let best = 0, fx = S / 2, fy = S / 2;
  for (let y = 0; y < S * 0.62; y++) // keep the face in the upper part, like the reference
    for (let x = 0; x < S; x++)
      if (dist[y * S + x] > best) [best, fx, fy] = [dist[y * S + x], x, y];
  const r = Math.min(best, 150);

  // Digit extent per row, for arms and legs.
  const rowSpan = (y) => {
    let a = -1, b = -1;
    for (let x = 0; x < S; x++) if (blob[y * S + x]) { if (a < 0) a = x; b = x; }
    return [a, b];
  };
  let bottom = S - 1;
  while (bottom > 0 && rowSpan(bottom)[0] < 0) bottom--;

  const brown = "#5b3416";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Floor shadow, legs and sneakers.
  const [bl, br] = rowSpan(bottom - 20);
  const mid = (bl + br) / 2;
  const legX = [mid - 105, mid + 105]; // far enough apart that the big sneakers never touch
  const footY = Math.min(S - 70, bottom + 110);
  ctx.fillStyle = "rgba(0,0,0,0.13)";
  ctx.beginPath();
  ctx.ellipse(S / 2, footY + 42, 300, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = brown;
  ctx.lineWidth = 26;
  for (const x of legX) {
    ctx.beginPath();
    ctx.moveTo(x, bottom - 30);
    ctx.lineTo(x, footY);
    ctx.stroke();
  }
  const k = 1.45; // sneaker scale (big, chunky shoes like the reference)
  for (const [i, x] of legX.entries()) {
    const dir = i === 0 ? -1 : 1;
    const cx = x + dir * 30 * k;
    ctx.fillStyle = shoe;
    ctx.beginPath();
    ctx.ellipse(cx, footY + 8, 92 * k, 48 * k, 0, Math.PI, 0);
    ctx.lineTo(cx + 92 * k, footY + 22);
    ctx.ellipse(cx, footY + 22, 92 * k, 18 * k, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = "#f4f7fb"; // sole
    ctx.beginPath();
    ctx.ellipse(cx, footY + 24 + 6 * k, 96 * k, 20 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff"; // toe cap
    ctx.beginPath();
    ctx.ellipse(cx + dir * 52 * k, footY + 12, 34 * k, 26 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.85)"; // laces
    ctx.lineWidth = 9;
    for (const j of [0, 1]) {
      const lx = x + dir * (8 + j * 26) * k;
      ctx.beginPath();
      ctx.moveTo(lx - 14 * k, footY - (22 - j * 9) * k);
      ctx.lineTo(lx + 14 * k, footY - (29 - j * 9) * k);
      ctx.stroke();
    }
  }

  // Waving arms from the sides of the digit, a bit below the face.
  const armY = Math.min(bottom - 120, fy + r * 1.3);
  const [al, ar] = rowSpan(Math.round(armY));
  ctx.strokeStyle = brown;
  ctx.lineWidth = 24;
  for (const [x0, dir] of [[al + 18, -1], [ar - 18, 1]]) {
    const hx = x0 + dir * 190, hy = armY - 150;
    ctx.beginPath();
    ctx.moveTo(x0, armY);
    ctx.quadraticCurveTo(x0 + dir * 120, armY + 10, hx, hy);
    ctx.stroke();
    ctx.fillStyle = brown;
    ctx.beginPath();
    ctx.arc(hx, hy, 28, 0, Math.PI * 2);
    ctx.fill();
    for (const a of [-1.9, -1.45, -1.0].map((t) => (dir > 0 ? t + 0.25 : -Math.PI - t - 0.25))) {
      ctx.beginPath();
      ctx.arc(hx + Math.cos(a) * 34, hy + Math.sin(a) * 34, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Digit: dark outline, then gradient body, holes as a lighter "belly", gloss.
  const layer = document.createElement("canvas");
  layer.width = layer.height = S;
  const l = layer.getContext("2d");
  l.drawImage(mask, 0, 0);
  l.globalCompositeOperation = "source-in";
  l.fillStyle = dark;
  l.fillRect(0, 0, S, S);
  ctx.drawImage(layer, 0, 0);

  const inner = document.createElement("canvas");
  inner.width = inner.height = S;
  const n = inner.getContext("2d");
  n.font = fontCss;
  n.textAlign = "center";
  n.lineJoin = "round";
  n.lineWidth = 12;
  n.strokeStyle = "#000";
  n.strokeText(text, S / 2, baseY);
  n.fillText(text, S / 2, baseY);
  n.globalCompositeOperation = "source-in";
  const grad = n.createLinearGradient(0, 80, 0, bottom);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.08, body);
  grad.addColorStop(1, body);
  n.fillStyle = grad;
  n.fillRect(0, 0, S, S);
  // gloss: soft white band on the upper-left of the strokes
  n.globalCompositeOperation = "source-atop";
  n.fillStyle = "rgba(255,255,255,0.35)";
  n.beginPath();
  n.ellipse(S / 2 - 110, 230, 120, 70, -0.5, 0, Math.PI * 2);
  n.fill();
  n.fillStyle = "rgba(0,0,0,0.08)";
  n.fillRect(S / 2 + 40, 0, S, S);
  ctx.drawImage(inner, 0, 0);

  // Holes filled with a lighter tint so the face never floats over the background.
  const hole = ctx.getImageData(0, 0, S, S);
  const tint = body.match(/\w\w/g).map((h) => Math.round(parseInt(h, 16) + (255 - parseInt(h, 16)) * 0.45));
  for (let i = 0; i < S * S; i++)
    if (blob[i] && !solid[i]) {
      hole.data[i * 4] = tint[0];
      hole.data[i * 4 + 1] = tint[1];
      hole.data[i * 4 + 2] = tint[2];
      hole.data[i * 4 + 3] = 255;
    }
  ctx.putImageData(hole, 0, 0);

  // Face (same proportions as the reference): eyes, brows, cheeks, open smile.
  const eR = r * 0.36, gap = r * 0.52, ey = fy - r * 0.18;
  for (const dx of [-gap, gap]) {
    const x = fx + dx;
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(x, ey, eR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#4a240f";
    ctx.beginPath(); ctx.arc(x + eR * 0.12, ey + eR * 0.08, eR * 0.78, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1d0e06";
    ctx.beginPath(); ctx.arc(x + eR * 0.12, ey + eR * 0.08, eR * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(x - eR * 0.12, ey - eR * 0.22, eR * 0.24, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + eR * 0.36, ey + eR * 0.34, eR * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#4a240f";
    ctx.lineWidth = Math.max(8, r * 0.07);
    ctx.beginPath();
    ctx.arc(x, ey - eR * 0.45, eR * 0.95, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,120,90,0.45)";
  for (const dx of [-gap * 1.35, gap * 1.35]) {
    ctx.beginPath(); ctx.ellipse(fx + dx, ey + eR * 1.35, eR * 0.5, eR * 0.32, 0, 0, Math.PI * 2); ctx.fill();
  }
  const mw = r * 0.42, my = ey + eR * 1.15;
  ctx.fillStyle = "#5a1d0e";
  ctx.beginPath();
  ctx.moveTo(fx - mw, my);
  ctx.quadraticCurveTo(fx, my + mw * 0.25, fx + mw, my);
  ctx.quadraticCurveTo(fx + mw * 0.8, my + mw * 1.25, fx, my + mw * 1.2);
  ctx.quadraticCurveTo(fx - mw * 0.8, my + mw * 1.25, fx - mw, my);
  ctx.fill();
  ctx.fillStyle = "#f4717f";
  ctx.beginPath();
  ctx.ellipse(fx + mw * 0.05, my + mw * 0.85, mw * 0.5, mw * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trim to the drawing and centre it in a square with a small margin (like the cut-out "1").
  const px = ctx.getImageData(0, 0, S, S).data;
  let x0 = S, y0 = S, x1 = 0, y1 = 0;
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++)
      if (px[(y * S + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  const side = Math.max(x1 - x0, y1 - y0) * 1.06;
  const out = document.createElement("canvas");
  out.width = out.height = 512;
  const o = out.getContext("2d");
  const scale = 512 / side;
  o.drawImage(c, x0, y0, x1 - x0, y1 - y0, (512 - (x1 - x0) * scale) / 2, (512 - (y1 - y0) * scale) / 2, (x1 - x0) * scale, (y1 - y0) * scale);
  return [id, out.toDataURL("image/png")];
};

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent("<html><body></body></html>");
await page.evaluate(async (font) => {
  const face = new FontFace("Fredoka", `url(data:font/woff2;base64,${font})`, { weight: "700" });
  document.fonts.add(await face.load());
}, font);
for (const n of NUMBERS) {
  const [id, url] = await page.evaluate(`(${draw.toString()})(${JSON.stringify(n)})`);
  writeFileSync(new URL(`../src/assets/numbers/${id}.png`, import.meta.url), Buffer.from(url.split(",")[1], "base64"));
  console.log(id);
}
await browser.close();
