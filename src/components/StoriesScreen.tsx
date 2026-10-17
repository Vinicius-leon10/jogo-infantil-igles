import { useMemo } from "react";
import { ArrowLeft, BookOpen, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { phases } from "@/data/content";
import { useProgress } from "@/hooks/useProgress";
import { stories, getStoriesForLearned, type Story } from "@/data/stories";
import { getWord } from "@/data/content";

type Props = {
  onBack: () => void;
  onOpenStory: (story: Story) => void;
};

export function StoriesScreen({ onBack, onOpenStory }: Props) {
  const { progress } = useProgress();

  const learnedIds = useMemo(() => {
    const set = new Set<string>();
    for (const p of phases) {
      const r = progress.phases[p.id];
      if (r?.completed) {
        for (const id of p.learnWordIds) set.add(id);
        for (const id of p.quizWordIds) set.add(id);
      }
    }
    return set;
  }, [progress.phases]);

  const list = useMemo(() => getStoriesForLearned(learnedIds), [learnedIds]);
  const unlockedCount = list.filter((x) => x.unlocked).length;

  return (
    <div className="min-h-screen bg-aurora pb-24">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-background/60 border-b border-border">
        <div className="mx-auto max-w-md px-5 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="size-10 rounded-full bg-card flex items-center justify-center active:scale-95"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold leading-tight">Histórias</h1>
            <p className="text-[11px] text-muted-foreground">
              {unlockedCount} de {stories.length} liberadas
            </p>
          </div>
          <BookOpen className="size-6 text-primary" />
        </div>
      </header>

      <div className="mx-auto max-w-md px-5 pt-5">
        <div className="mb-5 rounded-3xl p-5 bg-card glow-sprout">
          <h2 className="text-xl font-bold leading-tight">
            Leia, ouça e brote 🌱
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Mini-histórias com as palavras que você já aprendeu. Aperte
            <span className="font-bold text-foreground"> Ouvir </span>
            para escutar.
          </p>
        </div>

        <ul className="space-y-4">
          {list.map(({ story, unlocked, missing }, idx) => (
            <motion.li
              key={story.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
            >
              <button
                onClick={() => unlocked && onOpenStory(story)}
                disabled={!unlocked}
                className={`w-full text-left rounded-3xl p-4 transition-all ${
                  unlocked
                    ? "bg-card hover:scale-[1.01] active:scale-95 cursor-pointer"
                    : "bg-card/40 cursor-not-allowed"
                }`}
                style={
                  unlocked
                    ? { boxShadow: "0 10px 30px -12px rgba(0,0,0,0.45)" }
                    : undefined
                }
              >
                <div className="flex items-center gap-4">
                  <div
                    className="size-20 shrink-0 rounded-2xl flex items-center justify-center text-5xl shadow-lg"
                    style={{
                      background: unlocked ? story.cover : "var(--muted)",
                      opacity: unlocked ? 1 : 0.5,
                    }}
                  >
                    {unlocked ? story.emoji : <Lock className="size-6 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      {story.pages.length} páginas
                    </p>
                    <h3 className="text-base font-bold truncate">{story.titlePt}</h3>
                    <p className="text-xs text-muted-foreground italic truncate">
                      {story.titleEn}
                    </p>
                    {!unlocked && missing.length > 0 && (
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        Aprenda primeiro:{" "}
                        <span className="font-semibold text-foreground">
                          {missing
                            .slice(0, 3)
                            .map((id) => getWord(id)?.en ?? id)
                            .join(", ")}
                          {missing.length > 3 ? "…" : ""}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </button>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
