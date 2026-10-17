import { ArrowLeft, Lock, Star, Flame, BookOpen, ChevronRight } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { phases as allPhases, levels, phaseNumber } from "@/data/content";
import { useProgress } from "@/hooks/useProgress";
import { Sprout } from "./Sprout";
import { Plant } from "./Plant";
import { MusicToggle } from "./MusicToggle";

type Props = {
  levelId: number;
  onSelectPhase: (id: number) => void;
  onBackToLevels: () => void;
  onOpenStories?: () => void;
  onSelectLevel?: (id: number) => void;
};

// Night sky at the top fading into a meadow and soil at the bottom, where phase 1 starts.
const TERRAIN = `
  radial-gradient(2px 2px at 12% 4%, #fff9 50%, transparent 51%),
  radial-gradient(1.5px 1.5px at 30% 9%, #fff8 50%, transparent 51%),
  radial-gradient(2px 2px at 72% 3%, #fffa 50%, transparent 51%),
  radial-gradient(1.5px 1.5px at 88% 11%, #fff7 50%, transparent 51%),
  radial-gradient(1.5px 1.5px at 55% 14%, #fff6 50%, transparent 51%),
  linear-gradient(180deg, #151a3d 0%, #1b2950 18%, #1d3b45 40%, #1f4a35 62%, #26582e 82%, #3a2a1e 100%)`;

