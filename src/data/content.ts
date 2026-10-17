export type Word = {
  id: string;
  emoji: string;
  en: string;
  pt: string;
  phonetic: string;
};

export type Category = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  words: Word[];
};

export type Phase = {
  id: number;
  level: number;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  /** Words taught in the Learn screen before the quiz. Empty = no learn step. */
  learnWordIds: string[];
  /** Words asked in the quiz (in order). */
  quizWordIds: string[];
  /** Categories used to draw distractor words for the quiz. */
  poolCategoryIds: string[];
  requiredScore: number;
  type: "learn" | "review" | "grand";
};

export type Level = {
  id: number;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  phaseIds: number[];
  /** The tree that grows one stage per phase on this level's map. */
  tree: "apple" | "cherry";
  treeName: string;
};

export const categories: Category[] = [
  {
    id: "animals", name: "Animals", emoji: "🐾", color: "var(--amber)",
    words: [
      { id: "dog", emoji: "🐶", en: "Dog", pt: "Cachorro", phonetic: "dɒɡ" },
      { id: "cat", emoji: "🐱", en: "Cat", pt: "Gato", phonetic: "kæt" },
      { id: "fish", emoji: "🐟", en: "Fish", pt: "Peixe", phonetic: "fɪʃ" },
      { id: "bird", emoji: "🐦", en: "Bird", pt: "Pássaro", phonetic: "bɜːrd" },
      { id: "horse", emoji: "🐴", en: "Horse", pt: "Cavalo", phonetic: "hɔːrs" },
      { id: "cow", emoji: "🐮", en: "Cow", pt: "Vaca", phonetic: "kaʊ" },
      { id: "pig", emoji: "🐷", en: "Pig", pt: "Porco", phonetic: "pɪɡ" },
      { id: "rabbit", emoji: "🐰", en: "Rabbit", pt: "Coelho", phonetic: "ˈræb.ɪt" },
      { id: "sheep", emoji: "🐑", en: "Sheep", pt: "Ovelha", phonetic: "ʃiːp" },
      { id: "duck", emoji: "🦆", en: "Duck", pt: "Pato", phonetic: "dʌk" },
      { id: "elephant", emoji: "🐘", en: "Elephant", pt: "Elefante", phonetic: "ˈɛl.ɪ.fənt" },
      { id: "lion", emoji: "🦁", en: "Lion", pt: "Leão", phonetic: "ˈlaɪ.ən" },
      { id: "monkey", emoji: "🐵", en: "Monkey", pt: "Macaco", phonetic: "ˈmʌŋ.ki" },
      { id: "frog", emoji: "🐸", en: "Frog", pt: "Sapo", phonetic: "frɒɡ" },
    ],
  },
  {
    id: "colors", name: "Colors", emoji: "🎨", color: "var(--pink)",
    words: [
      { id: "red", emoji: "🔴", en: "Red", pt: "Vermelho", phonetic: "rɛd" },
      { id: "blue", emoji: "🔵", en: "Blue", pt: "Azul", phonetic: "bluː" },
      { id: "green", emoji: "🟢", en: "Green", pt: "Verde", phonetic: "ɡriːn" },
      { id: "yellow", emoji: "🟡", en: "Yellow", pt: "Amarelo", phonetic: "ˈjɛl.oʊ" },
      { id: "purple", emoji: "🟣", en: "Purple", pt: "Roxo", phonetic: "ˈpɜːr.pəl" },
      { id: "orange", emoji: "🟠", en: "Orange", pt: "Laranja", phonetic: "ˈɔːr.ɪndʒ" },
      { id: "pink", emoji: "🌸", en: "Pink", pt: "Rosa", phonetic: "pɪŋk" },
      { id: "black", emoji: "⚫", en: "Black", pt: "Preto", phonetic: "blæk" },
      { id: "white", emoji: "⚪", en: "White", pt: "Branco", phonetic: "waɪt" },
      { id: "brown", emoji: "🟤", en: "Brown", pt: "Marrom", phonetic: "braʊn" },
      { id: "gray", emoji: "🩶", en: "Gray", pt: "Cinza", phonetic: "ɡreɪ" },
      { id: "cyan", emoji: "🩵", en: "Cyan", pt: "Ciano", phonetic: "ˈsaɪ.æn" },
      { id: "magenta", emoji: "💖", en: "Magenta", pt: "Magenta", phonetic: "məˈdʒɛn.tə" },
      { id: "gold", emoji: "🌟", en: "Gold", pt: "Dourado", phonetic: "ɡoʊld" },
    ],
  },
  {
    id: "clothes", name: "Clothes", emoji: "👕", color: "var(--pink)",
    words: [
      { id: "shirt", emoji: "👕", en: "Shirt", pt: "Camiseta", phonetic: "ʃɜːrt" },
      { id: "pants", emoji: "👖", en: "Pants", pt: "Calça", phonetic: "pænts" },
      { id: "dress", emoji: "👗", en: "Dress", pt: "Vestido", phonetic: "drɛs" },
      { id: "shoes", emoji: "👟", en: "Shoes", pt: "Sapatos", phonetic: "ʃuːz" },
      { id: "hat", emoji: "🎩", en: "Hat", pt: "Chapéu", phonetic: "hæt" },
      { id: "socks", emoji: "🧦", en: "Socks", pt: "Meias", phonetic: "sɒks" },
      { id: "coat", emoji: "🧥", en: "Coat", pt: "Casaco", phonetic: "koʊt" },
      { id: "scarf", emoji: "🧣", en: "Scarf", pt: "Cachecol", phonetic: "skɑːrf" },
      { id: "gloves", emoji: "🧤", en: "Gloves", pt: "Luvas", phonetic: "ɡlʌvz" },
      { id: "skirt", emoji: "🩳", en: "Skirt", pt: "Saia", phonetic: "skɜːrt" },
      { id: "boots", emoji: "🥾", en: "Boots", pt: "Botas", phonetic: "buːts" },
      { id: "shorts", emoji: "🩳", en: "Shorts", pt: "Shorts", phonetic: "ʃɔːrts" },
    ],
  },
  {
    id: "rooms", name: "Rooms", emoji: "🏠", color: "var(--indigo)",
    words: [
      { id: "bedroom", emoji: "🛏️", en: "Bedroom", pt: "Quarto", phonetic: "ˈbɛd.ruːm" },
      { id: "kitchen", emoji: "🍳", en: "Kitchen", pt: "Cozinha", phonetic: "ˈkɪtʃ.ən" },
      { id: "bathroom", emoji: "🛁", en: "Bathroom", pt: "Banheiro", phonetic: "ˈbæθ.ruːm" },
      { id: "living-room", emoji: "🛋️", en: "Living room", pt: "Sala", phonetic: "ˈlɪv.ɪŋ ruːm" },
      { id: "garage", emoji: "🚗", en: "Garage", pt: "Garagem", phonetic: "ɡəˈrɑːʒ" },
      { id: "garden", emoji: "🌷", en: "Garden", pt: "Jardim", phonetic: "ˈɡɑːr.dən" },
      { id: "office", emoji: "💼", en: "Office", pt: "Escritório", phonetic: "ˈɔː.fɪs" },
      { id: "attic", emoji: "🪜", en: "Attic", pt: "Sótão", phonetic: "ˈæt.ɪk" },
      { id: "balcony", emoji: "🌇", en: "Balcony", pt: "Varanda", phonetic: "ˈbæl.kə.ni" },
      { id: "hallway", emoji: "🚪", en: "Hallway", pt: "Corredor", phonetic: "ˈhɔːl.weɪ" },
      { id: "stairs", emoji: "🪜", en: "Stairs", pt: "Escadas", phonetic: "stɛərz" },
      { id: "basement", emoji: "🧰", en: "Basement", pt: "Porão", phonetic: "ˈbeɪs.mənt" },
    ],
  },
  {
    id: "household", name: "Household", emoji: "🛋️", color: "var(--amber)",
    words: [
      { id: "chair", emoji: "🪑", en: "Chair", pt: "Cadeira", phonetic: "tʃɛər" },
      { id: "table", emoji: "🪵", en: "Table", pt: "Mesa", phonetic: "ˈteɪ.bəl" },
      { id: "bed", emoji: "🛏️", en: "Bed", pt: "Cama", phonetic: "bɛd" },
      { id: "sofa", emoji: "🛋️", en: "Sofa", pt: "Sofá", phonetic: "ˈsoʊ.fə" },
      { id: "lamp", emoji: "💡", en: "Lamp", pt: "Luminária", phonetic: "læmp" },
      { id: "tv", emoji: "📺", en: "TV", pt: "TV", phonetic: "tiː.viː" },
      { id: "fridge", emoji: "🧊", en: "Fridge", pt: "Geladeira", phonetic: "frɪdʒ" },
      { id: "stove", emoji: "🍳", en: "Stove", pt: "Fogão", phonetic: "stoʊv" },
      { id: "clock", emoji: "🕰️", en: "Clock", pt: "Relógio", phonetic: "klɒk" },
      { id: "mirror", emoji: "🪞", en: "Mirror", pt: "Espelho", phonetic: "ˈmɪr.ər" },
      { id: "door", emoji: "🚪", en: "Door", pt: "Porta", phonetic: "dɔːr" },
      { id: "window", emoji: "🪟", en: "Window", pt: "Janela", phonetic: "ˈwɪn.doʊ" },
    ],
  },
  {
    id: "numbers", name: "Numbers", emoji: "🔢", color: "var(--indigo)",
    words: [
      { id: "zero", emoji: "0️⃣", en: "Zero", pt: "Zero", phonetic: "ˈzɪər.oʊ" },
      { id: "one", emoji: "1️⃣", en: "One", pt: "Um", phonetic: "wʌn" },
      { id: "two", emoji: "2️⃣", en: "Two", pt: "Dois", phonetic: "tuː" },
      { id: "three", emoji: "3️⃣", en: "Three", pt: "Três", phonetic: "θriː" },
      { id: "four", emoji: "4️⃣", en: "Four", pt: "Quatro", phonetic: "fɔːr" },
      { id: "five", emoji: "5️⃣", en: "Five", pt: "Cinco", phonetic: "faɪv" },
      { id: "six", emoji: "6️⃣", en: "Six", pt: "Seis", phonetic: "sɪks" },
      { id: "seven", emoji: "7️⃣", en: "Seven", pt: "Sete", phonetic: "ˈsɛv.ən" },
      { id: "eight", emoji: "8️⃣", en: "Eight", pt: "Oito", phonetic: "eɪt" },
      { id: "nine", emoji: "9️⃣", en: "Nine", pt: "Nove", phonetic: "naɪn" },
      { id: "ten", emoji: "🔟", en: "Ten", pt: "Dez", phonetic: "tɛn" },
    ],
  },
];

