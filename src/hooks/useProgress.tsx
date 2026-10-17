import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isLevelUnlocked, phases as allPhases, previousPhaseId } from "@/data/content";
import { readJSON, supabase, writeJSON } from "@/lib/backend";
import { useAuth } from "./useAuth";

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

/** localStorage is scoped per account so switching accounts never mixes data. */
const keyFor = (userId: string) => `${KEY}:${userId}`;

function load(userId: string): Progress {
  const p = readJSON<Partial<Progress>>(keyFor(userId));
  return p ? { ...empty, ...p } : empty;
}

function minDefined(a?: number, b?: number) {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return Math.min(a, b);
}

function mergePhase(a: PhaseResult | undefined, b: PhaseResult): PhaseResult {
  if (!a) return b;
  const newer = (b.attempts ?? 0) > (a.attempts ?? 0) ? b : a;
  return {
    stars: Math.max(a.stars ?? 0, b.stars ?? 0) as 0 | 1 | 2 | 3,
    bestScore: Math.max(a.bestScore ?? 0, b.bestScore ?? 0),
    completed: !!(a.completed || b.completed),
    lastDurationMs: newer.lastDurationMs ?? a.lastDurationMs ?? b.lastDurationMs,
    bestDurationMs: minDefined(a.bestDurationMs, b.bestDurationMs),
    totalDurationMs: Math.max(a.totalDurationMs ?? 0, b.totalDurationMs ?? 0),
    attempts: Math.max(a.attempts ?? 0, b.attempts ?? 0),
  };
}

/** Merge local and cloud progress without losing any phase fields. */
function merge(local: Progress, cloud: Progress): Progress {
  const phases = { ...local.phases };
  for (const [pid, r] of Object.entries(cloud.phases || {})) {
    phases[+pid] = mergePhase(phases[+pid], r);
  }
  const lastPlayed = [local.lastPlayed, cloud.lastPlayed].filter(Boolean).sort().pop();
  return {
    phases,
    xp: Math.max(local.xp ?? 0, cloud.xp ?? 0),
    streak: Math.max(local.streak ?? 0, cloud.streak ?? 0),
    lastPlayed,
    wrongWords: { ...(local.wrongWords || {}), ...(cloud.wrongWords || {}) },
  };
}

type SyncState = "idle" | "saving" | "error";

type ProgressState = {
  progress: Progress;
  ready: boolean;
  sync: SyncState;
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
  const { user } = useAuth();
  const userId = user?.id;
  const [progress, setProgress] = useState<Progress>(empty);
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<SyncState>("idle");
  const progressRef = useRef<Progress>(empty);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ userId: string; data: Progress } | null>(null);

  const upload = useCallback(async () => {
    const job = pending.current;
    if (!supabase || !job) return;
    pending.current = null;
    setSync("saving");
    const { error } = await supabase
      .from("child_progress")
      .upsert({ user_id: job.userId, data: job.data }, { onConflict: "user_id" });
    if (error) {
      // Keep it queued so the next change or page hide retries it.
      if (!pending.current) pending.current = job;
      setSync("error");
    } else {
      setSync(pending.current ? "saving" : "idle");
    }
  }, []);

  const scheduleUpload = useCallback(
    (uid: string, data: Progress) => {
      if (!supabase || uid === "local") return;
      pending.current = { userId: uid, data };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(upload, 800);
    },
    [upload],
  );

  const apply = useCallback((uid: string, next: Progress) => {
    progressRef.current = next;
    setProgress(next);
    writeJSON(keyFor(uid), next);
  }, []);

  // Load local progress for the signed-in account, then merge the cloud copy.
  useEffect(() => {
    if (!userId) {
      progressRef.current = empty;
      setProgress(empty);
      setReady(false);
      return;
    }
    const local = load(userId);
    progressRef.current = local;
    setProgress(local);
    setReady(true);
    if (!supabase || userId === "local") return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("child_progress")
        .select("data")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setSync("error");
        return;
      }
      const cloud = (data?.data as Progress | undefined) ?? null;
      const merged = cloud ? merge(progressRef.current, cloud) : progressRef.current;
      apply(userId, merged);
      if (!cloud || JSON.stringify(cloud) !== JSON.stringify(merged)) {
        scheduleUpload(userId, merged);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, apply, scheduleUpload]);

  // Flush a pending upload when the page is hidden or closed.
  useEffect(() => {
    const flush = () => {
      if (pending.current) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        upload();
      }
    };
    const onVisibility = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [upload]);

  const persist = useCallback(
    (next: Progress) => {
      if (!userId) return;
      apply(userId, next);
      scheduleUpload(userId, next);
    },
    [userId, apply, scheduleUpload],
  );

  const recordPhase = useCallback<ProgressState["recordPhase"]>(
    (phaseId, score, required, wrongIds = [], correctIds = [], durationMs = 0) => {
      const progress = progressRef.current;
      const stars: 0 | 1 | 2 | 3 =
        score >= 95 ? 3 : score >= 80 ? 2 : score >= 60 ? 1 : 0;
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
        xp: (progress.xp || 0) + Math.round(score / 5) + (completed ? 10 : 0),
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
    <ProgressContext.Provider value={{ progress, ready, sync, recordPhase, isUnlocked, reset }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
