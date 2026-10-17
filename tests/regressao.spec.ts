// Regression suite: one test per bug fixed or behaviour adjusted.
// Rule: every new bug fix adds a test here (see tests/README.md), named with the next R number.
import { expect, test } from "@playwright/test";
import {
  answer,
  clearSaid,
  createChild,
  finishLearning,
  instrument,
  next,
  notesDuring,
  notesFrom,
  openPhase,
  playQuiz,
  range,
  said,
  seed,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await instrument(page);
});

test("R01 abre sem login, direto no cadastro da criança", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByPlaceholder("Ex.: Lia")).toBeVisible();
  await expect(page.getByText(/Continuar com (Google|Apple)/)).toHaveCount(0);
});

test("R02 fluxo completo salva o progresso e libera a próxima fase (sem arquivos faltando no subendereço)", async ({
  page,
}) => {
  const broken: string[] = [];
  page.on("response", (r) => r.status() >= 400 && broken.push(`${r.status()} ${r.url()}`));
  await createChild(page, { canRead: false });
  await openPhase(page);
  await finishLearning(page);
  await playQuiz(page);
  await expect(page.getByText("100%")).toBeVisible();
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem("sprout-progress-v2")!));
  expect(progress.phases[1]).toMatchObject({ completed: true, stars: 3, attempts: 1 });
  expect(progress.xp).toBe(30);
  await page.getByText("Mapa de fases").click();
  await expect(page.getByRole("button", { name: /Animal 2/ })).toBeEnabled();
  expect(broken).toEqual([]);
});

test("R03 nível 2 bloqueado com 5 das 10 fases do nível 1", async ({ page }) => {
  await seed(page, { completed: range(1, 5) });
  await expect(page.getByRole("button", { name: /Nível 2/ })).toBeDisabled();
});

test("R03 nível 2 liberado com 6 das 10 fases do nível 1 (60%)", async ({ page }) => {
  await seed(page, { completed: range(1, 6) });
  await expect(page.getByRole("button", { name: /Nível 2/ })).toBeEnabled();
});

test("R04 fases liberam pela ordem dentro do nível, mesmo com IDs pulando (10 → 201)", async ({ page }) => {
  await seed(page, { completed: [...range(1, 6), 201] });
  await page.getByRole("button", { name: /Nível 2/ }).click();
  await expect(page.getByRole("button", { name: /Número 1\b/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /Número 2\b/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /Número 3\b/ })).toBeDisabled();
});

test("R06 voz em inglês, numa velocidade boa para crianças (0,7)", async ({ page }) => {
  await createChild(page, { canRead: true });
  await openPhase(page);
  await expect.poll(async () => (await said(page)).map((s) => s.text)).toContain("Dog");
  for (const s of await said(page)) {
    expect(s.lang).toMatch(/^en/);
    expect(s.rate).toBeCloseTo(0.7, 2);
  }
});

test("R07 modo leitura: o nome do animal anterior não toca na pergunta seguinte", async ({ page }) => {
  await createChild(page, { canRead: true });
  await openPhase(page);
  await finishLearning(page);
  await clearSaid(page);
  for (;;) {
    await answer(page, true);
    await page.waitForTimeout(100); // child taps "Continuar" right away
    if (await next(page)) break;
    await page.waitForTimeout(700);
  }
  await page.waitForTimeout(1000);
  const inQuiz = (await said(page)).filter((s) => s.question);
  expect(inQuiz.length).toBeGreaterThan(0);
  for (const s of inQuiz) expect(s.text.toLowerCase(), `pergunta ${s.question} (${s.mode})`).toBe(s.question);
});

test("R08 quem ainda não lê só recebe perguntas de áudio com opções em imagem", async ({ page }) => {
  await createChild(page, { canRead: false });
  await openPhase(page);
  await finishLearning(page);
  for (;;) {
    const quiz = page.getByTestId("quiz");
    await expect(quiz).toHaveAttribute("data-mode", "audio");
    const firstOption = quiz.locator("[data-word]").first();
    await expect(firstOption.locator("img")).toHaveCount(1);
    await expect(firstOption).not.toContainText(/[A-Za-z]/);
    await answer(page, true);
    if (await next(page)) break;
  }
});

test("R09 animais aparecem como ilustração, não emoji", async ({ page }) => {
  await createChild(page, { canRead: true });
  await openPhase(page);
  const dog = page.getByRole("img", { name: "Dog" });
  await expect(dog).toBeVisible();
  expect(await dog.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByText("🐶")).toHaveCount(0);
});

