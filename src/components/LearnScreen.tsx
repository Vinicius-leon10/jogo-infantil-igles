import { ArrowLeft, ArrowRight, Mic, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Word } from "@/data/content";
import { useTTS } from "@/hooks/useTTS";
import { matchesWord, useSpeechRecognition } from "@/hooks/useSpeechRecognition";

type Props = {
  words: Word[];
  onDone: () => void;
  onBack: () => void;
};

type Feedback =
  | { kind: "ok"; heard: string }
  | { kind: "near"; heard: string }
  | { kind: "no-speech" }
  | { kind: "denied" }
  | { kind: "mic" }
  | { kind: "error" }
  | null;

export function LearnScreen({ words, onDone, onBack }: Props) {
  const [idx, setIdx] = useState(0);
  const { speak, speaking } = useTTS();
  const { supported: micSupported, listening, start, stop } = useSpeechRecognition();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const word = words[idx];
  const isLast = idx === words.length - 1;
  const progress = ((idx + 1) / words.length) * 100;

  useEffect(() => {
    setFeedback(null);
    const t = setTimeout(() => speak(word.en), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const handleMic = () => {
    if (listening) {
      stop();
      return;
    }
    setFeedback(null);
    start(
      (heard) => {
        const alts = heard.split(" | ");
        const ok = alts.some((a) => matchesWord(a, word.en));
        setFeedback({ kind: ok ? "ok" : "near", heard: alts[0] ?? "" });
        if (ok) {
          setTimeout(() => speak(word.en), 200);
        }
      },
      (err) => {
        if (err === "not-allowed") setFeedback({ kind: "denied" });
        else if (err === "no-speech") setFeedback({ kind: "no-speech" });
        else if (err === "audio-capture") setFeedback({ kind: "mic" });
        else setFeedback({ kind: "error" });
      },
    );
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
          {idx + 1}/{words.length}
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-4">
          Aprender
        </span>

        <div key={word.id} className="animate-pop">
          <div className="size-44 mx-auto rounded-[2rem] bg-card flex items-center justify-center text-8xl mb-6 glow-sprout">
            {word.emoji}
          </div>

          <h2 className="text-5xl font-bold mb-2">{word.en}</h2>
          <p className="text-sm font-mono text-muted-foreground mb-1">/{word.phonetic}/</p>
          <p className="text-lg" style={{ color: "var(--sprout)" }}>{word.pt}</p>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={() => speak(word.en)}
            className={`size-16 rounded-full flex items-center justify-center transition-all active:scale-90 ${speaking ? "animate-pulse" : ""}`}
            style={{
              background: "linear-gradient(135deg, var(--indigo), var(--accent))",
              boxShadow: "0 10px 30px -10px var(--indigo)",
            }}
            aria-label="Ouvir"
          >
            <Volume2 className="size-7" />
          </button>

          {micSupported && (
            <button
              onClick={handleMic}
              className={`size-16 rounded-full flex items-center justify-center transition-all active:scale-90 ${listening ? "animate-pulse" : ""}`}
              style={{
                background: listening
                  ? "linear-gradient(135deg, var(--destructive), var(--accent))"
                  : "linear-gradient(135deg, var(--sprout), var(--sprout-glow))",
                boxShadow: "0 10px 30px -10px var(--sprout)",
              }}
              aria-label="Falar"
            >
              <Mic className="size-7" />
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {micSupported
            ? listening
              ? "Ouvindo... fale a palavra 🎤"
              : "Ouvir 🔊 ou falar 🎤"
            : "Toque para ouvir"}
        </p>

        {feedback && (() => {
          const ok = feedback.kind === "ok";
          const messages: Record<typeof feedback.kind, string> = {
            ok: "Perfeito! 🌟",
            near: "Quase! Tente de novo 💪",
            "no-speech": "Não ouvi nada 🤫 Fale mais alto!",
            denied: "Libere o microfone nas permissões 🎤",
            mic: "Microfone indisponível 😕",
            error: "Tente de novo 🎤",
          };
          const heard = "heard" in feedback ? feedback.heard : "";
          return (
            <div
              className="mt-4 px-4 py-2 rounded-2xl animate-pop"
              style={{
                background: ok
                  ? "color-mix(in oklab, var(--sprout) 25%, var(--card))"
                  : "color-mix(in oklab, var(--destructive) 20%, var(--card))",
                boxShadow: ok
                  ? "0 0 0 2px var(--sprout)"
                  : "0 0 0 2px var(--destructive)",
              }}
            >
              <p className="text-sm font-bold">{messages[feedback.kind]}</p>
              {heard && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ouvi: "{heard}"
                </p>
              )}
            </div>
          );
        })()}
      </div>

      <div className="px-6 pb-10 pt-4 flex gap-3">
        {idx > 0 && (
          <button
            onClick={() => setIdx(idx - 1)}
            className="rounded-2xl bg-card px-5 py-4 font-bold active:scale-95 transition-transform"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}
        <button
          onClick={() => (isLast ? onDone() : setIdx(idx + 1))}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-lg active:scale-95 transition-transform glow-sprout"
          style={{
            background: "linear-gradient(135deg, var(--sprout), var(--sprout-glow))",
            color: "var(--primary-foreground)",
          }}
        >
          {isLast ? "Fazer o quiz" : "Próxima"}
          <ArrowRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
