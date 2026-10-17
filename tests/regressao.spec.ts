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

test("R03 nível 2 bloqueado com 29 fases do nível 1", async ({ page }) => {
  await seed(page, { completed: range(1, 29) });
  await expect(page.getByRole("button", { name: /Nível 2/ })).toBeDisabled();
});

test("R03 nível 2 liberado com 30 fases do nível 1", async ({ page }) => {
  await seed(page, { completed: range(1, 30) });
  await expect(page.getByRole("button", { name: /Nível 2/ })).toBeEnabled();
});

test("R04 fases do nível 2 liberam pela ordem, mesmo com IDs pulando (108 → 111)", async ({ page }) => {
  await seed(page, { completed: [...range(1, 30), ...range(101, 108)] });
  await page.getByRole("button", { name: /Nível 2/ }).click();
  await expect(page.getByRole("button", { name: /Roupa 1/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /Cômodo 1/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /Cômodo 2/ })).toBeDisabled();
});

test("R06 voz em inglês e devagar (0,6) para crianças", async ({ page }) => {
  await createChild(page, { canRead: true });
  await openPhase(page);
  await expect.poll(async () => (await said(page)).map((s) => s.text)).toContain("Dog");
  for (const s of await said(page)) {
    expect(s.lang).toMatch(/^en/);
    expect(s.rate).toBeCloseTo(0.6, 2);
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
  let ended = false;
  while (!ended) {
    await answer(page, true);
    if (await page.getByText("Ver resultado").isVisible()) {
      expect(await notesFrom(page, () => next(page), 1500), "fim de fase").toBeGreaterThan(0);
      ended = true;
    } else await next(page);
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
  await seed(page, { completed: range(1, 12) });
  await page.getByRole("button", { name: /Nível 1/ }).click();
  await page.waitForTimeout(1200); // map scrolls to the current phase
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await page.getByRole("button", { name: /Cor 3/ }).click();
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
  await seed(page);
  await page.waitForTimeout(1000); // first check on open finds nothing new
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
