// Generates one MP3 per word with ElevenLabs into src/assets/voice/<id>.mp3.
// Usage: ELEVENLABS_API_KEY=sk_... node scripts/make-voices.mjs [--force] [ids...]
// ELEVENLABS_VOICE_ID picks another voice (default: Jessica, bright and playful).
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const key = process.env.ELEVENLABS_API_KEY;
const voice = process.env.ELEVENLABS_VOICE_ID ?? "cgSgspJ2msm6clMCkdW9";
if (!key?.startsWith("sk_")) {
  console.error("ELEVENLABS_API_KEY ausente ou inválida (a chave começa com sk_).");
  process.exit(1);
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("--"));

// Words actually used in the app today: animals (level 1) and numbers (level 2).
const src = (await import("node:fs")).readFileSync(join(root, "src/data/content.ts"), "utf8");
const words = [];
for (const cat of ["animals", "numbers"]) {
  const block = src.slice(src.indexOf(`id: "${cat}"`)).split("],")[0];
  for (const m of block.matchAll(/\{ id: "([^"]+)", emoji: "[^"]*", en: "([^"]+)"/g)) words.push({ id: m[1], en: m[2] });
}

const out = join(root, "src/assets/voice");
mkdirSync(out, { recursive: true });
for (const w of words) {
  if (only.length && !only.includes(w.id)) continue;
  const file = join(out, `${w.id}.mp3`);
  if (existsSync(file) && !force) continue;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({
      // The exclamation gives a cheerful, clear single-word reading.
      text: `${w.en}!`,
      model_id: "eleven_multilingual_v2",
      language_code: "en",
      voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.3, speed: 0.9 },
    }),
  });
  if (!res.ok) {
    console.error(`${w.id}: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log(`ok ${w.id}`);
}
