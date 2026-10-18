import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isLevelUnlocked, phases as allPhases, previousPhaseId, unlockEverything } from "@/data/content";
import { readJSON, writeJSON } from "@/lib/storage";
import { starsFor, xpFor } from "@/lib/scoring";

const KEY = "sprout-progress-v2";

export type PhaseResult = {
  stars: 0 | 1 | 2 | 3;
  bestScore: number;
  completed: boolean;
  /** ms taken in the most recent attempt of this phase */
  lastDurationMs?: number;
  /** fastest successful run, in ms */
  bestDurationMs?: number;
  /** sum of all attempt durations, in ms */
  totalDurationMs?: number;
  /** number of attempts (any score) */
  attempts?: number;
};

export type Progress = {
  phases: Record<number, PhaseResult>;
  xp: number;
  streak: number;
  lastPlayed?: string;
  /** Word ids the child got wrong, with a count (for SRS weighting). */
  wrongWords: Record<string, number>;
};

const empty: Progress = { phases: {}, xp: 0, streak: 0, wrongWords: {} };

function load(): Progress {
  const p = readJSON<Partial<Progress>>(KEY);
  return p ? { ...empty, ...p } : empty;
}

type ProgressState = {
  progress: Progress;
  ready: boolean;
  recordPhase: (
    phaseId: number,
    score: number,
    required: number,
    wrongIds?: string[],
    correctIds?: string[],
    durationMs?: number,
  ) => { stars: 0 | 1 | 2 | 3; completed: boolean };
  isUnlocked: (phaseId: number) => boolean;
  reset: () => void;
};

const ProgressContext = createContext<ProgressState | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(empty);
  const [ready, setReady] = useState(false);
  const progressRef = useRef<Progress>(empty);

  // Read after mount to avoid touching localStorage during the first render.
  useEffect(() => {
    const local = load();
    progressRef.current = local;
    setProgress(local);
    setReady(true);
  }, []);

  const persist = useCallback((next: Progress) => {
    progressRef.current = next;
    setProgress(next);
    writeJSON(KEY, next);
  }, []);

  const recordPhase = useCallback<ProgressState["recordPhase"]>(
    (phaseId, score, required, wrongIds = [], correctIds = [], durationMs = 0) => {
      const progress = progressRef.current;
      const stars = starsFor(score);
      const completed = score >= required;
      const prev = progress.phases[phaseId];
      const bestScore = Math.max(prev?.bestScore ?? 0, score);
      const bestStars = Math.max(prev?.stars ?? 0, stars) as 0 | 1 | 2 | 3;

      const today = new Date().toISOString().slice(0, 10);
      const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      let streak = progress.streak || 0;
      if (progress.lastPlayed === today) {
        // same day
      } else if (progress.lastPlayed === yest) {
        streak += 1;
      } else {
        streak = 1;
      }

      const wrongWords = { ...(progress.wrongWords || {}) };
      for (const id of wrongIds) wrongWords[id] = (wrongWords[id] || 0) + 2;
      for (const id of correctIds) {
        if (wrongWords[id]) {
          wrongWords[id] = Math.max(0, wrongWords[id] - 1);
          if (!wrongWords[id]) delete wrongWords[id];
        }
      }

      // Duration tracking
      const safeDur = Math.max(0, Math.round(durationMs));
      const prevBest = prev?.bestDurationMs;
      const newBest =
        safeDur > 0 && completed
          ? prevBest
            ? Math.min(prevBest, safeDur)
            : safeDur
          : prevBest;

      const next: Progress = {
        ...progress,
        phases: {
          ...progress.phases,
          [phaseId]: {
            stars: bestStars,
            bestScore,
            completed: completed || (prev?.completed ?? false),
            lastDurationMs: safeDur || prev?.lastDurationMs,
            bestDurationMs: newBest,
            totalDurationMs: (prev?.totalDurationMs ?? 0) + safeDur,
            attempts: (prev?.attempts ?? 0) + 1,
          },
        },
        xp: (progress.xp || 0) + xpFor(score, completed),
        streak,
        lastPlayed: today,
        wrongWords,
      };
      persist(next);
      return { stars, completed };
    },
    [persist],
  );

  const isUnlocked = useCallback(
    (phaseId: number) => {
      if (unlockEverything) return true;
      const done = (id: number) => !!progress.phases[id]?.completed;
      const prev = previousPhaseId(phaseId);
      if (prev !== null) return done(prev);
      const level = allPhases.find((p) => p.id === phaseId)?.level ?? 1;
      return isLevelUnlocked(level, done);
    },
    [progress],
  );

  const reset = useCallback(() => persist(empty), [persist]);

  return (
    <ProgressContext.Provider value={{ progress, ready, recordPhase, isUnlocked, reset }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