export function WorldMap({ levelId, onSelectPhase, onBackToLevels, onOpenStories, onSelectLevel }: Props) {
  const { progress, isUnlocked } = useProgress();
  const level = levels.find((l) => l.id === levelId) ?? levels[0];
  const phases = allPhases.filter((p) => p.level === level.id);
  const stages = phases.length;
  const lastPhase = phases[phases.length - 1];
  const treeDone = !!progress.phases[lastPhase.id]?.completed;
  const nextLevel = levels.find((l) => l.id === level.id + 1);

  const currentPhase = (() => {
    for (const p of phases) {
      if (isUnlocked(p.id) && !progress.phases[p.id]?.completed) return p.id;
    }
    return lastPhase.id;
  })();

  const containerRef = useRef<HTMLDivElement>(null);
  const phaseRefs = useRef<Record<number, HTMLLIElement | null>>({});
  const plotRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [trail, setTrail] = useState<{ d: string; w: number; h: number } | null>(null);
  const [sprout, setSprout] = useState<{ top: number; left: number } | null>(null);
  const [walking, setWalking] = useState(false);
  const prevPhase = useRef<number>(currentPhase);
  const didInitialScroll = useRef(false);

  // Dirt trail winding through the plants (bottom to top) and the mascot next to the current one.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      const c = container.getBoundingClientRect();
      const pts = phases
        .map((p) => plotRefs.current[p.id]?.getBoundingClientRect())
        .filter((r): r is DOMRect => !!r)
        .map((r) => [r.left - c.left + r.width / 2, r.top - c.top + r.height * 0.62] as const);
      if (pts.length) {
        let d = `M${pts[0][0]} ${c.height}L${pts[0][0]} ${pts[0][1]}`;
        for (let i = 1; i < pts.length; i++) {
          const [x0, y0] = pts[i - 1];
          const [x1, y1] = pts[i];
          const dy = (y0 - y1) / 2;
          d += `C${x0} ${y0 - dy} ${x1} ${y1 + dy} ${x1} ${y1}`;
        }
        setTrail({ d, w: c.width, h: c.height });
      }
      const plot = plotRefs.current[currentPhase]?.getBoundingClientRect();
      if (plot) setSprout({ top: plot.top - c.top - 34, left: Math.min(c.width - 56, plot.right - c.left - 22) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    if (prevPhase.current !== currentPhase) {
      setWalking(true);
      prevPhase.current = currentPhase;
      const t = setTimeout(() => setWalking(false), 1200);
      return () => {
        clearTimeout(t);
        ro.disconnect();
      };
    }
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhase, progress.phases, level.id]);

  // Start centred on the current phase (phase 1 is at the bottom).
  useEffect(() => {
    if (didInitialScroll.current) return;
    let cancelled = false;
    // Wait for the screen transition (~280 ms) so the final position is measured.
    const t = setTimeout(() => {
      if (cancelled) return;
      const el = phaseRefs.current[currentPhase];
      if (!el) return;
      didInitialScroll.current = true;
      const rect = el.getBoundingClientRect();
      const target = rect.top + window.scrollY - window.innerHeight / 2 + rect.height / 2;
      window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [currentPhase]);

  return (
    <div className="min-h-screen pb-10" style={{ background: TERRAIN, backgroundColor: "#151a3d" }}>
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border">
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
        {/* The level's tree, waiting at the top of the trail. */}
        <section className="text-center mb-4" data-testid="tree-goal">
          <div className={treeDone ? "animate-float" : ""}>
            <Plant stage={stages} stages={stages} kind={level.tree} size={190} dim={!treeDone} className="mx-auto" />
          </div>
          {treeDone ? (
            <>
              <h2 className="text-2xl font-bold">Sua {level.treeName} está completa! 🎉</h2>
              {nextLevel && onSelectLevel && (
                <button
                  onClick={() => onSelectLevel(nextLevel.id)}
                  className="mt-3 inline-flex items-center gap-1 rounded-full px-6 py-3 font-extrabold active:scale-95 glow-sprout"
                  style={{ background: "linear-gradient(135deg, var(--sprout), var(--sprout-glow))", color: "var(--primary-foreground)" }}
                >
                  Ir para o {nextLevel.title} <ChevronRight className="size-5" />
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground max-w-[16rem] mx-auto">
              Complete as {stages} fases para a sua <strong className="text-foreground">{level.treeName}</strong> crescer 🌱
            </p>
          )}
        </section>

        <div className="relative" ref={containerRef}>
          {trail && (
            <svg className="absolute inset-0 pointer-events-none" width={trail.w} height={trail.h} aria-hidden="true">
              <path d={trail.d} stroke="#5e3f2a" strokeWidth="34" fill="none" strokeLinecap="round" opacity="0.9" />
              <path d={trail.d} stroke="#8a5d3d" strokeWidth="24" fill="none" strokeLinecap="round" />
              <path d={trail.d} stroke="#b8875c" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="2 12" />
            </svg>
          )}

          {sprout && (
            <div
              className="pointer-events-none absolute z-20"
              style={{
                top: sprout.top,
                left: sprout.left,
                width: 56,
                height: 56,
                transition: "top 1.1s cubic-bezier(.6,.2,.2,1), left 1.1s cubic-bezier(.6,.2,.2,1)",
              }}
              aria-hidden="true"
            >
              <div className={walking ? "" : "animate-float"} style={walking ? { animation: "float 0.45s ease-in-out infinite" } : undefined}>
                <Sprout size={56} mood="excited" />
              </div>
            </div>
          )}

          {/* Last phase on top, phase 1 at the bottom: the child climbs as the plant grows. */}
          <ul className="space-y-5 relative">
            {[...phases].reverse().map((phase) => {
              const idx = phases.indexOf(phase);
              const result = progress.phases[phase.id];
              const unlocked = isUnlocked(phase.id);
              const stars = result?.stars ?? 0;
              const isCurrent = phase.id === currentPhase && !treeDone; // nothing left to do once the tree is complete
              const plantLeft = idx % 2 === 0;

              return (
                <li
                  key={phase.id}
                  ref={(el) => {
                    phaseRefs.current[phase.id] = el;
                  }}
                >
                  <button
                    onClick={() => unlocked && onSelectPhase(phase.id)}
                    disabled={!unlocked}
                    data-phase={phase.id}
                    className={`w-full flex items-center gap-3 text-left ${plantLeft ? "flex-row" : "flex-row-reverse"} ${
                      unlocked ? "active:scale-[0.98] cursor-pointer" : "cursor-not-allowed"
                    } transition-transform`}
                  >
                    <div
                      ref={(el) => {
                        plotRefs.current[phase.id] = el;
                      }}
                      className={`relative size-[104px] shrink-0 rounded-full flex items-end justify-center ${isCurrent ? "glow-sprout" : ""}`}
                      style={{
                        background: "radial-gradient(circle at 50% 70%, #2f6b34 0%, #1e4a27 65%, #173a20 100%)",
                        boxShadow: isCurrent ? "0 0 0 3px var(--sprout), 0 0 30px -4px var(--sprout-glow)" : "0 6px 16px -8px #0009",
                      }}
                    >
                      <Plant stage={idx + 1} stages={stages} kind={level.tree} size={100} dim={!unlocked} />
                      {!unlocked && (
                        <span className="absolute top-1 right-1 size-7 rounded-full bg-card/90 flex items-center justify-center">
                          <Lock className="size-3.5 text-muted-foreground" />
                        </span>
                      )}
                    </div>
                    <div
                      className={`flex-1 min-w-0 rounded-2xl p-3 backdrop-blur-sm ${unlocked ? "bg-card/80" : "bg-card/40"} ${
                        isCurrent ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                          Fase {phaseNumber(phase.id)}
                        </span>
                        {isCurrent && (
                          <span
                            className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                          >
                            Você
                          </span>
                        )}
                      </div>
                      <h4 className={`font-bold text-base truncate ${unlocked ? "" : "opacity-60"}`}>{phase.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{phase.subtitle}</p>
                      {result && (
                        <div className="mt-1 flex gap-0.5">
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
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Soil where the journey starts. */}
        <div className="mt-6 mb-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#d9b48f]">
          🌱 Início
        </div>

        <MusicToggle />
      </div>
    </div>
  );
}
