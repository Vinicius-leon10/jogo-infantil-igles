import { expect, type Page } from "@playwright/test";

export type Spoken = { text: string; rate: number; lang: string; question: string | null; mode: string | null };

/**
 * Records what the app says (speech synthesis) and how many notes it plays (Web Audio),
 * and skips the opening screen (its "Toque para começar" tap). Call before page.goto().
 * The recorded word MP3s are blocked so words go through speech synthesis (the fallback
 * path these tests inspect); `allowVoiceClips` lets a test hear them (see R33).
 */
export async function instrument(page: Page) {
  await page.route("**/*.mp3", (r) => r.abort());
  await page.addInitScript(() => {
    sessionStorage.setItem("sprout_skip_splash", "1");
    const w = window as unknown as { __said: Spoken[]; __notes: number };
    w.__said = [];
    w.__notes = 0;
    const speak = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (u: SpeechSynthesisUtterance) => {
      if (u.text.trim()) {
        const quiz = document.querySelector<HTMLElement>('[data-testid="quiz"]');
        w.__said.push({
          text: u.text,
          rate: u.rate,
          lang: u.lang,
          question: quiz?.dataset.answer ?? null,
          mode: quiz?.dataset.mode ?? null,
        });
      }
      speak(u);
    };
    // Recorded voice clips: buffers decoded from the MP3s, and each one started.
    const clipBuffers = new WeakSet<AudioBuffer>();
    const w2 = window as unknown as { __clips: number[] };
    w2.__clips = [];
    const decode = BaseAudioContext.prototype.decodeAudioData;
    BaseAudioContext.prototype.decodeAudioData = function (data: ArrayBuffer) {
      return decode.call(this, data).then((b: AudioBuffer) => (clipBuffers.add(b), b));
    } as typeof decode;
    const startSource = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args: [number?, number?, number?]) {
      if (this.buffer && clipBuffers.has(this.buffer)) w2.__clips.push(this.buffer.duration);
      return startSource.apply(this, args);
    };
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (...args: [number?]) {
      w.__notes++;
      return start.apply(this, args);
    };
  });
}

/** Lets the recorded word MP3s load (instrument() blocks them). */
export const allowVoiceClips = (page: Page) => page.unroute("**/*.mp3");
/** Durations (s) of the recorded voice clips played so far. */
export const clips = (page: Page) => page.evaluate(() => (window as unknown as { __clips: number[] }).__clips);
export const said = (page: Page) => page.evaluate(() => (window as unknown as { __said: Spoken[] }).__said);
export const clearSaid = (page: Page) => page.evaluate(() => ((window as unknown as { __said: Spoken[] }).__said = []));
export const notes = (page: Page) => page.evaluate(() => (window as unknown as { __notes: number }).__notes);

/** Notes played by `action` (sounds start inside the tap) plus the following `ms`. */
export async function notesFrom(page: Page, action: () => Promise<unknown>, ms = 600) {
  const before = await notes(page);
  await action();
  await page.waitForTimeout(ms);
  return (await notes(page)) - before;
}

/** Notes played during `ms` milliseconds. */
export async function notesDuring(page: Page, ms: number) {
  const before = await notes(page);
  await page.waitForTimeout(ms);
  return (await notes(page)) - before;
}

/** Fills the first-run child setup. */
export async function createChild(page: Page, { canRead }: { canRead: boolean }) {
  await page.goto("./");
  await page.getByPlaceholder("Ex.: Lia").fill("Lia");
  await page.getByText("Menina", { exact: true }).click();
  await page.getByText(canRead ? "Sim, já leio" : "Ainda não", { exact: true }).click();
  await page.getByText("Começar a aventura").click();
  await expect(page.getByText("Escolha seu nível")).toBeVisible();
}

/** Saves a profile (and optional progress) straight into storage, then opens the app. */
export async function seed(
  page: Page,
  { canRead = true, completed = [] as number[], prefix = "" } = {},
) {
  await page.addInitScript(
    ({ canRead, completed, prefix }) => {
      if (sessionStorage.getItem("seeded")) return;
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem(
        prefix + "sprout-profile",
        JSON.stringify({ id: "local", name: "Lia", age: 5, sex: "girl", can_read: canRead }),
      );
      const phases: Record<number, unknown> = {};
      for (const id of completed) phases[id] = { stars: 3, bestScore: 100, completed: true, attempts: 1 };
      localStorage.setItem(prefix + "sprout-progress-v2", JSON.stringify({ phases, xp: 0, streak: 0, wrongWords: {} }));
    },
    { canRead, completed, prefix },
  );
  await page.goto("./");
  await expect(page.getByText("Escolha seu nível")).toBeVisible();
}

export const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** Levels → level 1 map → phase → learn screen. */
export async function openPhase(page: Page, title = "Animal 1", level = "Nível 1") {
  await page.getByRole("button", { name: new RegExp(level) }).first().click();
  await page.getByRole("button", { name: new RegExp(`${title}\\b`) }).click(); // "Animal 1" ≠ "Animal 10"
  await page.getByText("Começar a brotar").click();
}

/** From the learn screen, step through every word and start the quiz. */
export async function finishLearning(page: Page) {
  const button = page.getByRole("button", { name: /Próxima|Fazer o quiz/ });
  for (;;) {
    const label = await button.textContent();
    await button.click();
    if (label?.includes("Fazer o quiz")) break;
  }
  await expect(page.getByTestId("quiz")).toBeVisible();
}

/** Picks the right (or a wrong) option for the current quiz question. */
export async function answer(page: Page, right = true) {
  const quiz = page.getByTestId("quiz");
  const id = await quiz.getAttribute("data-answer");
  const option = right
    ? quiz.locator(`[data-word="${id}"]`)
    : quiz.locator(`[data-word]:not([data-word="${id}"])`).first();
  await option.click();
}

/** "Continuar", or "Ver resultado" on the last question. Returns true when the quiz ended. */
export async function next(page: Page) {
  // The button appears once the right word has been said.
  const button = page.getByRole("button", { name: /^(Continuar|Ver resultado)$/ });
  const label = await button.textContent();
  await button.click();
  return label === "Ver resultado";
}

/** Answers every question (all right by default) and opens the result screen. */
export async function playQuiz(page: Page, right = true) {
  for (;;) {
    await answer(page, right);
    if (await next(page)) break;
  }
}