test("R10 música toca nos menus após um toque, para no aprender/quiz e o botão desliga", async ({ page }) => {
  await seed(page);
  await page.getByText("Escolha seu nível").click(); // first tap unlocks audio
  expect(await notesDuring(page, 1500)).toBeGreaterThan(5);
  const toggle = page.getByRole("switch", { name: "Música de fundo" });
  await toggle.click();
  await page.waitForTimeout(500);
  expect(await notesDuring(page, 1500)).toBe(0);
  await toggle.click();
  expect(await notesDuring(page, 1500)).toBeGreaterThan(5);
  await openPhase(page);
  await page.waitForTimeout(600);
  expect(await notesDuring(page, 1500)).toBe(0);
  await finishLearning(page);
  await page.waitForTimeout(600);
  expect(await notesDuring(page, 1500)).toBe(0);
});

test("R11 sons de acerto, erro e fim de fase", async ({ page }) => {
  await seed(page);
  await openPhase(page);
  await finishLearning(page);
  expect(await notesFrom(page, () => answer(page, true)), "acerto").toBeGreaterThan(0);
  await next(page);
  expect(await notesFrom(page, () => answer(page, false)), "erro").toBeGreaterThan(0);
  await next(page);
  const button = page.getByRole("button", { name: /^(Continuar|Ver resultado)$/ });
  for (;;) {
    await answer(page, true);
    if ((await button.textContent()) === "Ver resultado") {
      expect(await notesFrom(page, () => button.click(), 1500), "fim de fase").toBeGreaterThan(0);
      break;
    }
    await button.click();
  }
});

test("R12 iPhone: cabeçalho fica abaixo da barra do relógio / Dynamic Island", async ({ page }) => {
  await seed(page, { completed: range(1, 12) });
  await page.addStyleTag({ content: ":root{--safe-top:59px!important;--safe-bottom:34px!important}" });
  const header = page.locator("header").first();
  expect((await header.boundingBox())!.y).toBeGreaterThanOrEqual(59);
  await page.getByRole("button", { name: /Nível 1/ }).click();
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(600);
  expect((await page.locator("header").first().boundingBox())!.y).toBeGreaterThanOrEqual(59);
});

test("R13 cada tela abre no topo (não herda a rolagem do mapa)", async ({ page }) => {
  await seed(page, { completed: range(1, 9) });
  await page.getByRole("button", { name: /Nível 1/ }).click();
  await page.waitForTimeout(1200); // map scrolls to the current phase
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await page.getByRole("button", { name: /Animal 3\b/ }).click();
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test("R15 versão de teste: selo visível e dados separados da versão real", async ({ page }) => {
  await page.goto("http://localhost:4174/");
  await page.getByPlaceholder("Ex.: Lia").fill("Teste");
  await page.getByText("Menino", { exact: true }).click();
  await page.getByText("Ainda não", { exact: true }).click();
  await page.getByText("Começar a aventura").click();
  await expect(page.getByText("VERSÃO DE TESTE")).toBeVisible();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toContain("teste:sprout-profile");
  expect(keys).not.toContain("sprout-profile");
});

test("R15 versão real não mostra o selo de teste", async ({ page }) => {
  await createChild(page, { canRead: true });
  await expect(page.getByText("VERSÃO DE TESTE")).toHaveCount(0);
  expect(await page.evaluate(() => Object.keys(localStorage))).toContain("sprout-profile");
});

test("R16 recarrega sozinho quando uma versão nova é publicada", async ({ page }) => {
  const firstCheck = page.waitForResponse(/index\.html\?t=/);
  await seed(page);
  await firstCheck; // the check made on open finds nothing new
  await page.route(
    /index\.html\?t=/,
    async (route) => {
      const res = await route.fetch();
      const html = (await res.text()).replace(/assets\/index-/g, "assets/index-NEW");
      await route.fulfill({ response: res, body: html });
    },
    { times: 1 },
  );
  const reloaded = page.waitForEvent("load");
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await reloaded;
});

test("R17 jogo da memória: virar outra carta logo após um par não fala a palavra antiga", async ({ page }) => {
  await seed(page, { completed: [1, 2] });
  await openPhase(page, "Animal 3");
  await finishLearning(page);
  await playQuiz(page);
  await page.getByText("Continuar a jornada").click();
  const cards = page.locator("button[data-word]");
  await expect(cards.first()).toBeVisible();
  const ids = await cards.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.word!));
  const a = ids[0];
  const b = ids.find((id) => id !== a)!;
  await cards.nth(ids.indexOf(a)).click();
  await cards.nth(ids.lastIndexOf(a)).click();
  await page.waitForTimeout(450); // pair registered, its word still pending
  await clearSaid(page);
  await cards.nth(ids.indexOf(b)).click();
  await page.waitForTimeout(1000);
  const words = (await said(page)).map((s) => s.text.toLowerCase());
  expect(words).toContain(b);
  expect(words.slice(words.indexOf(b))).not.toContain(a);
});

