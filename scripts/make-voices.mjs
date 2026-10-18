// Generates one MP3 per word with ElevenLabs into src/assets/voice/<id>.mp3.
// Usage: ELEVENLABS_API_KEY=sk_... node scripts/make-voices.mjs [--force] [ids...]
//        node scripts/make-voices.mjs --takes lion monkey   (3 new takes per word, see below)
// ELEVENLABS_VOICE_ID picks another voice (default: Jessica, bright and playful).
//
// --takes writes src/assets/voice-takes/<id>-a|b|c.mp3 (same settings, different seeds). The test version's
// parents' area ("Falas" → "Escolher vozes") plays them side by side with the current one so the owner picks;
// the chosen take is then copied over src/assets/voice/<id>.mp3 and the takes deleted.
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
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
const takes = args.includes("--takes");
const only = args.filter((a) => !a.startsWith("--"));
if (takes && !only.length) {
  console.error("--takes precisa das palavras, ex.: --takes lion monkey");
  process.exit(1);
}

// Words actually used in the app today: animals (level 1) and numbers (level 2).
const src = readFileSync(join(root, "src/data/content.ts"), "utf8");
const words = [];
for (const cat of ["animals", "numbers"]) {
  const block = src.slice(src.indexOf(`id: "${cat}"`)).split("],")[0];
  for (const m of block.matchAll(/\{ id: "([^"]+)", emoji: "[^"]*", en: "([^"]+)"/g)) words.push({ id: m[1], en: m[2] });
}

async function tts(text, seed) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({
      // The exclamation gives a cheerful, clear single-word reading; 0.7 is the slowest speed (the owner found 0.9 fast).
      text: `${text}!`,
      model_id: "eleven_multilingual_v2",
      language_code: "en",
      ...(seed === undefined ? {} : { seed }),
      voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.3, speed: 0.7 },
    }),
  });
  if (!res.ok) {
    console.error(`${text}: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  return Buffer.from(await res.arrayBuffer());
}

const out = join(root, takes ? "src/assets/voice-takes" : "src/assets/voice");
mkdirSync(out, { recursive: true });
for (const w of words) {
  if (only.length && !only.includes(w.id)) continue;
  if (takes) {
    for (const [label, seed] of [["a", 11], ["b", 22], ["c", 33]]) {
      writeFileSync(join(out, `${w.id}-${label}.mp3`), await tts(w.en, seed));
      console.log(`ok ${w.id}-${label}`);
    }
    continue;
  }
  const file = join(out, `${w.id}.mp3`);
  if (existsSync(file) && !force) continue;
  writeFileSync(file, await tts(w.en));
  console.log(`ok ${w.id}`);
}
