import { useEffect } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import type { Level } from "@/data/content";
import { useTTS } from "@/hooks/useTTS";
import { playComplete } from "@/lib/sound";
import { Plant } from "./Plant";
import { Sprout } from "./Sprout";

type Props = {
  level: Level;
  nextLevel?: Level;
  onNextLevel: () => void;
  onMap: () => void;
};

/** Shown once, when the last phase of a level is passed: the level's tree is complete. */
export function TreeComplete({ level, nextLevel, onNextLevel, onMap }: Props) {
  const { speakLater } = useTTS();

  useEffect(() => {
    playComplete(true);
    const cancel = speakLater("You did it!", 600, { rate: 0.8, pitch: 1.35 });
    const fire = (n: number, spread: number, y: number) =>
      confetti({ particleCount: n, spread, startVelocity: 45, origin: { y }, colors: ["#22c55e", "#f59e0b", "#ec4899", "#e53935", "#fff"] });
    fire(120, 80, 0.6);
    const t = setTimeout(() => fire(140, 120, 0.5), 450);
    return () => {
      cancel();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4"
      style={{ background: "radial-gradient(circle at 50% 30%, #fff6c9 0%, #dff4ff 55%, #9fdcff 100%)" }}
      data-testid="tree-complete"
    >
      <motion.div initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 140, damping: 12 }}>
        <Plant stage={level.phaseIds.length} stages={level.phaseIds.length} kind={level.tree} size={260} />
      </motion.div>
      <Sprout size={72} mood="love" className="animate-float -mt-6" />
      <div>
        <p className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">{level.title} concluído</p>
        <h1 className="text-3xl font-bold mt-1" style={{ color: "var(--sprout-ink)" }}>
          Você completou a {level.treeName}! 🎉
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Do broto pequenininho até a árvore, fase por fase.</p>
      </div>
      <div className="w-full max-w-sm space-y-3 mt-2" style={{ marginBottom: "var(--safe-bottom)" }}>
        {nextLevel && (
          <button
            onClick={onNextLevel}
            className="w-full rounded-2xl py-4 font-extrabold text-lg transition-transform btn-3d"
            style={{ background: "linear-gradient(135deg, var(--sprout), var(--sprout-glow))", color: "var(--primary-foreground)" }}
          >
            Ir para o {nextLevel.title} →
          </button>
        )}
        <button onClick={onMap} className="w-full rounded-2xl py-3 font-bold bg-card btn-3d btn-3d-soft">
          Ver minha {level.treeName}
        </button>
      </div>
    </div>
  );
}
