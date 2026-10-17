import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Pause, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Story } from "@/data/stories";
import { getWord } from "@/data/content";
import { useTTS } from "@/hooks/useTTS";

type Props = {
  story: Story;
  onBack: () => void;
};

export function StoryReader({ story, onBack }: Props) {
  const [page, setPage] = useState(0);
  const [showPt, setShowPt] = useState(true);
  const { speak, stop, speaking, supported } = useTTS();
  const total = story.pages.length;
  const current = story.pages[page];

  // Auto-stop speaking when navigating
  useEffect(() => () => stop(), [stop]);

  const handleSpeak = () => {
    if (speaking) {
      stop();
      return;
    }
    speak(current.en, { rate: 0.7, pitch: 1.15 });
  };

  const next = () => {
    stop();
    if (page < total - 1) setPage((p) => p + 1);
  };
  const prev = () => {
    stop();
    if (page > 0) setPage((p) => p - 1);
  };

  // Tokenize the english sentence so we can highlight learned words.
  const tokens = useMemo(() => {
    const hi = new Set((current.highlight ?? []).map((id) => getWord(id)?.en.toLowerCase()).filter(Boolean) as string[]);
    return current.en.split(/(\s+|[.,!?])/).map((t, i) => {
      const clean = t.toLowerCase().replace(/[.,!?]/g, "");
      const isHi = hi.has(clean);
      return { t, isHi, key: i };
    });
  }, [current]);

  return (
    <div className="min-h-screen bg-aurora pb-8 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-background/60 border-b border-border">
        <div className="mx-auto max-w-md px-5 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="size-10 rounded-full bg-card flex items-center justify-center active:scale-95"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              Página {page + 1} de {total}
            </p>
            <h1 className="text-base font-bold leading-tight truncate">{story.titlePt}</h1>
          </div>
          <button
            onClick={() => setShowPt((v) => !v)}
            className="text-xs font-bold px-3 py-2 rounded-full bg-card active:scale-95"
            aria-pressed={showPt}
          >
            PT {showPt ? "✓" : ""}
          </button>
        </div>
        {/* Progress */}
        <div className="h-1 bg-border/40">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((page + 1) / total) * 100}%` }}
          />
        </div>
      </header>

      {/* Illustration card */}
      <div className="mx-auto w-full max-w-md px-5 pt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-card"
            style={{ background: current.bg }}
          >
            {current.illustration.map((it, i) => (
              <motion.span
                key={`${page}-${i}`}
                initial={{ opacity: 0, scale: 0.4, y: 12 }}
                animate={{ opacity: it.opacity ?? 1, scale: 1, y: 0 }}
                transition={{
                  delay: 0.05 + i * 0.07,
                  type: "spring",
                  stiffness: 220,
                  damping: 16,
                }}
                style={{
                  position: "absolute",
                  left: `${it.x}%`,
                  top: `${it.y}%`,
                  fontSize: it.size ?? 56,
                  transform: `translate(-50%, -50%) rotate(${it.rotate ?? 0}deg)`,
                  filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.25))",
                  lineHeight: 1,
                  userSelect: "none",
                }}
                aria-hidden
              >
                {it.emoji}
              </motion.span>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`txt-${page}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-5 rounded-3xl bg-card p-5"
          >
            <p
              className="text-2xl font-bold leading-snug text-balance"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              {tokens.map(({ t, isHi, key }) =>
                isHi ? (
                  <span
                    key={key}
                    className="px-1 rounded-md"
                    style={{
                      background: "color-mix(in oklab, var(--primary) 22%, transparent)",
                      color: "var(--primary)",
                    }}
                  >
                    {t}
                  </span>
                ) : (
                  <span key={key}>{t}</span>
                ),
              )}
            </p>
            {showPt && (
              <p className="mt-2 text-base text-muted-foreground italic">{current.pt}</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="mt-6 mx-auto w-full max-w-md px-5 flex items-center gap-3">
        <button
          onClick={prev}
          disabled={page === 0}
          className="size-14 rounded-full bg-card flex items-center justify-center active:scale-95 disabled:opacity-30"
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-6" />
        </button>

        <button
          onClick={handleSpeak}
          disabled={!supported}
          className="flex-1 h-14 rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 text-primary-foreground"
          style={{
            background:
              "linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary) 80%, var(--accent)))",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          {speaking ? <Pause className="size-5" /> : <Volume2 className="size-5" />}
          {speaking ? "Pausar" : "Ouvir"}
        </button>

        <button
          onClick={next}
          disabled={page === total - 1}
          className="size-14 rounded-full bg-card flex items-center justify-center active:scale-95 disabled:opacity-30"
          aria-label="Próxima página"
        >
          <ChevronRight className="size-6" />
        </button>
      </div>

      {page === total - 1 && (
        <div className="mt-5 mx-auto w-full max-w-md px-5">
          <button
            onClick={onBack}
            className="w-full h-12 rounded-full bg-card font-bold active:scale-95"
          >
            ✨ Fim — voltar para histórias
          </button>
        </div>
      )}
    </div>
  );
}
