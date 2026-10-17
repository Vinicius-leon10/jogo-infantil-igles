import { Home, RotateCcw, Star } from "lucide-react";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import type { Phase } from "@/data/content";
import { Sprout } from "./Sprout";
import { useTTS } from "@/hooks/useTTS";
import { playComplete } from "@/lib/sound";
import { phaseNumber } from "@/data/content";

const PRAISE = ["Great job!", "Awesome!", "Well done!", "Fantastic!", "Amazing!", "You did it!"];

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
  const mood = stars >= 2 ? "love" : stars >= 1 ? "excited" : "happy";
  const { speakLater } = useTTS();

  useEffect(() => {
    playComplete(passed);
    if (!passed) return;
    const praise = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    const cancelPraise = speakLater(praise, 350, { rate: 0.8, pitch: 1.35 });

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

    return cancelPraise;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const title = !passed
    ? "Quase lá!"
    : stars === 3
      ? "Incrível!"
      : stars === 2
        ? "Muito bem!"
        : "Você passou!";

  const message = !passed
    ? "Seu brotinho precisa de mais um pouquinho de água. Tente de novo!"
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
          <Sprout size={180} mood={mood} className="animate-float" />
        </div>

        <h1 className="mt-6 text-5xl font-bold text-balance">{title}</h1>
        <p className="mt-3 text-muted-foreground text-balance max-w-xs">{message}</p>

        {/* stars */}
        <div className="mt-8 flex gap-3">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`animate-pop`}
              style={{ animationDelay: `${s * 200}ms`, animationFillMode: "both" }}
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

        <div className="mt-6 text-4xl font-bold tabular-nums" style={{ color: "var(--sprout)" }}>
          {score}%
        </div>
      </div>

      <div className="w-full max-w-md space-y-3 pt-6">
        {passed ? (
          <button
            onClick={onHome}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-lg active:scale-95 transition-transform glow-sprout"
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
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-lg active:scale-95 transition-transform glow-sprout"
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
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-card py-4 font-semibold active:scale-95 transition-transform"
        >
          <Home className="size-5" />
          Mapa de fases
        </button>
      </div>
    </div>
  );
}
