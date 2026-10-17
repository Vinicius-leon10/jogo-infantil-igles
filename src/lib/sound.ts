/**
 * Background music and sound effects, synthesized with the Web Audio API so the
 * app ships no audio files. The music is an instrumental, upbeat loop in
 * C major (marimba melody, plucked bass, ukulele-like chord stabs, soft drums).
 */
import { readJSON, writeJSON } from "./storage";

const MUSIC_KEY = "sprout-music-enabled";
const BPM = 112;
const STEP = 60 / BPM / 2; // eighth note, in seconds
const MUSIC_VOLUME = 0.5;
// Effects stay below the voice so the spoken word is the loudest thing in the quiz.
const SFX_VOLUME = 0.5;

let ctx: AudioContext | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let noise: AudioBuffer | null = null;

let musicEnabled = readJSON<boolean>(MUSIC_KEY) ?? true;
let musicWanted = false;
let playing = false;
let timer: ReturnType<typeof setInterval> | null = null;
let nextTime = 0;
let stepIndex = 0;
const listeners = new Set<(on: boolean) => void>();

function audio(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  // Compressor on the master bus lets us play loud without clipping.
  const master = ctx.createDynamicsCompressor();
  master.threshold.value = -14;
  master.knee.value = 10;
  master.ratio.value = 4;
  const out = ctx.createGain();
  out.gain.value = 1.6;
  master.connect(out).connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.gain.value = 0;
  musicGain.connect(master);
  sfxGain = ctx.createGain();
  sfxGain.gain.value = SFX_VOLUME;
  sfxGain.connect(master);
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return ctx;
}

/** A tiny silent WAV, looped in an <audio> element (see unlock below). */
function silentWav(): string {
  const rate = 8000;
  const samples = rate / 2;
  const buf = new ArrayBuffer(44 + samples);
  const v = new DataView(buf);
  const str = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF"); v.setUint32(4, 36 + samples, true); str(8, "WAVE"); str(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  str(36, "data"); v.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) v.setUint8(44 + i, 128);
  let bin = "";
  new Uint8Array(buf).forEach((b) => (bin += String.fromCharCode(b)));
  return "data:audio/wav;base64," + btoa(bin);
}

// Browsers only let audio start inside a real user gesture. On phones that is
// the end of a tap (touchend/click), not pointerdown, so listen to all of them.
const GESTURES = ["pointerup", "touchend", "click", "keydown"] as const;
if (typeof window !== "undefined") {
  let keepAlive: HTMLAudioElement | null = null;
  const unlock = () => {
    const c = audio();
    if (!c) return;
    c.onstatechange = () => {
      if (c.state === "running" && musicWanted && musicEnabled) startLoop();
    };
    // iOS mutes Web Audio with the silent switch unless the page is also
    // playing media; a looping silent <audio> moves it to the "playback" session.
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = "playback";
    if (!keepAlive) {
      keepAlive = new Audio(silentWav());
      keepAlive.loop = true;
      keepAlive.setAttribute("playsinline", "");
    }
    keepAlive.play().catch(() => {});
    // A short silent buffer started inside the gesture fully unlocks old Safari.
    const src = c.createBufferSource();
    src.buffer = c.createBuffer(1, 1, 22050);
    src.connect(c.destination);
    src.start(0);
    c.resume().then(() => {
      if (musicWanted && musicEnabled) startLoop();
    });
  };
  // Keep listening for the whole session: on iOS, speech synthesis and phone
  // calls put the context in an "interrupted" state that only a new tap clears.
  const wake = () => {
    if (ctx?.state === "running" && keepAlive && !keepAlive.paused) return;
    unlock();
  };
  GESTURES.forEach((e) => window.addEventListener(e, wake, true));
  // Coming back from the background (iOS "interrupted" state): resume.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && ctx && ctx.state !== "running") {
      ctx.resume().then(() => musicWanted && musicEnabled && startLoop());
    }
  });
}

// ---------------------------------------------------------------- notes

