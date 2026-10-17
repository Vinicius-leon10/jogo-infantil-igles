import { ArrowLeft, Check, Volume2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Word } from "@/data/content";
import { useTTS } from "@/hooks/useTTS";
import { Sprout } from "./Sprout";

type Props = {
  pool: Word[];
  questions: Word[];
  onFinish: (score: number, wrongIds: string[], correctIds: string[]) => void;
  onBack: () => void;
  canRead?: boolean;
};

type Q = {
  word: Word;
  options: Word[];
  mode: "audio" | "emoji" | "translate";
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function QuizScreen({ pool, questions, onFinish, onBack, canRead = true }: Props) {
  const { speak } = useTTS();
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [shake, setShake] = useState(false);
  const [mood, setMood] = useState<"happy" | "excited" | "love" | "wink">("happy");
  const wrongIdsRef = useRef<string[]>([]);
  const correctIdsRef = useRef<string[]>([]);

  const qs: Q[] = useMemo(() => {
    return questions.map((w, i) => {
      const distractors = shuffle(pool.filter((p) => p.id !== w.id)).slice(0, 3);
      const options = shuffle([w, ...distractors]);
      const mode: Q["mode"] = canRead
        ? i % 3 === 0
          ? "audio"
          : i % 3 === 1
            ? "emoji"
            : "translate"
        : "audio";
      return { word: w, options, mode };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = qs[idx];
  const isLast = idx === qs.length - 1;
  const progress = ((idx + (picked ? 1 : 0)) / qs.length) * 100;

  useEffect(() => {
    if (q?.mode === "audio") {
      const t = setTimeout(() => speak(q.word.en), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const handlePick = (optionId: string) => {
    if (picked) return;
    setPicked(optionId);
    const ok = optionId === q.word.id;
    if (ok) {
      setCorrect((c) => c + 1);
      correctIdsRef.current.push(q.word.id);
      setMood("excited");
      speak(q.word.en);
    } else {
      wrongIdsRef.current.push(q.word.id);
      setMood("wink");
      setShake(true);
      setTimeout(() => setShake(false), 350);
    }
  };

  const handleNext = () => {
    setPicked(null);
    setMood("happy");
    if (isLast) {
      const score = Math.round((correct / qs.length) * 100);
      onFinish(score, wrongIdsRef.current, correctIdsRef.current);
    } else {
      setIdx(idx + 1);
    }
  };

  if (!q) return null;

  // Voice the prompt: audio mode plays the word; emoji/translate plays the visible word too.
  const replay = () => {
    if (q.mode === "translate") {
      // speak the PT prompt isn't ideal in english voice — speak nothing extra
      return;
    }
    speak(q.word.en);
  };

  return (
    <div className={`min-h-screen bg-aurora flex flex-col ${shake ? "animate-shake" : ""}`}>
      <header className="px-5 py-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="size-10 rounded-full bg-card flex items-center justify-center"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, var(--sprout), var(--sprout-glow))",
            }}
          />
        </div>
        <span className="text-xs font-bold text-muted-foreground tabular-nums">
          {idx + 1}/{qs.length}
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Mascot reaction */}
        <div className="mb-3">
          <Sprout
            size={84}
            mood={mood}
            className={
              picked
                ? mood === "excited"
                  ? "animate-pop"
                  : "animate-shake"
                : "animate-float"
            }
          />
        </div>

        <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-4">
          {q.mode === "audio" ? "Ouça e escolha" : q.mode === "emoji" ? "Qual a palavra?" : "Qual o significado?"}
        </span>

        {q.mode === "audio" && (
          <button
            onClick={() => speak(q.word.en)}
            className="size-28 rounded-full flex items-center justify-center mb-6 active:scale-95 transition-transform"
            style={{
              background: "linear-gradient(135deg, var(--indigo), var(--accent))",
              boxShadow: "0 10px 40px -10px var(--indigo)",
            }}
            aria-label="Ouvir novamente"
          >
            <Volume2 className="size-12" />
          </button>
        )}

        {q.mode === "emoji" && (
          <div className="size-36 rounded-[2rem] bg-card flex items-center justify-center text-7xl mb-6 glow-sprout animate-pop">
            {q.word.emoji}
          </div>
        )}

        {q.mode === "translate" && (
          <div className="mb-6 text-center animate-pop">
            <p className="text-xs text-muted-foreground mb-1">Em português:</p>
            <h2 className="text-4xl font-bold" style={{ color: "var(--sprout)" }}>{q.word.pt}</h2>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
          {q.options.map((opt) => {
            const isPicked = picked === opt.id;
            const isCorrect = opt.id === q.word.id;
            const showResult = picked !== null;
            let bg = "bg-card hover:bg-muted";
            let ring = "";
            if (showResult && isCorrect) {
              bg = "";
              ring = "ring-2";
            } else if (showResult && isPicked && !isCorrect) {
              bg = "";
              ring = "ring-2";
            }

            return (
              <button
                key={opt.id}
                onClick={() => handlePick(opt.id)}
                disabled={!!picked}
                className={`relative rounded-2xl p-4 text-center transition-all active:scale-95 ${bg} ${ring}`}
                style={
                  showResult && isCorrect
                    ? { background: "color-mix(in oklab, var(--sprout) 25%, var(--card))", boxShadow: "0 0 0 2px var(--sprout)" }
                    : showResult && isPicked
                      ? { background: "color-mix(in oklab, var(--destructive) 25%, var(--card))", boxShadow: "0 0 0 2px var(--destructive)" }
                      : undefined
                }
              >
                {q.mode === "translate" ? (
                  <>
                    <div className="text-4xl mb-1">{opt.emoji}</div>
                    <div className="text-lg font-bold">{opt.en}</div>
                  </>
                ) : q.mode === "emoji" ? (
                  <div className="text-xl font-bold py-3">{opt.en}</div>
                ) : canRead ? (
                  <>
                    <div className="text-4xl mb-1">{opt.emoji}</div>
                    <div className="text-sm font-bold">{opt.en}</div>
                  </>
                ) : (
                  <div className="text-6xl py-3">{opt.emoji}</div>
                )}
                {showResult && isCorrect && (
                  <span className="absolute top-2 right-2 size-6 rounded-full flex items-center justify-center"
                    style={{ background: "var(--sprout)" }}>
                    <Check className="size-4" style={{ color: "var(--primary-foreground)" }} />
                  </span>
                )}
                {showResult && isPicked && !isCorrect && (
                  <span className="absolute top-2 right-2 size-6 rounded-full bg-destructive flex items-center justify-center">
                    <X className="size-4" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 pb-10 pt-4 min-h-[100px]">
        {picked && (
          <button
            onClick={handleNext}
            className="w-full max-w-md mx-auto rounded-2xl py-4 font-bold text-lg active:scale-95 transition-transform glow-sprout animate-pop"
            style={{
              background: "linear-gradient(135deg, var(--sprout), var(--sprout-glow))",
              color: "var(--primary-foreground)",
              display: "block",
            }}
          >
            {isLast ? "Ver resultado" : "Continuar"}
          </button>
        )}
      </div>
    </div>
  );
}
