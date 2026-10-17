import { Lock, Menu, Star, Flame, BookOpen, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { isLevelUnlocked as levelUnlocked, levels, phases } from "@/data/content";
import { useProgress } from "@/hooks/useProgress";
import { Sprout } from "./Sprout";
import { MusicToggle } from "./MusicToggle";

type Props = {
  onSelectLevel: (id: number) => void;
  onOpenParents?: () => void;
  onOpenStories?: () => void;
};

export function LevelsScreen({ onSelectLevel, onOpenParents, onOpenStories }: Props) {
  const { progress } = useProgress();

  const isLevelUnlocked = (levelId: number) =>
    levelUnlocked(levelId, (id) => !!progress.phases[id]?.completed);

  return (
    <div className="min-h-screen bg-aurora pb-24">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-background/60 border-b border-border">
        <div className="mx-auto max-w-md px-5 py-4 flex items-center gap-3">
          <button
            onClick={onOpenParents}
            className="size-10 rounded-full bg-card flex items-center justify-center active:scale-95"
            aria-label="Área dos pais"
          >
            <Menu className="size-5" />
          </button>
          <Sprout size={40} mood="happy" className="animate-float" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold leading-tight truncate">Sprout</h1>
            <p className="text-[10px] text-muted-foreground truncate">Escolha um nível</p>
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
          <p className="text-sm text-muted-foreground">Pronto para brotar?</p>
          <h2 className="text-2xl font-bold">Escolha seu nível 🌱</h2>
        </div>

        <MusicToggle />

        <ul className="space-y-4">
          {levels.map((level, idx) => {
            const unlocked = isLevelUnlocked(level.id);
            const totalPhases = level.phaseIds.length;
            const done = level.phaseIds.filter((id) => progress.phases[id]?.completed).length;
            const stars = level.phaseIds.reduce(
              (sum, id) => sum + (progress.phases[id]?.stars ?? 0),
              0,
            );
            const pct = totalPhases ? Math.round((done / totalPhases) * 100) : 0;

            return (
              <motion.li
                key={level.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.35 }}
              >
                <button
                  onClick={() => unlocked && onSelectLevel(level.id)}
                  disabled={!unlocked}
                  className={`w-full rounded-3xl p-5 text-left transition-all
                    ${unlocked ? "bg-card hover:scale-[1.02] active:scale-95" : "bg-card/40 cursor-not-allowed"}
                  `}
                  style={
                    unlocked
                      ? {
                          boxShadow: `0 10px 40px -12px ${level.color}`,
                          background: `linear-gradient(135deg, color-mix(in oklab, ${level.color} 12%, var(--card)), var(--card))`,
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="size-16 shrink-0 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                      style={{
                        background: unlocked
                          ? `linear-gradient(135deg, ${level.color}, color-mix(in oklab, ${level.color} 60%, white))`
                          : "var(--muted)",
                        opacity: unlocked ? 1 : 0.5,
                      }}
                    >
                      {unlocked ? level.emoji : <Lock className="size-6 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                        Nível {level.id}
                      </div>
                      <h3 className="font-bold text-lg leading-tight">{level.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">{level.subtitle}</p>
                      {unlocked && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                background: `linear-gradient(90deg, ${level.color}, color-mix(in oklab, ${level.color} 60%, white))`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                            {done}/{totalPhases}
                          </span>
                        </div>
                      )}
                      {unlocked && stars > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] font-bold" style={{ color: "var(--amber)" }}>
                          <Star className="size-3 fill-current" />
                          {stars}
                        </div>
                      )}
                    </div>
                    {unlocked && <ChevronRight className="size-5 text-muted-foreground" />}
                  </div>
                </button>
              </motion.li>
            );
          })}
        </ul>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {phases.length} fases no total · novos níveis em breve · versão {__APP_VERSION__}
        </p>
      </div>
    </div>
  );
}
