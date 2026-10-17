// Mini-stories crafted for early English learners.
// Vocabulary: drawn from the Animals, Colors, and Numbers categories the
// child learns in the map. We allow a small set of "sight words" so sentences
// feel natural without ever introducing untaught nouns/colors/numbers.
//
// The illustrator places emojis on a soft scene with x/y/scale/rotate so each
// page looks composed rather than a list of icons.

export type IllustrationItem = {
  emoji: string;
  /** x in % of card width (0..100), measured from left of emoji center */
  x: number;
  /** y in % of card height (0..100), measured from top of emoji center */
  y: number;
  /** font-size in px */
  size?: number;
  /** rotation in degrees */
  rotate?: number;
  /** drop opacity 0..1 (background props) */
  opacity?: number;
};

export type StoryPage = {
  /** Background gradient using design tokens. */
  bg: string;
  illustration: IllustrationItem[];
  en: string;
  pt: string;
  /** Word ids (from content.ts) that appear on this page — used for highlight. */
  highlight?: string[];
};

export type Story = {
  id: string;
  emoji: string;
  titlePt: string;
  titleEn: string;
  /** Cover gradient. */
  cover: string;
  /** Word ids the child must have learned for the story to unlock. */
  requires: string[];
  pages: StoryPage[];
};

export const stories: Story[] = [
  {
    id: "red-cat-blue-fish",
    emoji: "🐱",
    titlePt: "O Gato e o Peixe",
    titleEn: "The Cat and the Fish",
    cover:
      "linear-gradient(135deg, color-mix(in oklab, var(--pink) 35%, var(--background)), color-mix(in oklab, var(--azure) 35%, var(--background)))",
    requires: ["cat", "fish", "red", "blue", "one", "two"],
    pages: [
      {
        bg: "linear-gradient(180deg, oklch(0.78 0.12 250), oklch(0.92 0.06 250))",
        illustration: [
          { emoji: "☁️", x: 18, y: 18, size: 56, opacity: 0.85 },
          { emoji: "☁️", x: 75, y: 12, size: 48, opacity: 0.7 },
          { emoji: "☀️", x: 86, y: 28, size: 56 },
          { emoji: "🐱", x: 35, y: 70, size: 96, rotate: -4 },
        ],
        en: "Look! One red cat.",
        pt: "Olhe! Um gato vermelho.",
        highlight: ["one", "red", "cat"],
      },
      {
        bg: "linear-gradient(180deg, oklch(0.62 0.16 240), oklch(0.45 0.18 250))",
        illustration: [
          { emoji: "🌊", x: 20, y: 80, size: 56, opacity: 0.8 },
          { emoji: "🌊", x: 60, y: 84, size: 56, opacity: 0.8 },
          { emoji: "🐟", x: 40, y: 50, size: 88, rotate: 8 },
          { emoji: "🫧", x: 62, y: 32, size: 28 },
          { emoji: "🫧", x: 70, y: 44, size: 22 },
        ],
        en: "Look! Two blue fish.",
        pt: "Olhe! Dois peixes azuis.",
        highlight: ["two", "blue", "fish"],
      },
      {
        bg: "linear-gradient(180deg, oklch(0.85 0.1 90), oklch(0.92 0.05 110))",
        illustration: [
          { emoji: "🐱", x: 28, y: 60, size: 80, rotate: 6 },
          { emoji: "💭", x: 58, y: 32, size: 64 },
          { emoji: "🐟", x: 76, y: 38, size: 44 },
        ],
        en: "The cat sees the fish.",
        pt: "O gato vê o peixe.",
        highlight: ["cat", "fish"],
      },
      {
        bg: "linear-gradient(180deg, oklch(0.78 0.18 30), oklch(0.6 0.22 25))",
        illustration: [
          { emoji: "🐱", x: 32, y: 60, size: 96, rotate: -8 },
          { emoji: "🐟", x: 68, y: 60, size: 80, rotate: 14 },
          { emoji: "💨", x: 52, y: 62, size: 44, opacity: 0.7 },
        ],
        en: "The cat runs. The fish is fast!",
        pt: "O gato corre. O peixe é rápido!",
        highlight: ["cat", "fish"],
      },
      {
        bg: "linear-gradient(180deg, oklch(0.85 0.12 145), oklch(0.92 0.07 145))",
        illustration: [
          { emoji: "🐱", x: 36, y: 58, size: 80 },
          { emoji: "🐟", x: 60, y: 58, size: 72 },
          { emoji: "💚", x: 50, y: 32, size: 56 },
        ],
        en: "Now they are friends.",
        pt: "Agora eles são amigos.",
      },
    ],
  },

  {
    id: "three-little-pigs",
    emoji: "🐷",
    titlePt: "Três Porquinhos",
    titleEn: "Three Little Pigs",
    cover:
      "linear-gradient(135deg, color-mix(in oklab, var(--pink) 40%, var(--background)), color-mix(in oklab, var(--amber) 30%, var(--background)))",
    requires: ["pig", "three", "one", "two", "pink", "brown"],
    pages: [
      {
        bg: "linear-gradient(180deg, oklch(0.85 0.06 80), oklch(0.78 0.08 60))",
        illustration: [
          { emoji: "🐷", x: 25, y: 55, size: 72 },
          { emoji: "🐷", x: 50, y: 55, size: 72 },
          { emoji: "🐷", x: 75, y: 55, size: 72 },
          { emoji: "🌳", x: 12, y: 78, size: 56, opacity: 0.85 },
          { emoji: "🌳", x: 88, y: 78, size: 56, opacity: 0.85 },
        ],
        en: "Three little pigs.",
        pt: "Três porquinhos.",
        highlight: ["three", "pig"],
      },
      {
        bg: "linear-gradient(180deg, oklch(0.9 0.05 90), oklch(0.82 0.08 70))",
        illustration: [
          { emoji: "🐷", x: 30, y: 60, size: 88, rotate: -5 },
          { emoji: "🌾", x: 65, y: 60, size: 96 },
        ],
        en: "One pig has a pink house.",
        pt: "Um porco tem uma casa rosa.",
        highlight: ["one", "pig", "pink"],
      },
      {
        bg: "linear-gradient(180deg, oklch(0.85 0.07 60), oklch(0.7 0.1 50))",
        illustration: [
          { emoji: "🐷", x: 30, y: 60, size: 88, rotate: 4 },
          { emoji: "🪵", x: 65, y: 60, size: 80, rotate: -10 },
        ],
        en: "Two pigs love brown wood.",
        pt: "Dois porcos amam madeira marrom.",
        highlight: ["two", "pig", "brown"],
      },
      {
        bg: "linear-gradient(180deg, oklch(0.7 0.06 30), oklch(0.55 0.08 25))",
        illustration: [
          { emoji: "🐺", x: 28, y: 58, size: 88, rotate: -8 },
          { emoji: "💨", x: 50, y: 64, size: 56, opacity: 0.7 },
          { emoji: "🏠", x: 75, y: 62, size: 80 },
        ],
        en: "A big wolf comes. Oh no!",
        pt: "Um lobo grande vem. Ah, não!",
      },
      {
        bg: "linear-gradient(180deg, oklch(0.88 0.1 145), oklch(0.78 0.12 140))",
        illustration: [
          { emoji: "🧱", x: 50, y: 58, size: 96 },
          { emoji: "🐷", x: 25, y: 70, size: 56 },
          { emoji: "🐷", x: 75, y: 70, size: 56 },
          { emoji: "🐷", x: 50, y: 30, size: 56 },
        ],
        en: "The three pigs are safe!",
        pt: "Os três porcos estão seguros!",
        highlight: ["three", "pig"],
      },
    ],
  },

  {
    id: "lion-and-monkey",
    emoji: "🦁",
    titlePt: "O Leão e o Macaco",
    titleEn: "The Lion and the Monkey",
    cover:
      "linear-gradient(135deg, color-mix(in oklab, var(--amber) 40%, var(--background)), color-mix(in oklab, var(--sprout) 30%, var(--background)))",
    requires: ["lion", "monkey", "yellow", "brown", "one"],
    pages: [
      {
        bg: "linear-gradient(180deg, oklch(0.85 0.14 90), oklch(0.78 0.16 80))",
        illustration: [
          { emoji: "☀️", x: 82, y: 18, size: 64 },
          { emoji: "🦁", x: 38, y: 64, size: 100, rotate: -3 },
          { emoji: "🌾", x: 14, y: 86, size: 44, opacity: 0.8 },
          { emoji: "🌾", x: 82, y: 86, size: 44, opacity: 0.8 },
        ],
        en: "One yellow lion sleeps.",
        pt: "Um leão amarelo dorme.",
        highlight: ["one", "yellow", "lion"],
      },
      {
        bg: "linear-gradient(180deg, oklch(0.7 0.14 140), oklch(0.55 0.16 145))",
        illustration: [
          { emoji: "🌳", x: 25, y: 60, size: 100 },
          { emoji: "🐵", x: 60, y: 40, size: 72, rotate: 12 },
          { emoji: "🍌", x: 78, y: 56, size: 44, rotate: -10 },
        ],
        en: "A brown monkey jumps.",
        pt: "Um macaco marrom pula.",
        highlight: ["brown", "monkey"],
      },
      {
        bg: "linear-gradient(180deg, oklch(0.78 0.12 60), oklch(0.65 0.14 50))",
        illustration: [
          { emoji: "🦁", x: 32, y: 62, size: 88 },
          { emoji: "🐵", x: 68, y: 62, size: 76 },
          { emoji: "💬", x: 50, y: 30, size: 56 },
        ],
        en: "Hello, friend! says the monkey.",
        pt: "Olá, amigo! diz o macaco.",
        highlight: ["monkey"],
      },
      {
        bg: "linear-gradient(180deg, oklch(0.88 0.1 80), oklch(0.78 0.12 70))",
        illustration: [
          { emoji: "🦁", x: 30, y: 60, size: 88 },
          { emoji: "🐵", x: 70, y: 60, size: 76 },
          { emoji: "🌟", x: 20, y: 22, size: 36 },
          { emoji: "🌟", x: 80, y: 22, size: 36 },
          { emoji: "💛", x: 50, y: 32, size: 56 },
        ],
        en: "The lion and the monkey play.",
        pt: "O leão e o macaco brincam.",
        highlight: ["lion", "monkey"],
      },
    ],
  },

  {
    id: "five-yellow-ducks",
    emoji: "🦆",
    titlePt: "Cinco Patinhos Amarelos",
    titleEn: "Five Yellow Ducks",
    cover:
      "linear-gradient(135deg, color-mix(in oklab, var(--amber) 45%, var(--background)), color-mix(in oklab, var(--azure) 30%, var(--background)))",
    requires: ["duck", "five", "four", "three", "two", "one", "yellow", "blue"],
    pages: [
      {
        bg: "linear-gradient(180deg, oklch(0.78 0.12 230), oklch(0.62 0.16 240))",
        illustration: [
          { emoji: "🦆", x: 18, y: 60, size: 60 },
          { emoji: "🦆", x: 36, y: 60, size: 60 },
          { emoji: "🦆", x: 54, y: 60, size: 60 },
          { emoji: "🦆", x: 72, y: 60, size: 60 },
          { emoji: "🦆", x: 90, y: 60, size: 60 },
          { emoji: "🌊", x: 50, y: 88, size: 56, opacity: 0.85 },
        ],
        en: "Five yellow ducks in blue water.",
        pt: "Cinco patinhos amarelos na água azul.",
        highlight: ["five", "yellow", "duck", "blue"],
      },
      {
        bg: "linear-gradient(180deg, oklch(0.78 0.12 230), oklch(0.62 0.16 240))",
        illustration: [
          { emoji: "🦆", x: 25, y: 60, size: 60 },
          { emoji: "🦆", x: 45, y: 60, size: 60 },
          { emoji: "🦆", x: 65, y: 60, size: 60 },
          { emoji: "🦆", x: 85, y: 60, size: 60 },
          { emoji: "👋", x: 14, y: 30, size: 44 },
        ],
        en: "One swims away. Now four ducks.",
        pt: "Um nada para longe. Agora quatro patinhos.",
        highlight: ["one", "four", "duck"],
      },
      {
        bg: "linear-gradient(180deg, oklch(0.78 0.12 230), oklch(0.62 0.16 240))",
        illustration: [
          { emoji: "🦆", x: 32, y: 60, size: 60 },
          { emoji: "🦆", x: 52, y: 60, size: 60 },
          { emoji: "🦆", x: 72, y: 60, size: 60 },
          { emoji: "🌿", x: 14, y: 80, size: 44, opacity: 0.85 },
        ],
        en: "Three ducks. Two ducks.",
        pt: "Três patinhos. Dois patinhos.",
        highlight: ["three", "two", "duck"],
      },
      {
        bg: "linear-gradient(180deg, oklch(0.6 0.18 250), oklch(0.4 0.18 260))",
        illustration: [
          { emoji: "🦆", x: 50, y: 60, size: 88 },
          { emoji: "🌙", x: 82, y: 22, size: 48 },
          { emoji: "✨", x: 18, y: 26, size: 28 },
          { emoji: "✨", x: 30, y: 18, size: 22 },
          { emoji: "✨", x: 70, y: 36, size: 24 },
        ],
        en: "One yellow duck. Good night!",
        pt: "Um patinho amarelo. Boa noite!",
        highlight: ["one", "yellow", "duck"],
      },
    ],
  },

  {
    id: "rainbow-friends",
    emoji: "🌈",
    titlePt: "Os Amigos do Arco-Íris",
    titleEn: "Rainbow Friends",
    cover:
      "linear-gradient(135deg, color-mix(in oklab, var(--accent) 35%, var(--background)), color-mix(in oklab, var(--pink) 35%, var(--background)))",
    requires: ["red", "blue", "green", "yellow", "dog", "cat", "bird"],
    pages: [
      {
        bg: "linear-gradient(180deg, oklch(0.88 0.12 25), oklch(0.78 0.18 25))",
        illustration: [
          { emoji: "🐶", x: 50, y: 58, size: 100 },
          { emoji: "❤️", x: 78, y: 28, size: 44 },
        ],
        en: "A red dog says hello.",
        pt: "Um cachorro vermelho diz olá.",
        highlight: ["red", "dog"],
      },
      {
        bg: "linear-gradient(180deg, oklch(0.78 0.16 240), oklch(0.62 0.18 245))",
        illustration: [
          { emoji: "🐱", x: 50, y: 58, size: 100 },
          { emoji: "💙", x: 78, y: 28, size: 44 },
        ],
        en: "A blue cat smiles.",
        pt: "Um gato azul sorri.",
        highlight: ["blue", "cat"],
      },
      {
        bg: "linear-gradient(180deg, oklch(0.85 0.18 145), oklch(0.7 0.2 145))",
        illustration: [
          { emoji: "🐦", x: 50, y: 50, size: 96, rotate: -6 },
          { emoji: "🍃", x: 22, y: 72, size: 44, opacity: 0.8 },
          { emoji: "🍃", x: 80, y: 72, size: 44, opacity: 0.8 },
        ],
        en: "A green bird sings.",
        pt: "Um pássaro verde canta.",
        highlight: ["green", "bird"],
      },
      {
        bg: "linear-gradient(180deg, oklch(0.92 0.16 90), oklch(0.82 0.18 80))",
        illustration: [
          { emoji: "☀️", x: 50, y: 32, size: 88 },
          { emoji: "🐶", x: 22, y: 72, size: 56 },
          { emoji: "🐱", x: 50, y: 76, size: 56 },
          { emoji: "🐦", x: 78, y: 70, size: 56 },
        ],
        en: "A yellow sun. Three friends!",
        pt: "Um sol amarelo. Três amigos!",
        highlight: ["yellow"],
      },
    ],
  },

  {
    id: "cow-and-horse",
    emoji: "🐮",
    titlePt: "A Vaca e o Cavalo",
    titleEn: "The Cow and the Horse",
    cover:
      "linear-gradient(135deg, color-mix(in oklab, var(--sprout) 35%, var(--background)), color-mix(in oklab, var(--amber) 30%, var(--background)))",
    requires: ["cow", "horse", "white", "brown", "green"],
    pages: [
      {
        bg: "linear-gradient(180deg, oklch(0.88 0.14 145), oklch(0.7 0.18 140))",
        illustration: [
          { emoji: "🐮", x: 32, y: 60, size: 96 },
          { emoji: "🌱", x: 68, y: 70, size: 56 },
          { emoji: "🌿", x: 82, y: 80, size: 44, opacity: 0.85 },
        ],
        en: "A white cow eats green grass.",
        pt: "Uma vaca branca come grama verde.",
        highlight: ["white", "cow", "green"],
      },
      {
        bg: "linear-gradient(180deg, oklch(0.85 0.1 80), oklch(0.7 0.12 60))",
        illustration: [
          { emoji: "🐴", x: 50, y: 58, size: 100, rotate: -4 },
          { emoji: "💨", x: 22, y: 64, size: 48, opacity: 0.7 },
        ],
        en: "A brown horse runs fast.",
        pt: "Um cavalo marrom corre rápido.",
        highlight: ["brown", "horse"],
      },
      {
        bg: "linear-gradient(180deg, oklch(0.85 0.1 200), oklch(0.78 0.12 220))",
        illustration: [
          { emoji: "🐮", x: 32, y: 60, size: 80 },
          { emoji: "🐴", x: 68, y: 60, size: 80 },
          { emoji: "🤝", x: 50, y: 36, size: 56 },
        ],
        en: "Hello, says the cow.",
        pt: "Olá, diz a vaca.",
        highlight: ["cow"],
      },
      {
        bg: "linear-gradient(180deg, oklch(0.6 0.18 280), oklch(0.42 0.18 285))",
        illustration: [
          { emoji: "🐮", x: 32, y: 62, size: 72 },
          { emoji: "🐴", x: 68, y: 62, size: 72 },
          { emoji: "🌙", x: 50, y: 24, size: 56 },
          { emoji: "✨", x: 18, y: 30, size: 24 },
          { emoji: "✨", x: 82, y: 32, size: 24 },
        ],
        en: "Good night, cow. Good night, horse.",
        pt: "Boa noite, vaca. Boa noite, cavalo.",
        highlight: ["cow", "horse"],
      },
    ],
  },
];

export function getStoriesForLearned(learnedIds: Set<string>): {
  story: Story;
  unlocked: boolean;
  missing: string[];
}[] {
  return stories.map((s) => {
    const missing = s.requires.filter((id) => !learnedIds.has(id));
    return { story: s, unlocked: missing.length === 0, missing };
  });
}