test("R18 se a fala engasgar (não começar), o app tenta de novo", async ({ page }) => {
  // Fake speech engine: swallows the first word (like iOS sometimes does), plays the rest.
  await page.addInitScript(() => {
    let calls = 0;
    const w = window as unknown as { __played: string[] };
    w.__played = [];
    Object.defineProperty(speechSynthesis, "speaking", { get: () => false });
    Object.defineProperty(speechSynthesis, "pending", { get: () => false });
    speechSynthesis.speak = (u: SpeechSynthesisUtterance) => {
      if (!u.text.trim()) return;
      if (calls++ === 0) return; // swallowed: never starts, never ends
      w.__played.push(u.text);
      setTimeout(() => u.dispatchEvent(new Event("start")), 20);
      setTimeout(() => u.dispatchEvent(new Event("end")), 300);
    };
    speechSynthesis.cancel = () => {};
  });
  await createChild(page, { canRead: true });
  await openPhase(page);
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __played: string[] }).__played), { timeout: 4000 })
    .toContain("Dog");
});

test("R19 tocar em Continuar não corta a palavra certa no meio", async ({ page }) => {
  // Fake speech engine that reports when something is cancelled while it is still talking.
  await page.addInitScript(() => {
    const w = window as unknown as { __cut: string[]; __done: string[] };
    w.__cut = [];
    w.__done = [];
    let talking: SpeechSynthesisUtterance | null = null;
    Object.defineProperty(speechSynthesis, "speaking", { get: () => !!talking });
    Object.defineProperty(speechSynthesis, "pending", { get: () => false });
    speechSynthesis.speak = (u: SpeechSynthesisUtterance) => {
      if (!u.text.trim()) return;
      setTimeout(() => {
        talking = u;
        u.dispatchEvent(new Event("start"));
        setTimeout(() => {
          if (talking !== u) return;
          talking = null;
          w.__done.push(u.text);
          u.dispatchEvent(new Event("end"));
        }, 500);
      }, 20);
    };
    speechSynthesis.cancel = () => {
      if (talking) w.__cut.push(talking.text);
      talking = null;
    };
  });
  await seed(page, { canRead: true });
  await openPhase(page);
  await finishLearning(page);
  await page.evaluate(() => ((window as unknown as { __cut: string[] }).__cut = [])); // leaving "learn" may cut its word
  const quiz = page.getByTestId("quiz");
  for (let i = 0; i < 3; i++) {
    await page.waitForTimeout(1000); // let the audio question's own word finish
    const word = (await quiz.getAttribute("data-answer"))!;
    await answer(page, true);
    await page.waitForTimeout(700); // the right word is being said right now
    await next(page);
    const w = await page.evaluate(() => {
      const { __cut, __done } = window as unknown as { __cut: string[]; __done: string[] };
      return { __cut, __done };
    });
    expect(w.__cut, "palavra cortada").toEqual([]);
    expect(w.__done.map((t) => t.toLowerCase())).toContain(word);
  }
});

test("R20 sair da tela de aprender logo depois de trocar a palavra não leva a palavra para o quiz", async ({ page }) => {
  await createChild(page, { canRead: true });
  await openPhase(page);
  const button = page.getByRole("button", { name: /Próxima|Fazer o quiz/ });
  // Child taps through fast: the last word's speech is still scheduled when the quiz opens.
  for (;;) {
    const label = await button.textContent();
    await button.click();
    if (label?.includes("Fazer o quiz")) break;
  }
  await expect(page.getByTestId("quiz")).toBeVisible();
  await page.waitForTimeout(1500);
  for (const s of (await said(page)).filter((x) => x.question))
    expect(s.text.toLowerCase(), `na pergunta ${s.question}`).toBe(s.question);
});

test("R21 nível 1 só tem animais, nível 2 só números de 0 a 10 (com ilustrações) e as histórias estão ocultas", async ({
  page,
}) => {
  await seed(page, { completed: range(1, 6) });
  await expect(page.getByRole("button", { name: "Histórias" })).toHaveCount(0);
  await page.getByRole("button", { name: /Nível 1/ }).click();
  await expect(page.getByRole("button", { name: /Animal \d+/ })).toHaveCount(10);
  await expect(page.getByRole("button", { name: /Cor \d|Número \d|Associação/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Histórias" })).toHaveCount(0);
  await page.getByRole("button", { name: "Voltar" }).first().click();
  await page.getByRole("button", { name: /Nível 2/ }).click();
  await expect(page.getByRole("button", { name: /Número \d+/ })).toHaveCount(7);
  await expect(page.getByText(/Fase 20\d/)).toHaveCount(0); // shows the position (Fase 1…7), not the ID
  await page.getByRole("button", { name: /Número 1\b/ }).click();
  await page.getByText("Começar a brotar").click();
  const zero = page.getByRole("img", { name: "Zero" });
  await expect(zero).toBeVisible();
  expect(await zero.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  // Learning ends at Ten: no 11-14 anywhere in this level.
  await finishLearning(page);
  for (;;) {
    const id = await page.getByTestId("quiz").getAttribute("data-answer");
    expect(["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]).toContain(id);
    await answer(page, true);
    if (await next(page)) break;
  }
});
