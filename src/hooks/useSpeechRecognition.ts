import { useCallback, useEffect, useRef, useState } from "react";

type SRConstructor = new () => any;

function getSR(): SRConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export function matchesWord(heard: string, target: string): boolean {
  const h = normalize(heard);
  const t = normalize(target);
  if (!h || !t) return false;
  if (h === t) return true;
  if (h.includes(t) || t.includes(h)) return true;
  const dist = levenshtein(h, t);
  const tolerance = t.length <= 4 ? 1 : t.length <= 7 ? 2 : 3;
  return dist <= tolerance;
}

export type SRErrorKind =
  | "not-supported"
  | "not-allowed"
  | "no-speech"
  | "audio-capture"
  | "aborted"
  | "network"
  | "start-failed"
  | "error";

export function useSpeechRecognition() {
  const supported = !!getSR();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef<any>(null);
  const gotResultRef = useRef(false);

  const start = useCallback(
    (onResult: (heard: string) => void, onError?: (e: SRErrorKind) => void) => {
      const SR = getSR();
      if (!SR) {
        onError?.("not-supported");
        return;
      }
      try {
        recRef.current?.abort?.();
      } catch {}
      gotResultRef.current = false;
      const rec = new SR();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 3;
      rec.continuous = false;
      rec.onstart = () => setListening(true);
      rec.onerror = (e: any) => {
        setListening(false);
        const kind: SRErrorKind = (e?.error as SRErrorKind) ?? "error";
        // Don't surface "aborted" — it happens on normal stop
        if (kind === "aborted") return;
        onError?.(kind);
      };
      rec.onend = () => {
        setListening(false);
        if (!gotResultRef.current) {
          // Ended without a result and no error fired
          // (onerror with no-speech usually fires first; this is a safety net)
        }
      };
      rec.onresult = (event: any) => {
        gotResultRef.current = true;
        const alts: string[] = [];
        const res = event.results[0];
        for (let i = 0; i < res.length; i++) alts.push(res[i].transcript);
        const best = alts[0] ?? "";
        setTranscript(best);
        onResult(alts.join(" | "));
      };
      recRef.current = rec;
      try {
        rec.start();
      } catch (e) {
        setListening(false);
        onError?.("start-failed");
      }
    },
    [],
  );

  const stop = useCallback(() => {
    try {
      recRef.current?.stop?.();
    } catch {}
    setListening(false);
  }, []);

  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort?.();
      } catch {}
    };
  }, []);

  return { supported, listening, transcript, start, stop };
}
