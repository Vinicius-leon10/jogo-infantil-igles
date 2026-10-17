import { ArrowLeft, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Word } from "@/data/content";
import { useTTS } from "@/hooks/useTTS";
import { Sprout } from "./Sprout";
import { Emoji } from "./Emoji";
import { playCorrect } from "@/lib/sound";

type Props = {
  words: Word[]; // 4–6 words ideal
  onDone: () => void;
  onBack: () => void;
};

type Card = {
  key: string;
  word: Word;
  face: "emoji" | "label";
};

function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => Math.random() - 0.5);
}

export function MemoryGame({ words, onDone, onBack }: Props) {
  const { speak } = useTTS();
  const pairs = useMemo(() => words.slice(0, 6), [words]);

  const initialCards: Card[] = useMemo(
    () =>
      shuffle(
        pairs.flatMap((w) => [
          { key: `${w.id}-e`, word: w, face: "emoji" as const },
          { key: `${w.id}-l`, word: w, face: "label" as const },
        ]),
      ),
    [pairs],
  );

  const [cards, setCards] = useState(initialCards);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const allMatched = matched.size === pairs.length;

  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped.map((k) => cards.find((c) => c.key === k)!);
    if (a.word.id === b.word.id) {
      setTimeout(() => {
        setMatched((m) => new Set(m).add(a.word.id));
        setFlipped([]);
        playCorrect();
        setTimeout(() => speak(a.word.en), 300);
      }, 350);
    } else {
      setTimeout(() => setFlipped([]), 800);
    }
    setMoves((m) => m + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped]);

  const handleFlip = (k: string) => {
    if (flipped.length >= 2) return;
    if (flipped.includes(k)) return;
    const card = cards.find((c) => c.key === k)!;
    if (matched.has(card.word.id)) return;
    if (card.face === "emoji" || true) {
      // speak when revealing label or emoji
      speak(card.word.en);
    }
    setFlipped((f) => [...f, k]);
  };

  return (
    <div className="min-h-screen bg-aurora flex flex-col">
      <header className="px-5 py-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="size-10 rounded-full bg-card flex items-center justify-center"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1 text-center">
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">
            Jogo da Memória
          </p>
          <p className="text-sm font-bold">
            {matched.size}/{pairs.length} pares · {moves} jogadas
          </p>
        </div>
        <div className="size-10" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="grid grid-cols-3 gap-3 w-full max-w-md">
          {cards.map((c) => {
            const isFlipped = flipped.includes(c.key) || matched.has(c.word.id);
            return (
              <button
                key={c.key}
                onClick={() => handleFlip(c.key)}
                className="aspect-square rounded-2xl flex items-center justify-center text-center font-bold active:scale-95 transition-all"
                style={{
                  background: isFlipped
                    ? matched.has(c.word.id)
                      ? "color-mix(in oklab, var(--sprout) 35%, var(--card))"
                      : "var(--card)"
                    : "linear-gradient(135deg, var(--indigo), var(--accent))",
                  boxShadow: matched.has(c.word.id)
                    ? "0 0 0 2px var(--sprout)"
                    : "0 6px 18px -10px rgba(0,0,0,0.4)",
                }}
              >
                {isFlipped ? (
                  <span className="text-5xl"><Emoji char={c.word.emoji} label={c.word.en} /></span>
                ) : (
                  <Volume2 className="size-7 opacity-70" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 pb-10 pt-4">
        {allMatched ? (
          <div className="flex flex-col items-center gap-3 animate-pop">
            <Sprout size={100} mood="love" />
            <p className="text-xl font-bold">Mandou bem!</p>
            <button
              onClick={onDone}
              className="w-full max-w-md rounded-2xl py-4 font-bold text-lg active:scale-95 transition-transform glow-sprout"
              style={{
                background: "linear-gradient(135deg, var(--sprout), var(--sprout-glow))",
                color: "var(--primary-foreground)",
              }}
            >
              Continuar
            </button>
          </div>
        ) : (
          <button
            onClick={onDone}
            className="w-full max-w-md mx-auto block rounded-2xl bg-card py-3 font-semibold text-sm text-muted-foreground active:scale-95 transition-transform"
          >
            Pular mini-jogo
          </button>
        )}
      </div>
    </div>
  );
}
