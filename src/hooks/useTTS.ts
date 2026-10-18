import { useCallback, useEffect, useState } from "react";
import { playVoiceClip, resumeAudio, stopVoiceClip, voiceClipFor } from "@/lib/sound";

// Preferred English voices, best first. On iPhone the owner downloaded Ava; Premium and
// Enhanced ("Aprimorada") versions sound far more natural than the default Samantha.
const PRIORITY = [
  "Ava",
  "Zoe",
  "Evan",
  "Samantha",
  "Google US English",
  "Microsoft Aria Online (Natural)",
  "Microsoft Aria",
  "Microsoft Jenny Online (Natural)",
];

/** 2 = Premium, 1 = Enhanced (names vary with the phone's language), 0 = standard. */
function quality(name: string) {
  if (/premium/i.test(name)) return 2;
  if (/enhanced|aprimorad|melhorad|avançad|mejorad/i.test(name)) return 1;
  return 0;
}

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
let clipCalls = 0;
const listeners = new Set<(speaking: boolean) => void>();

function setSpeaking(v: boolean) {
  listeners.forEach((l) => l(v));
}

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  let chosen: SpeechSynthesisVoice | undefined;
  for (const name of PRIORITY) {
    const matches = english.filter((v) => v.name.startsWith(name) || v.name.includes(name));
    if (matches.length) {
      chosen = matches.sort((a, b) => quality(b.name) - quality(a.name))[0];
      break;
    }
  }
  chosenVoice = chosen ?? english.sort((a, b) => quality(b.name) - quality(a.name))[0] ?? null;
}

if (supported) {
  pickVoice();
  window.speechSynthesis.addEventListener("voiceschanged", pickVoice);

  // iOS Safari (and some Android browsers) only allow speech after a speak()
  // made inside a user gesture (the end of a tap, not pointerdown). Speak a
  // silent utterance on the first tap so later automatic speech is allowed.
  const gestures = ["pointerup", "touchend", "click", "keydown"];
  const unlock = () => {
    // A blank utterance at normal volume: on iOS a volume-0 one can leave later speech muted.
    const u = new SpeechSynthesisUtterance(" ");
    // On iOS even this blank utterance interrupts Web Audio (the recorded words): resume it after.
    u.onend = u.onerror = () => resumeAudio();
    window.speechSynthesis.speak(u);
    gestures.forEach((e) => window.removeEventListener(e, unlock, true));
  };
  gestures.forEach((e) => window.addEventListener(e, unlock, true));
}

// iOS sometimes accepts an utterance and never plays it, or fails it mid-way.
// If it has not started after this long (or errors), try once more.
const START_TIMEOUT_MS = 1500;
let watchdog: ReturnType<typeof setTimeout> | null = null;

// What the phone reported for the last utterance; shown by "Testar voz" in the parent area.
let lastEvent = "nenhuma fala ainda";

/** Diagnostics for the parent area: voices available and what happened to the last utterance. */
export function ttsStatus() {
  if (!supported) return { supported, englishVoices: 0, voice: "—", lastEvent, names: [] as string[] };
  // A voice downloaded in the phone's settings is not always offered to web apps: list what we actually get.
  const english = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
  const names = english.map((v) => `${v.name} (${v.lang})`).sort();
  return { supported, englishVoices: english.length, voice: chosenVoice?.name ?? "padrão do aparelho", lastEvent, names };
}

/** iOS can go silent after cancel() is called with nothing playing: only cancel real speech. */
function cancelIfTalking() {
  const synth = window.speechSynthesis;
  if (synth.speaking || synth.pending) synth.cancel();
}

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
  try {
    if (chosenVoice) u.voice = chosenVoice;
  } catch {
    // Some browsers reject a voice object they did not create: keep the language only.
  }
  u.lang = chosenVoice?.lang ?? "en-US";
  u.rate = rate;
  u.pitch = pitch;
  let started = false;
  const retry = () => {
    clearWatchdog();
    if (retried || current !== u) {
      if (current === u) setSpeaking(false);
      return done();
    }
    cancelIfTalking();
    // iOS needs a moment after cancel() before it will speak again.
    watchdog = setTimeout(() => (current === u ? speakNow(text, rate, pitch, onDone, true) : done()), 300);
  };
  u.onstart = () => {
    lastEvent = `começou: "${text}"`;
    started = true;
    clearWatchdog();
    setSpeaking(true);
    // iOS can hang mid-utterance: "speaking" forever with no sound and no end event.
    // A short word takes well under this; past it, unstick the engine and say it again.
    const maxMs = 2500 + (text.length * 160) / rate;
    watchdog = setTimeout(() => {
      lastEvent = `travou falando: "${text}"`;
      retry();
    }, maxMs);
  };
  u.onend = () => {
    lastEvent = `terminou: "${text}"`;
    if (current === u) {
      clearWatchdog();
      setSpeaking(false);
    }
    resumeAudio();
    done();
  };
  u.onerror = (e) => {
    lastEvent = `erro "${e.error}": "${text}"${retried ? " (2ª tentativa)" : ""}`;
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
  lastEvent = `enviada, esperando começar: "${text}"`;
  clearWatchdog();
  // No "start" event yet: retry only if the engine is not talking either (some voices skip the event).
  watchdog = setTimeout(() => !started && !synth.speaking && retry(), START_TIMEOUT_MS);
}

/** Says `text` with the device's speech synthesis. */
function speakWithVoice(text: string, opts?: SpeakOpts) {
  if (!supported) return opts?.onDone?.();
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
    }, 150);
  } else {
    speakNow(text, rate, pitch, opts?.onDone);
  }
}

/** Silences speech and drops anything scheduled (used on screen changes). */
export function stopAllSpeech() {
  epoch++;
  stopVoiceClip();
  if (!supported) return;
  if (pending) clearTimeout(pending);
  pending = null;
  clearWatchdog();
  current = null;
  cancelIfTalking();
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
    // Words with a recording play it (works on silent mode); the device voice is the fallback.
    const clip = voiceClipFor(text);
    if (clip) {
      if (pending) clearTimeout(pending);
      pending = null;
      clearWatchdog();
      current = null;
      if (supported) cancelIfTalking();
      const scheduledIn = epoch;
      const call = ++clipCalls;
      setSpeaking(true);
      void playVoiceClip(clip, () => {
        // A newer word may already be playing: only the latest one clears the indicator.
        if (call === clipCalls) setSpeaking(false);
        opts?.onDone?.();
      }).then((played) => {
        if (played) return;
        if (call === clipCalls) setSpeaking(false);
        if (scheduledIn === epoch) speakWithVoice(text, opts);
        else opts?.onDone?.();
      });
      return;
    }
    stopVoiceClip();
    speakWithVoice(text, opts);
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
