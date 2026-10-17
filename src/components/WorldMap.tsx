import { ArrowLeft, Lock, Star, Flame, BookOpen } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { phases as allPhases, levels } from "@/data/content";
import { useProgress } from "@/hooks/useProgress";
import { Sprout } from "./Sprout";
import { Emoji } from "./Emoji";
import { MusicToggle } from "./MusicToggle";

type Props = {
  levelId: number;
  onSelectPhase: (id: number) => void;
  onBackToLevels: () => void;
  onOpenStories?: () => void;
};

export function WorldMap({ levelId, onSelectPhase, onBackToLevels, onOpenStories }: Props) {
  const { progress, isUnlocked } = useProgress();
  const level = levels.find((l) => l.id === levelId) ?? levels[0];
  const phases = allPhases.filter((p) => p.level === level.id);

  const currentPhase = (() => {
    for (const p of phases) {
      if (isUnlocked(p.id) && !progress.phases[p.id]?.completed) return p.id;
    }
    return phases[phases.length - 1].id;
  })();

  const containerRef = useRef<HTMLDivElement>(null);
  const phaseRefs = useRef<Record<number, HTMLLIElement | null>>({});
  const [sprout, setSprout] = useState<{ top: number; left: number; side: "left" | "right" } | null>(null);
  const [walking, setWalking] = useState(false);
  const prevPhase = useRef<number>(currentPhase);
  const didInitialScroll = useRef(false);

  useLayoutEffect(() => {
    const el = phaseRefs.current[currentPhase];
    const container = containerRef.current;
    if (!el || !container) return;
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    const idx = phases.findIndex((p) => p.id === currentPhase);
    const side: "left" | "right" = idx % 2 === 0 ? "right" : "left";
    const SIZE = 56;
    const PAD = 4;
    const top = eRect.top - cRect.top + eRect.height / 2 - SIZE / 2;
    const rawLeft =
      side === "right"
        ? eRect.right - cRect.left + 6
        : eRect.left - cRect.left - SIZE - 6;
    const maxLeft = cRect.width - SIZE - PAD;
    const left = Math.max(PAD, Math.min(rawLeft, maxLeft));
    setSprout({ top, left, side });
    if (prevPhase.current !== currentPhase) {
      setWalking(true);
      const t = setTimeout(() => setWalking(false), 1200);
      prevPhase.current = currentPhase;
      return () => clearTimeout(t);
    }
  }, [currentPhase, progress.phases]);

  // Auto-center on the current phase on mount so the child continues
  // from where they stopped.
  useEffect(() => {
    if (didInitialScroll.current) return;
    let cancelled = false;
    // Wait for the screen transition (AnimatePresence x:24 -> 0, ~280ms)
    // to finish so the element's final position is correct.
    const t = setTimeout(() => {
      if (cancelled) return;
      const el = phaseRefs.current[currentPhase];
      if (!el) return;
      didInitialScroll.current = true;
      const rect = el.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY;
      const target = absoluteTop - window.innerHeight / 2 + rect.height / 2;
      window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [currentPhase]);

  return (
    <div className="min-h-screen bg-aurora pb-32">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-background/60 border-b border-border">
        <div className="mx-auto max-w-md px-5 py-4 flex items-center gap-3">
          <button
            onClick={onBackToLevels}
            className="size-10 rounded-full bg-card flex items-center justify-center active:scale-95"
            aria-label="Voltar aos níveis"
          >
            <ArrowLeft className="size-5" />
          </button>
          <Sprout size={36} mood="happy" className="animate-float" />
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold leading-tight truncate">{level.title}</h1>
            <p className="text-[10px] text-muted-foreground truncate">{level.subtitle}</p>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            {onOpenStories && (
              <button
                onClick={onOpenStories}
                className="size-9 rounded-full bg-card flex items-center justify-center active:scale-95"
                aria-label="Histórias"
              >
                <BookOpen className="size-4 text-primary" />
              </button>
            )}
            <span className="flex items-center gap-1 font-bold" style={{ color: "var(--amber)" }}>
              <Star className="size-4 fill-current" />
              {progress.xp}
            </span>
            <span className="flex items-center gap-1 font-bold" style={{ color: "var(--pink)" }}>
              <Flame className="size-4 fill-current" />
              {progress.streak}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-md px-5 pt-6">
        <div className="mb-6 rounded-3xl p-5 bg-card glow-sprout">
          <p className="text-sm text-muted-foreground">Continue de onde parou,</p>
          <h2 className="text-2xl font-bold">Vamos brotar? 🌱</h2>
        </div>

        <MusicToggle />

        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Suas fases
        </h3>

        <div className="relative" ref={containerRef}>
          <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-1 bg-gradient-to-b from-primary/40 via-accent/40 to-primary/20 rounded-full" />

          {sprout && (
            <div
              className="pointer-events-none absolute z-20"
              style={{
                top: sprout.top,
                left: sprout.left,
                width: 56,
                height: 56,
                transition: "top 1.1s cubic-bezier(.6,.2,.2,1), left 1.1s cubic-bezier(.6,.2,.2,1)",
                transform: sprout.side === "left" ? "scaleX(-1)" : undefined,
              }}
              aria-hidden="true"
            >
              <div className={walking ? "" : "animate-float"} style={walking ? { animation: "float 0.45s ease-in-out infinite" } : undefined}>
                <Sprout size={56} mood="excited" />
              </div>
            </div>
          )}

          <ul className="space-y-5 relative">
            {phases.map((phase, idx) => {
              const result = progress.phases[phase.id];
              const unlocked = isUnlocked(phase.id);
              const stars = result?.stars ?? 0;
              const isReview = phase.type !== "learn";
              const side = idx % 2 === 0 ? "left" : "right";
              const isCurrent = phase.id === currentPhase;

              return (
                <li
                  key={phase.id}
                  ref={(el) => {
                    phaseRefs.current[phase.id] = el;
                  }}
                  className={`flex ${side === "left" ? "justify-start" : "justify-end"}`}
                >
                  <button
                    onClick={() => unlocked && onSelectPhase(phase.id)}
                    disabled={!unlocked}
                    className={`group relative w-[78%] rounded-3xl p-4 text-left transition-all
                      ${unlocked ? "bg-card hover:scale-[1.02] active:scale-95 cursor-pointer" : "bg-card/40 cursor-not-allowed"}
                      ${isReview && unlocked ? "ring-2 ring-accent/50" : ""}
                      ${isCurrent ? "ring-2 ring-primary glow-sprout" : ""}
                    `}
                    style={
                      unlocked
                        ? { boxShadow: `0 8px 30px -10px ${phase.color.startsWith("var") ? "rgb(0 0 0 / 0.4)" : phase.color}` }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="size-14 shrink-0 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                        style={{
                          background: unlocked
                            ? `linear-gradient(135deg, ${phase.color}, color-mix(in oklab, ${phase.color} 70%, white))`
                            : "var(--muted)",
                          opacity: unlocked ? 1 : 0.5,
                        }}
                      >
                        {unlocked ? <Emoji char={phase.emoji} /> : <Lock className="size-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                            Fase {phase.id}
                          </span>
                          {isReview && (
                            <span
                              className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                            >
                              {phase.type === "grand" ? "Final" : "Revisão"}
                            </span>
                          )}
                          {isCurrent && (
                            <span
                              className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                            >
                              Você
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-base truncate">{phase.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{phase.subtitle}</p>
                        {result && (
                          <div className="mt-1.5 flex gap-0.5">
                            {[1, 2, 3].map((s) => (
                              <Star
                                key={s}
                                className={`size-3.5 ${s <= stars ? "fill-current" : ""}`}
                                style={{ color: s <= stars ? "var(--amber)" : "var(--muted)" }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
