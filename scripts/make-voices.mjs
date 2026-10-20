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
import { execFileSync } from "node:child_process";

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

// Words actually used in the app today: animals (level 1), numbers (level 2) and colours (level 3).
const src = readFileSync(join(root, "src/data/content.ts"), "utf8");
const words = [];
for (const cat of ["animals", "numbers", "colors"]) {
  const block = src.slice(src.indexOf(`id: "${cat}"`)).split("],")[0];
  for (const m of block.matchAll(/\{ id: "([^"]+)", emoji: "[^"]*", en: "([^"]+)"/g)) words.push({ id: m[1], en: m[2] });
}
// Praise said on the result screen (ResultScreen.tsx PRAISE, "Perfect!" for 100%). The file name is the text in
// lowercase letters only ("You did it!" → youdidit.mp3), which is how the app finds a recording for a text.
for (const en of ["Great job", "Awesome", "Well done", "Fantastic", "Amazing", "You did it", "Perfect"]) {
  words.push({ id: en.toLowerCase().replace(/[^a-z]/g, ""), en, phrase: true });
}

// American pronunciation (CMU ARPAbet) of every word, for take B's <phoneme> tag.
const ARPABET = {
  dog: "D AO1 G", cat: "K AE1 T", fish: "F IH1 SH", bird: "B ER1 D", horse: "HH AO1 R S", cow: "K AW1",
  pig: "P IH1 G", rabbit: "R AE1 B AH0 T", sheep: "SH IY1 P", duck: "D AH1 K", elephant: "EH1 L AH0 F AH0 N T",
  lion: "L AY1 AH0 N", monkey: "M AH1 NG K IY0", frog: "F R AA1 G", zero: "Z IH1 R OW0", one: "W AH1 N",
  two: "T UW1", three: "TH R IY1", four: "F AO1 R", five: "F AY1 V", six: "S IH1 K S", seven: "S EH1 V AH0 N",
  eight: "EY1 T", nine: "N AY1 N", ten: "T EH1 N",
  red: "R EH1 D", blue: "B L UW1", yellow: "Y EH1 L OW0", green: "G R IY1 N", orange: "AO1 R AH0 N JH",
  purple: "P ER1 P AH0 L", pink: "P IH1 NG K", brown: "B R AW1 N", black: "B L AE1 K", white: "W AY1 T",
  gray: "G R EY1",
};

// The default recording: multilingual model, cheerful single word.
const MAIN = (w) =>
  w.phrase
    ? // English-only model: the one the owner picked most often when fixing pronunciation (take C).
      { text: `${w.en}!`, model_id: "eleven_turbo_v2" }
    : { text: `${w.en}!`, model_id: "eleven_multilingual_v2", language_code: "en" };
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
  // Fourth round (Orange): said inside a sentence, then only the word is cut out (cutWord, using the
  // per-letter timing ElevenLabs returns). Alone, the voice stresses the word's ending ("Orange" → loud "dj");
  // mid-sentence the ending comes out light and natural.
  n: (w) => ({ text: `${w.en} is the word.`, model_id: "eleven_turbo_v2", cutWord: w.en }),
  o: (w) => ({ text: `${w.en} is the word.`, model_id: "eleven_multilingual_v2", cutWord: w.en }),
  p: (w) => ({ text: `I see ${w.en.toLowerCase()} and blue.`, model_id: "eleven_turbo_v2", cutWord: w.en.toLowerCase() }),
  q: (w) => ({ text: `${w.en}, please.`, model_id: "eleven_turbo_v2", cutWord: w.en }),
};
// What each take tries, written to src/assets/voice-takes/notes.json for the picker ("Escolher vozes").
const TAKE_NOTES = {
  a: "lida no meio de frases em inglês",
  b: "com os sons exatos do inglês americano",
  c: "voz treinada só em inglês",
  d: "voz só em inglês com os sons exatos",
  e: "lida na sequência (contando, nos números)",
  f: "voz mais nova, fixada em inglês",
  g: "voz só em inglês, falada calma (sem exclamação)",
  h: "sons exatos escritos de outro jeito (IPA)",
  i: "escrita do jeito que se fala",
  n: "recortada da frase “… is the word” (só inglês)",
  o: "recortada da frase “… is the word” (voz original)",
  p: "recortada do meio de “I see … and blue”",
  q: "recortada de “…, please”",
};
// IPA (American) for take H and sound-alike spellings for take I, filled in as words need them.
const IPA = { ten: "tɛn", lion: "ˈlaɪən", monkey: "ˈmʌŋki", one: "wʌn", seven: "ˈsɛvən", orange: "ˈɔrɪndʒ" };
const RESPELL = { ten: "Tenn", one: "Wun", lion: "Lie-un", monkey: "Munkey", seven: "Sevven", orange: "Or-inj" };
// What comes before a number when counting, for take E.
const NEIGHBORS = {
  one: "Zero,", two: "Zero, one,", three: "One, two,", four: "Two, three,", five: "Three, four,", six: "Four, five,",
  seven: "Five, six,", eight: "Six, seven,", nine: "Seven, eight,", ten: "Seven, eight, nine,",
};

async function tts({ cutWord, ...request }) {
  const timed = cutWord ? "/with-timestamps" : "";
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}${timed}?output_format=mp3_44100_128`, {
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
  if (!cutWord) return Buffer.from(await res.arrayBuffer());
  // Keep only `cutWord` out of the sentence: from its first letter's start to its last letter's end,
  // plus a little room, fading in and out so the cut does not click.
  const { audio_base64, alignment } = await res.json();
  const at = request.text.indexOf(cutWord);
  const from = Math.max(0, alignment.character_start_times_seconds[at] - 0.02);
  const to = alignment.character_end_times_seconds[at + cutWord.length - 1] + 0.04;
  const len = to - from;
  return execFileSync(
    "ffmpeg",
    // Trim inside the filter (then reset the clock) so the fades are timed on the word, not the sentence.
    ["-v", "error", "-i", "pipe:0",
     "-af", `atrim=${from.toFixed(3)}:${to.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.015,` +
       `afade=t=out:st=${(len - 0.06).toFixed(3)}:d=0.06,apad=pad_dur=0.05`,
     "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "128k", "-f", "mp3", "pipe:1"],
    { input: Buffer.from(audio_base64, "base64") },
  );
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
      const notesFile = join(out, "notes.json");
      const notes = existsSync(notesFile) ? JSON.parse(readFileSync(notesFile, "utf8")) : {};
      notes[`${w.id}-${label}`] = TAKE_NOTES[label];
      writeFileSync(notesFile, JSON.stringify(notes, null, 2) + "\n");
      console.log(`ok ${w.id}-${label}`);
    }
    continue;
  }
  const file = join(out, `${w.id}.mp3`);
  if (existsSync(file) && !force) continue;
  writeFileSync(file, await tts(MAIN(w)));
  console.log(`ok ${w.id}`);
}
