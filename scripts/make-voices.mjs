// Generates one MP3 per word with ElevenLabs into src/assets/voice/<id>.mp3.
// Usage: ELEVENLABS_API_KEY=sk_... node scripts/make-voices.mjs [--force] [ids...]
//        node scripts/make-voices.mjs --takes lion monkey   (3 new takes per word, see below)
//        node scripts/make-voices.mjs --takes --labels=d,e,f ten   (other strategies, when a/b/c all failed)
// ELEVENLABS_VOICE_ID picks another voice (default: Jessica, bright and playful).
//
// --takes writes src/assets/voice-takes/<id>-a|b|c.mp3, each a different way to get the English pronunciation
// right (TAKES below). The test version's
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
const labels = (args.find((a) => a.startsWith("--labels="))?.slice("--labels=".length) ?? "a,b,c").split(",");
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

// American pronunciation (CMU ARPAbet) of every word, for take B's <phoneme> tag.
const ARPABET = {
  dog: "D AO1 G", cat: "K AE1 T", fish: "F IH1 SH", bird: "B ER1 D", horse: "HH AO1 R S", cow: "K AW1",
  pig: "P IH1 G", rabbit: "R AE1 B AH0 T", sheep: "SH IY1 P", duck: "D AH1 K", elephant: "EH1 L AH0 F AH0 N T",
  lion: "L AY1 AH0 N", monkey: "M AH1 NG K IY0", frog: "F R AA1 G", zero: "Z IH1 R OW0", one: "W AH1 N",
  two: "T UW1", three: "TH R IY1", four: "F AO1 R", five: "F AY1 V", six: "S IH1 K S", seven: "S EH1 V AH0 N",
  eight: "EY1 T", nine: "N AY1 N", ten: "T EH1 N",
};

// The default recording: multilingual model, cheerful single word.
const MAIN = (w) => ({ text: `${w.en}!`, model_id: "eleven_multilingual_v2", language_code: "en" });
// Takes when the owner hears a wrong pronunciation (the multilingual model can drift into another accent):
const TAKES = {
  // A: same model, but surrounded by English context so it reads the word as English.
  a: (w) => ({
    text: `${w.en}.`,
    model_id: "eleven_multilingual_v2",
    previous_text: "Let's learn some English words. Repeat after me.",
    next_text: "Very good!",
  }),
  // B: English-only model told the exact sounds with a phoneme tag.
  b: (w) => ({ text: `<phoneme alphabet="cmu-arpabet" ph="${ARPABET[w.id]}">${w.en}</phoneme>!`, model_id: "eleven_flash_v2" }),
  // C: English-only model, plain word.
  c: (w) => ({ text: `${w.en}!`, model_id: "eleven_turbo_v2" }),
  // Second round, for words where A, B and C still sounded wrong (Ten):
  // D: English-only turbo model plus the phoneme tag (B's sounds, C's model).
  d: (w) => ({ text: `<phoneme alphabet="cmu-arpabet" ph="${ARPABET[w.id]}">${w.en}</phoneme>!`, model_id: "eleven_turbo_v2" }),
  // E: multilingual model reading it inside its natural sequence (counting for numbers).
  e: (w) => ({
    text: `${w.en}!`,
    model_id: "eleven_multilingual_v2",
    previous_text: NEIGHBORS[w.id] ?? "Look! It's a",
    next_text: ".",
  }),
  // F: newer English-capable turbo model with the language pinned.
  f: (w) => ({ text: `${w.en}!`, model_id: "eleven_turbo_v2_5", language_code: "en" }),
  // Third round (Ten again):
  // G: English-only turbo model, calm statement instead of the exclamation.
  g: (w) => ({ text: `${w.en}.`, model_id: "eleven_turbo_v2" }),
  // H: phoneme tag in IPA instead of ARPAbet, English-only flash model.
  h: (w) => ({ text: `<phoneme alphabet="ipa" ph="${IPA[w.id]}">${w.en}</phoneme>!`, model_id: "eleven_flash_v2" }),
  // I: spelled the way it sounds, English-only turbo model.
  i: (w) => ({ text: `${RESPELL[w.id] ?? w.en}!`, model_id: "eleven_turbo_v2" }),
};
// IPA (American) for take H and sound-alike spellings for take I, filled in as words need them.
const IPA = { ten: "tɛn", lion: "ˈlaɪən", monkey: "ˈmʌŋki", one: "wʌn", seven: "ˈsɛvən" };
const RESPELL = { ten: "Tenn", one: "Wun", lion: "Lie-un", monkey: "Munkey", seven: "Sevven" };
// What comes before a number when counting, for take E.
const NEIGHBORS = {
  one: "Zero,", two: "Zero, one,", three: "One, two,", four: "Two, three,", five: "Three, four,", six: "Four, five,",
  seven: "Five, six,", eight: "Six, seven,", nine: "Seven, eight,", ten: "Seven, eight, nine,",
};

async function tts(request) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({
      ...request,
      // 0.7 is the slowest speed (the owner found 0.9 fast).
      voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.3, speed: 0.7 },
    }),
  });
  if (!res.ok) {
    console.error(`${request.text}: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  return Buffer.from(await res.arrayBuffer());
}

const out = join(root, takes ? "src/assets/voice-takes" : "src/assets/voice");
mkdirSync(out, { recursive: true });
for (const w of words) {
  if (only.length && !only.includes(w.id)) continue;
  if (takes) {
    for (const label of labels) {
      const take = TAKES[label];
      if (!take) {
        console.error(`take desconhecida: ${label} (existem ${Object.keys(TAKES).join(", ")})`);
        process.exit(1);
      }
      writeFileSync(join(out, `${w.id}-${label}.mp3`), await tts(take(w)));
      console.log(`ok ${w.id}-${label}`);
    }
    continue;
  }
  const file = join(out, `${w.id}.mp3`);
  if (existsSync(file) && !force) continue;
  writeFileSync(file, await tts(MAIN(w)));
  console.log(`ok ${w.id}`);
}
