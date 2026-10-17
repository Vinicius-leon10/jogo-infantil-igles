import { useCallback, useEffect, useState } from "react";
import { resumeAudio } from "@/lib/sound";

const PRIORITY = [
  "Samantha",
  "Google US English",
  "Microsoft Aria Online (Natural)",
  "Microsoft Aria",
  "Microsoft Jenny Online (Natural)",
];

const supported = typeof window !== "undefined" && "speechSynthesis" in window;

// Shared across every screen, so speech scheduled from an effect (which may hold
// a callback from before the voices loaded) still uses the chosen English voice.
let chosenVoice: SpeechSynthesisVoice | null = null;
// Keep a reference to the live utterance: Chrome may garbage-collect it mid-speech.
let current: SpeechSynthesisUtterance | null = null;
let pending: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<(speaking: boolean) => void>();

function setSpeaking(v: boolean) {
  listeners.forEach((l) => l(v));
}

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;
  let chosen: SpeechSynthesisVoice | undefined;
  for (const name of PRIORITY) {
    chosen = voices.find((v) => v.name.includes(name));
    if (chosen) break;
  }
  if (!chosen) chosen = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
  chosenVoice = chosen ?? null;
}

if (supported) {
  pickVoice();
  window.speechSynthesis.addEventListener("voiceschanged", pickVoice);

  // iOS Safari (and some Android browsers) only allow speech after a speak()
  // made inside a user gesture (the end of a tap, not pointerdown). Speak a
  // silent utterance on the first tap so later automatic speech is allowed.
  const gestures = ["pointerup", "touchend", "click", "keydown"];
  const unlock = () => {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
    gestures.forEach((e) => window.removeEventListener(e, unlock, true));
  };
  gestures.forEach((e) => window.addEventListener(e, unlock, true));
}

function speakNow(text: string, rate: number, pitch: number) {
  const u = new SpeechSynthesisUtterance(text);
  if (chosenVoice) u.voice = chosenVoice;
  u.lang = chosenVoice?.lang ?? "en-US";
  u.rate = rate;
  u.pitch = pitch;
  u.onstart = () => setSpeaking(true);
  u.onend = u.onerror = () => {
    if (current === u) setSpeaking(false);
    resumeAudio();
  };
  current = u;
  window.speechSynthesis.resume(); // Chrome can get stuck in a paused state.
  window.speechSynthesis.speak(u);
}

export function useTTS() {
  const [speaking, setLocalSpeaking] = useState(false);

  useEffect(() => {
    listeners.add(setLocalSpeaking);
    return () => {
      listeners.delete(setLocalSpeaking);
    };
  }, []);

  const speak = useCallback((text: string, opts?: { rate?: number; pitch?: number }) => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const rate = opts?.rate ?? 0.6;
    const pitch = opts?.pitch ?? 1.25;
    if (pending) clearTimeout(pending);
    pending = null;
    if (synth.speaking || synth.pending) {
      // Chrome drops an utterance queued right after cancel(); give it a beat.
      synth.cancel();
      pending = setTimeout(() => {
        pending = null;
        speakNow(text, rate, pitch);
      }, 60);
    } else {
      speakNow(text, rate, pitch);
    }
  }, []);

  const stop = useCallback(() => {
    if (!supported) return;
    if (pending) clearTimeout(pending);
    pending = null;
    current = null;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, supported };
}
