import { ArrowLeft, Play } from "lucide-react";
import type { Phase } from "@/data/content";
import { Sprout } from "./Sprout";
import { phaseNumber } from "@/data/content";

type Props = {
  phase: Phase;
  wordCount: number;
  onStart: () => void;
  onBack: () => void;
};

export function PhaseIntro({ phase, wordCount, onStart, onBack }: Props) {
  return (
    <div className="min-h-screen bg-aurora flex flex-col">
      <header className="px-5 py-4">
        <button
          onClick={onBack}
          className="size-10 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors btn-3d btn-3d-soft"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="relative animate-pop">
          <div
            className="absolute inset-0 blur-3xl opacity-50"
            style={{ background: phase.color }}
          />
          <div className="relative">
            <Sprout size={160} mood="excited" className="animate-float" />
          </div>
        </div>

        <span className="mt-6 text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">
          Fase {phaseNumber(phase.id)} {phase.type === "review" ? "· Revisão" : phase.type === "grand" ? "· Final" : ""}
        </span>
        <h1 className="mt-2 text-4xl font-bold text-balance">{phase.title}</h1>
        <p className="mt-2 text-muted-foreground text-balance max-w-xs">{phase.subtitle}</p>

        <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-xs">
          <div className="rounded-2xl bg-card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: "var(--sprout-ink)" }}>{wordCount}</p>
            <p className="text-xs text-muted-foreground">palavras</p>
          </div>
          <div className="rounded-2xl bg-card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: "var(--amber)" }}>{phase.requiredScore}%</p>
            <p className="text-xs text-muted-foreground">para passar</p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-10 pt-4">
        <button
          onClick={onStart}
          className="w-full max-w-md mx-auto flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-lg btn-3d transition-transform active:scale-95"
          style={{
            background: "linear-gradient(135deg, var(--sprout), var(--sprout-glow))",
            color: "var(--primary-foreground)",
          }}
        >
          <Play className="size-5 fill-current" />
          Começar a brotar
        </button>
      </div>
    </div>
  );
}