const SEMI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function freq(note: string): number {
  const m = /^([A-G])(#?)(\d)$/.exec(note)!;
  const midi = 12 * (+m[3] + 1) + SEMI[m[1]] + (m[2] ? 1 : 0);
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function envelope(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

/** Marimba-like tone: sine plus a quieter octave partial, quick decay. */
function marimba(out: AudioNode, note: string, t: number, dur: number, vol = 0.5) {
  const c = ctx!;
  const f = freq(note);
  for (const [mult, v] of [[1, vol], [4, vol * 0.12]] as const) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = f * mult;
    envelope(g, t, v, 0.005, mult === 1 ? Math.max(0.25, dur) : 0.12);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.6);
  }
}

function pluck(out: AudioNode, note: string, t: number, vol: number, decay: number, type: OscillatorType = "triangle") {
  const c = ctx!;
  const o = c.createOscillator();
  const g = c.createGain();
  const lp = c.createBiquadFilter();
  o.type = type;
  o.frequency.value = freq(note);
  lp.type = "lowpass";
  lp.frequency.value = 1400;
  envelope(g, t, vol, 0.008, decay);
  o.connect(lp).connect(g).connect(out);
  o.start(t);
  o.stop(t + decay + 0.1);
}

function kick(out: AudioNode, t: number) {
  const c = ctx!;
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(50, t + 0.12);
  envelope(g, t, 0.55, 0.003, 0.16);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.2);
}

function hiss(out: AudioNode, t: number, vol: number, decay: number, type: BiquadFilterType, hz: number) {
  const c = ctx!;
  const s = c.createBufferSource();
  const f = c.createBiquadFilter();
  const g = c.createGain();
  s.buffer = noise;
  f.type = type;
  f.frequency.value = hz;
  envelope(g, t, vol, 0.002, decay);
  s.connect(f).connect(g).connect(out);
  s.start(t, Math.random() * 0.5);
  s.stop(t + decay + 0.05);
}

// ---------------------------------------------------------------- the song

type N = [step: number, note: string, len: number];
type Bar = { chord: string[]; bass: string; melody: N[] };

const CH = {
  C: { chord: ["C4", "E4", "G4"], bass: "C3" },
  G: { chord: ["B3", "D4", "G4"], bass: "G2" },
  Am: { chord: ["A3", "C4", "E4"], bass: "A2" },
  F: { chord: ["A3", "C4", "F4"], bass: "F2" },
};
const bar = (c: keyof typeof CH, melody: N[]): Bar => ({ ...CH[c], melody });

const SONG: Bar[] = [
  // A
  bar("C", [[0, "E5", 2], [2, "G5", 2], [4, "A5", 1], [5, "G5", 1], [6, "E5", 2]]),
  bar("G", [[0, "D5", 2], [2, "B4", 1], [3, "D5", 1], [4, "G5", 4]]),
  bar("Am", [[0, "C5", 2], [2, "E5", 2], [4, "A5", 2], [6, "G5", 2]]),
  bar("F", [[0, "F5", 2], [2, "E5", 1], [3, "D5", 1], [4, "C5", 4]]),
  bar("C", [[0, "E5", 1], [1, "E5", 1], [2, "G5", 2], [4, "C6", 2], [6, "A5", 2]]),
  bar("G", [[0, "G5", 2], [2, "F5", 1], [3, "E5", 1], [4, "D5", 4]]),
  bar("F", [[0, "A5", 2], [2, "G5", 2], [4, "F5", 2], [6, "D5", 2]]),
  bar("C", [[0, "C5", 4], [4, "G4", 2], [6, "C5", 2]]),
  // B
  bar("Am", [[0, "A4", 1], [1, "C5", 1], [2, "E5", 2], [4, "A5", 2], [6, "E5", 2]]),
  bar("F", [[0, "F5", 2], [2, "A5", 2], [4, "G5", 2], [6, "F5", 2]]),
  bar("C", [[0, "E5", 1], [1, "G5", 1], [2, "C6", 2], [4, "B5", 1], [5, "A5", 1], [6, "G5", 2]]),
  bar("G", [[0, "D5", 2], [2, "G5", 2], [4, "B5", 2], [6, "A5", 2]]),
  bar("Am", [[0, "C6", 2], [2, "B5", 1], [3, "A5", 1], [4, "E5", 4]]),
  bar("F", [[0, "F5", 1], [1, "G5", 1], [2, "A5", 2], [4, "C6", 2], [6, "A5", 2]]),
  bar("G", [[0, "G5", 2], [2, "D5", 2], [4, "B4", 2], [6, "D5", 2]]),
  bar("C", [[0, "C5", 6]]),
];