// Flatten lookup
const wordIndex: Record<string, Word> = {};
for (const c of categories) for (const w of c.words) wordIndex[w.id] = w;

export function getWord(id: string): Word | undefined {
  return wordIndex[id];
}

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

// ---------- Phase generation for Level 1 ----------

const animalOrder = ["dog","cat","fish","bird","horse","cow","pig","rabbit","sheep","duck","elephant","lion","monkey","frog"];
const colorOrder = ["red","blue","green","yellow","purple","orange","pink","black","white","brown","gray","cyan","magenta","gold"];
const numberOrder = ["zero","one","two","three","four","five","six","seven","eight","nine","ten"];

// Deterministic pseudo-random pick using a seed so phases stay stable
function pickN<T>(arr: T[], n: number, seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/**
 * Progressive learning: phase 1 introduces 5 new words, each subsequent phase
 * introduces 1 more (phase 2 = 6 total, ..., phase 10 = 14 total). The Learn
 * screen shows only the NEW words for that phase; the quiz tests every word
 * learned so far in that category (cumulative).
 */
function makeLearnPhases(
  ids: string[],
  startId: number,
  categoryId: string,
  color: string,
  labelPrefix: string,
  phaseCount = 10,
  level = 1,
): Phase[] {
  const phases: Phase[] = [];
  for (let i = 0; i < phaseCount; i++) {
    const cumulativeCount = Math.min(5 + i, ids.length);
    const prevCount = i === 0 ? 0 : Math.min(5 + (i - 1), ids.length);
    const learned = ids.slice(0, cumulativeCount);
    const newWords = ids.slice(prevCount, cumulativeCount);
    const quizWordIds = pickN(learned, learned.length, startId + i);
    const headline = newWords.map((id) => wordIndex[id]?.en).filter(Boolean).join(", ");
    phases.push({
      id: startId + i,
      level,
      title: `${labelPrefix} ${i + 1}`,
      subtitle: newWords.length > 0
        ? `Aprenda: ${headline}`
        : `Revisão · ${learned.length} palavras`,
      emoji: wordIndex[newWords[0] ?? learned[0]]?.emoji ?? "✨",
      color,
      learnWordIds: newWords.length > 0 ? newWords : learned,
      quizWordIds,
      poolCategoryIds: [categoryId],
      requiredScore: 70,
      type: "learn",
    });
  }
  return phases;
}

function makeAssociationPhases(
  startId: number,
  count: number,
  categoryIds: string[],
  level = 1,
  titlePrefix = "Associação",
): Phase[] {
  const all = categoryIds.flatMap(
    (cid) => categories.find((c) => c.id === cid)?.words.map((w) => w.id) ?? [],
  );
  const phases: Phase[] = [];
  for (let i = 0; i < count; i++) {
    const isReview = (i + 1) % 5 === 0;
    const isGrand = i === count - 1;
    const size = isGrand ? 12 : isReview ? 10 : 6;
    const quizWordIds = pickN(all, size, startId + i * 7);
    phases.push({
      id: startId + i,
      level,
      title: isGrand ? "Grand Review" : isReview ? `Revisão ${(i + 1) / 5}` : `${titlePrefix} ${i + 1}`,
      subtitle: isGrand
        ? "Mostre tudo que aprendeu!"
        : isReview
          ? "Misture tudo do nível"
          : "Pratique tudo junto",
      emoji: isGrand ? "🏆" : isReview ? "🌟" : "✨",
      color: isGrand ? "var(--sprout)" : "var(--accent)",
      learnWordIds: [],
      quizWordIds,
      poolCategoryIds: categoryIds,
      requiredScore: isGrand ? 80 : 70,
      type: isGrand ? "grand" : isReview ? "review" : "learn",
    });
  }
  return phases;
}

// Level 1
// For now the game has two levels: animals, then the numbers 0–10. The other categories
// (colours, clothes, rooms, household) stay in the catalogue for later.
// Level 1 — 14 animals: 5 words in the first phase, one more in each of the 10 phases.
const animalPhases = makeLearnPhases(animalOrder, 1, "animals", "var(--amber)", "Animal", 10, 1);
// Level 2 — numbers 0 to 10 (11 words): 7 phases. New IDs (201+) so old saved results of
// removed phases never count here.
const numberPhases = makeLearnPhases(numberOrder, 201, "numbers", "var(--indigo)", "Número", 7, 2);

export const phases: Phase[] = [...animalPhases, ...numberPhases];

const level1Ids = animalPhases.map((p) => p.id);
const level2Ids = numberPhases.map((p) => p.id);

export const levels: Level[] = [
  {
    id: 1,
    title: "Nível 1",
    subtitle: "Animais",
    emoji: "🐶",
    color: "var(--sprout)",
    phaseIds: level1Ids,
    tree: "apple",
    treeName: "Macieira",
  },
  {
    id: 2,
    title: "Nível 2",
    subtitle: "Números de 0 a 10",
    emoji: "1️⃣",
    color: "var(--indigo)",
    phaseIds: level2Ids,
    tree: "cherry",
    treeName: "Cerejeira",
  },
];

export function getLearnWords(phase: Phase): Word[] {
  return phase.learnWordIds.map((id) => wordIndex[id]).filter(Boolean);
}

export function getQuizWords(phase: Phase): Word[] {
  return phase.quizWordIds.map((id) => wordIndex[id]).filter(Boolean);
}

export function getPoolWords(phase: Phase): Word[] {
  return phase.poolCategoryIds.flatMap(
    (cid) => categories.find((c) => c.id === cid)?.words ?? [],
  );
}

// Back-compat for older callers
export function getWordsForPhase(phase: Phase): Word[] {
  return getQuizWords(phase);
}

/**
 * The phase that must be completed before `phaseId` unlocks, based on its
 * position inside the level (IDs have gaps in level 2, e.g. 108 → 111).
 * Returns null for the first phase of a level.
 */
export function previousPhaseId(phaseId: number): number | null {
  const level = levels.find((l) => l.phaseIds.includes(phaseId));
  if (!level) return null;
  const idx = level.phaseIds.indexOf(phaseId);
  return idx > 0 ? level.phaseIds[idx - 1] : null;
}

/** Next level unlocks when the previous level's tree is complete (its last phase passed). */
export function isLevelUnlocked(levelId: number, completed: (phaseId: number) => boolean): boolean {
  const prev = levels.find((l) => l.id === levelId - 1);
  if (!prev) return true;
  return completed(prev.phaseIds[prev.phaseIds.length - 1]);
}

/** True when `phaseId` is the last phase of its level (the one that completes the tree). */
export function isLastPhaseOfLevel(phaseId: number): boolean {
  const level = levels.find((l) => l.phaseIds.includes(phaseId));
  return !!level && level.phaseIds[level.phaseIds.length - 1] === phaseId;
}

/** Position of a phase inside its level (1, 2, 3…), which is what the child sees. */
export function phaseNumber(phaseId: number): number {
  const level = levels.find((l) => l.phaseIds.includes(phaseId));
  return level ? level.phaseIds.indexOf(phaseId) + 1 : phaseId;
}
