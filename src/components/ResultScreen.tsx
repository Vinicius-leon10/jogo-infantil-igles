import { Home, RotateCcw, Star } from "lucide-react";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import type { Phase } from "@/data/content";
import { Sprout } from "./Sprout";
import { useTTS } from "@/hooks/useTTS";
import { playComplete, playStar } from "@/lib/sound";
import { getQuizWords, phaseNumber } from "@/data/content";
import { Emoji } from "./Emoji";

// Each has a recording in src/assets/voice/ (scripts/make-voices.mjs), so it plays in the app's voice.
const PRAISE = ["Great job!", "Awesome!", "Well done!", "Fantastic!", "Amazing!", "You did it!"];
const STAR_DELAY_MS = 450;

type Props = {
  phase: Phase;
  score: number;
  stars: 0 | 1 | 2 | 3;
  passed: boolean;
  xpGained: number;
  onRetry: () => void;
  onHome: () => void;
};

export function ResultScreen({ phase, score, stars, passed, xpGained, onRetry, onHome }: Props) {
  const perfect = passed && score === 100;
  const mood = stars >= 2 ? "love" : stars >= 1 ? "excited" : "happy";
  const { speak, speakLater } = useTTS();
  // The phase's words, once each, to tap and hear again.
  const words = getQuizWords(phase).filter((w, i, all) => all.findIndex((o) => o.id === w.id) === i);

  useEffect(() => {
    playComplete(passed);
    if (!passed) return;
    // Each star "dings" as it pops in.
    const starTimers = Array.from({ length: stars }, (_, i) =>
      setTimeout(() => playStar(i), 600 + (i + 1) * STAR_DELAY_MS),
    );
    // The praise comes alone, after the fanfare and the last star's chime: on top of them it was hard to hear.
    const praise = perfect ? "Perfect!" : PRAISE[Math.floor(Math.random() * PRAISE.length)];
    const cancelPraise = speakLater(praise, 600 + stars * STAR_DELAY_MS + 500, { rate: 0.8, pitch: 1.35 });

    const fire = (particles: number, spread: number, originY: number) =>
      confetti({
        particleCount: particles,
        spread,
        startVelocity: 45,
        origin: { y: originY },
        colors: ["#22c55e", "#f59e0b", "#ec4899", "#6366f1", "#06b6d4"],
      });
    fire(80 + stars * 40, 70, 0.6);
    if (stars >= 2) setTimeout(() => fire(60, 100, 0.7), 250);
    if (stars === 3) setTimeout(() => fire(120, 120, 0.5), 500);
    // 100%: confetti cannons from both sides once the stars are in.
    const sides = perfect
      ? [0, 1].map((x) =>
          setTimeout(
            () =>
              confetti({
                particleCount: 90,
                angle: x ? 120 : 60,
                spread: 60,
                startVelocity: 60,
                origin: { x, y: 0.75 },
                colors: ["#58cc02", "#ffc93c", "#ff7aa8", "#4fb3ff", "#ffb020"],
              }),
            600 + 3 * STAR_DELAY_MS + 150,
          ),
        )
      : [];

    return () => {
      cancelPraise();
      [...starTimers, ...sides].forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const title = !passed
    ? "Quase lá!"
    : perfect
      ? "Perfeito!"
      : stars === 3
      ? "Incrível!"
      : stars === 2
        ? "Muito bem!"
        : "Você passou!";

  const message = !passed
    ? "Seu brotinho precisa de mais um pouquinho de água. Tente de novo!"
    : perfect
      ? `Você acertou todas! +${xpGained} XP`
      : `Você alimentou seu broto com inglês novo. +${xpGained} XP`;

  return (
    <div className="min-h-screen bg-aurora flex flex-col items-center justify-between px-6 py-10 text-center">
      <div className="pt-6">
        <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">
          Fase {phaseNumber(phase.id)} · {phase.title}
        </span>
      </div>

      <div className="flex flex-col items-center">
        {/* sparkles */}
        <div className="relative">
          {passed && (
            <>
              <span className="absolute -top-2 -left-6 text-2xl animate-sparkle">✨</span>
              <span className="absolute -top-4 right-2 text-xl animate-sparkle" style={{ animationDelay: "0.4s" }}>⭐</span>
              <span className="absolute -bottom-2 -right-8 text-2xl animate-sparkle" style={{ animationDelay: "0.8s" }}>✨</span>
              <span className="absolute -bottom-4 left-0 text-xl animate-sparkle" style={{ animationDelay: "1.2s" }}>💫</span>
            </>
          )}
          <Sprout size={passed ? 150 : 180} mood={mood} className={perfect ? "animate-hop" : "animate-float"} />
        </div>

        <h1 className="mt-5 text-5xl font-bold text-balance">{title}</h1>
        <p className="mt-3 text-muted-foreground text-balance max-w-xs">{message}</p>

        {/* stars */}
        <div className="mt-8 flex gap-3">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`animate-pop`}
              style={{ animationDelay: `${600 + s * STAR_DELAY_MS}ms`, animationFillMode: "both" }}
            >
              <Star
                className={`size-14 transition-all ${s <= stars ? "fill-current drop-shadow-lg" : ""}`}
                style={{
                  color: s <= stars ? "var(--amber)" : "var(--muted)",
                  filter: s <= stars ? "drop-shadow(0 0 20px var(--amber))" : undefined,
                }}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 text-4xl font-bold tabular-nums" style={{ color: "var(--sprout-ink)" }}>
          {score}%
        </div>

        {passed && (
          <div className="mt-5 flex flex-wrap justify-center gap-2 max-w-sm" data-testid="result-words">
            {words.map((w, i) => (
              <button
                key={w.id}
                onClick={() => speak(w.en)}
                aria-label={`Ouvir ${w.en}`}
                className="relative rounded-2xl bg-card p-1 btn-3d btn-3d-soft animate-pop"
                style={{ animationDelay: `${600 + 3 * STAR_DELAY_MS + i * 90}ms`, animationFillMode: "both" }}
              >
                <span className="text-3xl"><Emoji char={w.emoji} label={w.en} /></span>
                <span
                  className="absolute -top-1.5 -right-1.5 size-5 rounded-full text-[11px] font-extrabold flex items-center justify-center"
                  style={{ background: "var(--sprout)", color: "var(--primary-foreground)" }}
                  aria-hidden="true"
                >
                  ✓
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full max-w-md space-y-3 pt-6">
        {passed ? (
          <button
            onClick={onHome}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-lg transition-transform btn-3d"
            style={{
              background: "linear-gradient(135deg, var(--sprout), var(--sprout-glow))",
              color: "var(--primary-foreground)",
            }}
          >
            Continuar a jornada
          </button>
        ) : (
          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-lg transition-transform btn-3d"
            style={{
              background: "linear-gradient(135deg, var(--sprout), var(--sprout-glow))",
              color: "var(--primary-foreground)",
            }}
          >
            <RotateCcw className="size-5" />
            Tentar de novo
          </button>
        )}
        <button
          onClick={onHome}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-card py-4 font-bold btn-3d btn-3d-soft"
        >
          <Home className="size-5" />
          Mapa de fases
        </button>
      </div>
    </div>
  );
}