function scheduleStep(i: number, t: number) {
  const out = musicGain!;
  const b = SONG[Math.floor(i / 8) % SONG.length];
  const s = i % 8;
  for (const [step, note, len] of b.melody) {
    if (step === s) marimba(out, note, t, len * STEP, 0.45);
  }
  if (s === 0 || s === 4) pluck(out, b.bass, t, 0.5, 0.35, "sine");
  if (s === 6) pluck(out, b.bass.replace(/\d/, (d) => String(+d + 1)), t, 0.3, 0.2, "sine");
  if (s === 2 || s === 6) b.chord.forEach((n, k) => pluck(out, n, t + k * 0.012, 0.09, 0.22));
  if (s === 0 || s === 4) kick(out, t);
  if (s === 2 || s === 6) hiss(out, t, 0.12, 0.1, "bandpass", 2200);
  hiss(out, t, s % 2 ? 0.05 : 0.025, 0.035, "highpass", 8000);
}

function startLoop() {
  const c = ctx;
  if (!c || !musicGain) return;
  if (c.state !== "running") {
    // Resumes after an interruption ends; otherwise onstatechange/next tap retries.
    c.resume().catch(() => {});
    return;
  }
  const now = c.currentTime;
  musicGain.gain.cancelScheduledValues(now);
  musicGain.gain.setValueAtTime(musicGain.gain.value, now);
  musicGain.gain.linearRampToValueAtTime(MUSIC_VOLUME, now + 0.8);
  if (playing) return;
  playing = true;
  nextTime = now + 0.08;
  stepIndex = 0;
  timer = setInterval(() => {
    while (nextTime < c.currentTime + 0.15) {
      scheduleStep(stepIndex++, nextTime);
      nextTime += STEP;
    }
  }, 25);
}

function stopLoop() {
  if (!ctx || !musicGain || !playing) return;
  const now = ctx.currentTime;
  musicGain.gain.cancelScheduledValues(now);
  musicGain.gain.setValueAtTime(musicGain.gain.value, now);
  musicGain.gain.linearRampToValueAtTime(0, now + 0.4);
  playing = false;
  if (timer) clearInterval(timer);
  timer = null;
}

// ---------------------------------------------------------------- public API

/** Whether the current screen wants background music (levels, map, intro, story list). */
/** Called after speech ends: iOS interrupts Web Audio while it speaks. */
export function resumeAudio() {
  if (ctx && ctx.state !== "running") ctx.resume().catch(() => {});
}

export function setMusicWanted(wanted: boolean) {
  musicWanted = wanted;
  if (wanted && musicEnabled) startLoop();
  else stopLoop();
}

export function isMusicEnabled() {
  return musicEnabled;
}

export function setMusicEnabled(on: boolean) {
  musicEnabled = on;
  writeJSON(MUSIC_KEY, on);
  listeners.forEach((l) => l(on));
  setMusicWanted(musicWanted);
}

export function onMusicEnabledChange(l: (on: boolean) => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function sfx(play: (out: AudioNode, t: number) => void) {
  const c = audio();
  if (!c || !sfxGain) return;
  if (c.state !== "running") c.resume();
  play(sfxGain, c.currentTime + 0.02);
}

/** Bright rising chime for a right answer. */
export function playCorrect() {
  sfx((out, t) => {
    marimba(out, "C6", t, 0.12, 0.5);
    marimba(out, "E6", t + 0.08, 0.12, 0.5);
    marimba(out, "G6", t + 0.16, 0.35, 0.55);
    hiss(out, t + 0.16, 0.06, 0.3, "highpass", 9000);
  });
}

/** Soft, friendly "oops" for a wrong answer (never harsh). */
export function playWrong() {
  sfx((out, t) => {
    pluck(out, "E4", t, 0.35, 0.18);
    pluck(out, "C4", t + 0.16, 0.35, 0.35);
  });
}

/** Little fanfare at the end of a phase; gentler "try again" tune if not passed. */
export function playComplete(passed: boolean) {
  sfx((out, t) => {
    if (passed) {
      ["C5", "E5", "G5", "C6"].forEach((n, i) => marimba(out, n, t + i * 0.11, 0.15, 0.5));
      ["C5", "E5", "G5", "C6"].forEach((n) => marimba(out, n, t + 0.5, 0.9, 0.3));
      ["C3", "G3"].forEach((n) => pluck(out, n, t + 0.5, 0.4, 0.8, "sine"));
      hiss(out, t + 0.5, 0.08, 0.6, "highpass", 9000);
    } else {
      ["G4", "A4", "C5"].forEach((n, i) => marimba(out, n, t + i * 0.16, 0.2, 0.4));
      marimba(out, "E5", t + 0.5, 0.6, 0.35);
    }
  });
}
