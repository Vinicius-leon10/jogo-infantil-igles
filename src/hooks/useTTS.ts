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
// Bumped on every stop and every screen change: speech scheduled before that is dropped,
// so a screen that is leaving (still animating out) can never talk over the next one.
let epoch = 0;
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

// iOS sometimes accepts an utterance and never plays it, or fails it mid-way.
// If it has not started after this long (or errors), try once more.
const START_TIMEOUT_MS = 1500;
let watchdog: ReturnType<typeof setTimeout> | null = null;

function clearWatchdog() {
  if (watchdog) clearTimeout(watchdog);
  watchdog = null;
}

type SpeakOpts = { rate?: number; pitch?: number; onDone?: () => void };

function speakNow(text: string, rate: number, pitch: number, onDone?: () => void, retried = false) {
  const synth = window.speechSynthesis;
  let doneCalled = false;
  const done = () => {
    if (doneCalled) return;
    doneCalled = true;
    onDone?.();
  };
  const u = new SpeechSynthesisUtterance(text);
  if (chosenVoice) u.voice = chosenVoice;
  u.lang = chosenVoice?.lang ?? "en-US";
  u.rate = rate;
  u.pitch = pitch;
  let started = false;
  const retry = () => {
    clearWatchdog();
    if (retried || current !== u) return done();
    synth.cancel();
    watchdog = setTimeout(() => (current === u ? speakNow(text, rate, pitch, onDone, true) : done()), 120);
  };
  u.onstart = () => {
    started = true;
    clearWatchdog();
    setSpeaking(true);
  };
  u.onend = () => {
    if (current === u) setSpeaking(false);
    resumeAudio();
    done();
  };
  u.onerror = (e) => {
    // "interrupted"/"canceled" come from our own cancel(): nothing to redo.
    if (e.error !== "interrupted" && e.error !== "canceled") retry();
    else {
      if (current === u) setSpeaking(false);
      done();
    }
    resumeAudio();
  };
  current = u;
  if (synth.paused) synth.resume(); // Chrome can get stuck paused; resuming otherwise upsets iOS.
  synth.speak(u);
  clearWatchdog();
  watchdog = setTimeout(() => !started && retry(), START_TIMEOUT_MS);
}

/** Silences speech and drops anything scheduled (used on screen changes). */
export function stopAllSpeech() {
  epoch++;
  if (!supported) return;
  if (pending) clearTimeout(pending);
  pending = null;
  clearWatchdog();
  current = null;
  window.speechSynthesis.cancel();
  setSpeaking(false);
}

export function useTTS() {
  const [speaking, setLocalSpeaking] = useState(false);

  useEffect(() => {
    listeners.add(setLocalSpeaking);
    return () => {
      listeners.delete(setLocalSpeaking);
    };
  }, []);

  /** `onDone` runs once the text has been said (or could not be). */
  const speak = useCallback((text: string, opts?: SpeakOpts) => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const rate = opts?.rate ?? 0.7;
    const pitch = opts?.pitch ?? 1.25;
    if (pending) clearTimeout(pending);
    pending = null;
    clearWatchdog();
    if (synth.speaking || synth.pending) {
      // Chrome drops an utterance queued right after cancel(); give it a beat.
      synth.cancel();
      pending = setTimeout(() => {
        pending = null;
        speakNow(text, rate, pitch, opts?.onDone);
      }, 60);
    } else {
      speakNow(text, rate, pitch, opts?.onDone);
    }
  }, []);

  const stop = useCallback(() => stopAllSpeech(), []);

  /** Speaks after `delay` ms unless speech was stopped or the screen changed meanwhile. */
  const speakLater = useCallback(
    (text: string, delay: number, opts?: SpeakOpts) => {
      const scheduledIn = epoch;
      const t = setTimeout(() => {
        if (scheduledIn === epoch) speak(text, opts);
        else opts?.onDone?.();
      }, delay);
      return () => clearTimeout(t);
    },
    [speak],
  );

  return { speak, speakLater, stop, speaking, supported };
}
