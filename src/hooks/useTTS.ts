import { useCallback, useEffect, useRef, useState } from "react";

const PRIORITY = [
  "Samantha",
  "Google US English",
  "Microsoft Aria Online (Natural)",
  "Microsoft Aria",
  "Microsoft Jenny Online (Natural)",
];

export function useTTS() {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const queueRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!supported) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      let chosen: SpeechSynthesisVoice | undefined;
      for (const name of PRIORITY) {
        chosen = voices.find((v) => v.name.includes(name));
        if (chosen) break;
      }
      if (!chosen) chosen = voices.find((v) => v.lang.startsWith("en"));
      if (chosen) setVoice(chosen);
    };
    pick();
    window.speechSynthesis.onvoiceschanged = pick;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [supported]);

  const speak = useCallback(
    (text: string, opts?: { rate?: number; pitch?: number }) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? "en-US";
      u.rate = opts?.rate ?? 0.78;
      u.pitch = opts?.pitch ?? 1.25;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      queueRef.current = u;
      window.speechSynthesis.speak(u);
    },
    [voice, supported],
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { speak, stop, speaking, supported };
}
