// Regression suite: one test per bug fixed or behaviour adjusted.
// Rule: every new bug fix adds a test here (see tests/README.md), named with the next R number.
import { expect, test } from "@playwright/test";
import {
  allowVoiceClips,
  answer,
  clips,
  notes,
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
  await expect(page.getByRole("button", { name: /Animal 2\b/ })).toBeEnabled();
  expect(broken).toEqual([]);
});

test("R03 nível 2 bloqueado até completar a árvore (9 de 10 fases)", async ({ page }) => {
  await seed(page, { completed: range(1, 9) });
  await expect(page.getByRole("button", { name: /Nível 2 Números/ })).toBeDisabled();
});

test("R03 nível 2 liberado ao completar a árvore (fase 10)", async ({ page }) => {
  await seed(page, { completed: range(1, 10) });
  await expect(page.getByRole("button", { name: /Nível 2 Números/ })).toBeEnabled();
});

test("R04 fases liberam pela ordem dentro do nível, mesmo com IDs pulando (10 → 201)", async ({ page }) => {
  await seed(page, { completed: [...range(1, 10), 201] });
  await page.getByRole("button", { name: /Nível 2 Números/ }).click();
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
  await page.getByRole("button", { name: /Nível 1/ }).first().click();
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(600);
  expect((await page.locator("header").first().boundingBox())!.y).toBeGreaterThanOrEqual(59);
});

test("R13 cada tela abre no topo (não herda a rolagem do mapa)", async ({ page }) => {
  await seed(page); // phase 1 is at the bottom of the map, so the map scrolls down to it
  await page.getByRole("button", { name: /Nível 1/ }).first().click();
  await page.waitForTimeout(1200); // map scrolls to the current phase
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await page.getByRole("button", { name: /Animal 1\b/ }).click();
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
  await seed(page, { completed: range(1, 10) });
  await expect(page.getByRole("button", { name: "Histórias" })).toHaveCount(0);
  await page.getByRole("button", { name: /Nível 1/ }).first().click();
  await expect(page.getByRole("button", { name: /Animal \d+/ })).toHaveCount(10);
  await expect(page.getByRole("button", { name: /Cor \d|Número \d|Associação/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Histórias" })).toHaveCount(0);
  await page.getByRole("button", { name: "Voltar" }).first().click();
  await page.getByRole("button", { name: /Nível 2 Números/ }).click();
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

test("R22 ao achar versão nova, abre um endereço novo (?v=) que o iPhone não tem guardado, e só tenta uma vez", async ({
  page,
}) => {
  // The server keeps answering with a "newer" build (like a stale cache would): the app must
  // jump to a cache-busting URL once, then stop instead of reloading forever.
  await page.route(/index\.html\?t=/, async (route) => {
    const res = await route.fetch();
    const html = (await res.text()).replace(/assets\/index-/g, "assets/index-NEW");
    await route.fulfill({ response: res, body: html });
  });
  let loads = 0;
  page.on("load", () => loads++);
  await seed(page);
  await page.waitForTimeout(3000);
  expect(page.url()).toMatch(/[?&]v=/);
  expect(loads).toBeLessThanOrEqual(2);
});

test("R23 a abertura pede um toque e a música começa logo em seguida", async ({ page }) => {
  // Browsers only allow sound after a tap: the opening screen asks for it.
  await page.addInitScript(() => sessionStorage.removeItem("sprout_skip_splash"));
  await seed(page);
  await page.getByRole("button", { name: /Toque para começar/ }).click();
  await expect(page.getByRole("button", { name: /Toque para começar/ })).toHaveCount(0);
  expect(await notesDuring(page, 1500)).toBeGreaterThan(5);
});

test("R24 mapa é um terreno: fase 1 embaixo, e a planta cresce a cada fase até a árvore", async ({ page }) => {
  await seed(page, { completed: [1, 2] });
  await page.getByRole("button", { name: /Nível 1/ }).first().click();
  const phase = (n: number) => page.getByRole("button", { name: new RegExp(`Animal ${n}\\b`) });
  const y = async (n: number) => (await phase(n).boundingBox())!.y;
  expect(await y(1)).toBeGreaterThan(await y(2));
  expect(await y(2)).toBeGreaterThan(await y(10));
  for (const n of [1, 3, 10]) await expect(phase(n).locator(`svg[data-stage="${n}"]`)).toHaveCount(1);
  await expect(phase(3)).toBeEnabled();
  await expect(phase(4)).toBeDisabled();
});

test("R25 ao completar a fase 10 aparece a árvore completa e dá para ir ao nível 2", async ({ page }) => {
  await seed(page, { completed: range(1, 9) });
  await openPhase(page, "Animal 10");
  await finishLearning(page);
  await playQuiz(page);
  await page.getByText("Continuar a jornada").click();
  await expect(page.getByTestId("tree-complete")).toContainText("Você completou a Macieira");
  await page.getByRole("button", { name: /Ir para o Nível 2/ }).click();
  await expect(page.getByRole("heading", { name: "Nível 2" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Número 1\b/ })).toBeEnabled();
});

test("R26 trocar de tela não manda cancelar a voz quando ela está em silêncio (isso emudece o iPhone)", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __idleCancels: number };
    w.__idleCancels = 0;
    let talking = false;
    Object.defineProperty(speechSynthesis, "speaking", { get: () => talking });
    Object.defineProperty(speechSynthesis, "pending", { get: () => false });
    speechSynthesis.speak = (u: SpeechSynthesisUtterance) => {
      if (!u.text.trim()) return;
      talking = true;
      setTimeout(() => u.dispatchEvent(new Event("start")), 10);
      setTimeout(() => {
        talking = false;
        u.dispatchEvent(new Event("end"));
      }, 200);
    };
    speechSynthesis.cancel = () => {
      if (!talking) w.__idleCancels++;
      talking = false;
    };
  });
  await seed(page);
  await page.getByRole("button", { name: /Nível 1/ }).first().click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "Voltar aos níveis" }).click();
  await page.waitForTimeout(600);
  await openPhase(page);
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => (window as unknown as { __idleCancels: number }).__idleCancels)).toBe(0);
});

test("R27 área dos pais tem 'Testar voz', que fala e mostra o que o aparelho respondeu", async ({ page }) => {
  await seed(page);
  await page.getByRole("button", { name: "Área dos pais" }).click();
  const [a, b] = (await page.getByText(/Quanto é/).textContent())!.match(/\d+/g)!.map(Number);
  await page.getByPlaceholder("Resposta").fill(String(a + b));
  await page.getByText("Entrar").click();
  await page.getByRole("button", { name: "Falas" }).click();
  await clearSaid(page);
  await page.getByRole("button", { name: /Testar voz/ }).click();
  await expect.poll(async () => (await said(page)).map((s) => s.text)).toContain("Hello! Dog, cat, one, two, three.");
  await expect(page.getByTestId("sound-check")).toContainText("Última fala");
});

test("R28 se a voz travar no meio (começa e nunca termina), o app destrava e fala de novo", async ({ page }) => {
  // Fake iOS engine: the first word starts and then hangs forever ("speaking" with no sound).
  await page.addInitScript(() => {
    const w = window as unknown as { __done: string[] };
    w.__done = [];
    let hung = false;
    let talking: SpeechSynthesisUtterance | null = null;
    Object.defineProperty(speechSynthesis, "speaking", { get: () => !!talking });
    Object.defineProperty(speechSynthesis, "pending", { get: () => false });
    speechSynthesis.speak = (u: SpeechSynthesisUtterance) => {
      if (!u.text.trim()) return;
      talking = u;
      setTimeout(() => u.dispatchEvent(new Event("start")), 20);
      if (!hung) {
        hung = true; // never ends
        return;
      }
      setTimeout(() => {
        if (talking !== u) return;
        talking = null;
        w.__done.push(u.text);
        u.dispatchEvent(new Event("end"));
      }, 300);
    };
    speechSynthesis.cancel = () => {
      talking = null;
    };
  });
  await createChild(page, { canRead: true });
  await openPhase(page);
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __done: string[] }).__done), { timeout: 8000 })
    .toContain("Dog");
});

test("R29 depois que a palavra termina normalmente, ela não é repetida sozinha", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __spoken: string[] };
    w.__spoken = [];
    let talking = false;
    Object.defineProperty(speechSynthesis, "speaking", { get: () => talking });
    Object.defineProperty(speechSynthesis, "pending", { get: () => false });
    speechSynthesis.speak = (u: SpeechSynthesisUtterance) => {
      if (!u.text.trim()) return;
      w.__spoken.push(u.text);
      talking = true;
      setTimeout(() => u.dispatchEvent(new Event("start")), 20);
      setTimeout(() => {
        talking = false;
        u.dispatchEvent(new Event("end"));
      }, 400);
    };
    speechSynthesis.cancel = () => {
      talking = false;
    };
  });
  await createChild(page, { canRead: true });
  await openPhase(page);
  await page.waitForTimeout(6000); // longer than the "stuck" timeout
  expect(await page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken)).toEqual(["Dog"]);
});

test("R30 visual 'Dia ensolarado': fundo claro, texto escuro e botões principais 3D", async ({ page }) => {
  await seed(page);
  const look = await page.evaluate(() => {
    const lum = (c: string) => {
      const [r, g, b] = c.match(/\d+(\.\d+)?/g)!.map(Number);
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    };
    const css = getComputedStyle(document.documentElement);
    return {
      background: lum(getComputedStyle(document.body).backgroundColor),
      text: lum(getComputedStyle(document.body).color),
      radius: parseFloat(css.getPropertyValue("--radius")),
    };
  });
  expect(look.background).toBeGreaterThan(0.85);
  expect(look.text).toBeLessThan(0.3);
  expect(look.radius).toBeGreaterThanOrEqual(1.5);
  await openPhase(page);
  const shadow = await page.getByRole("button", { name: /Próxima|Fazer o quiz/ }).evaluate((b) => getComputedStyle(b).boxShadow);
  expect(shadow).toMatch(/0px 6px 0px/);
});

test("R31 versão oficial não mostra o texto da versão; a de teste mostra", async ({ page }) => {
  await seed(page);
  await expect(page.getByText(/novos níveis em breve/)).toBeVisible();
  await expect(page.getByText(/versão /)).toHaveCount(0);
  await page.goto("http://localhost:4174/");
  await page.getByPlaceholder("Ex.: Lia").fill("Teste");
  await page.getByText("Menino", { exact: true }).click();
  await page.getByText("Ainda não", { exact: true }).click();
  await page.getByText("Começar a aventura").click();
  await expect(page.getByText(/versão .* \(teste\)/)).toBeVisible();
});

test("R32 usa a voz Ava (a melhor versão instalada) em vez da Samantha", async ({ page }) => {
  // Voices as an iPhone with Ava downloaded reports them.
  await page.addInitScript(() => {
    const voices = [
      { name: "Samantha", lang: "en-US", default: true, localService: true, voiceURI: "samantha" },
      { name: "Ava (Aprimorada)", lang: "en-US", default: false, localService: true, voiceURI: "ava-enhanced" },
      { name: "Ava (Premium)", lang: "en-US", default: false, localService: true, voiceURI: "ava-premium" },
      { name: "Luciana", lang: "pt-BR", default: false, localService: true, voiceURI: "luciana" },
    ];
    speechSynthesis.getVoices = () => voices as unknown as SpeechSynthesisVoice[];
  });
  await seed(page);
  await page.getByRole("button", { name: "Área dos pais" }).click();
  const [a, b] = (await page.getByText(/Quanto é/).textContent())!.match(/\d+/g)!.map(Number);
  await page.getByPlaceholder("Resposta").fill(String(a + b));
  await page.getByText("Entrar").click();
  await page.getByRole("button", { name: "Falas" }).click();
  await expect(page.getByTestId("sound-check")).toContainText("Ava (Premium)");
  // The panel lists every English voice the phone offers, to diagnose a voice that is not offered to web apps.
  await page.getByText("Vozes em inglês que o aparelho liberou").click();
  await expect(page.getByTestId("voice-list")).toContainText("Samantha (en-US)");
  await expect(page.getByTestId("voice-list")).not.toContainText("Luciana");
});

test("R33 palavras tocam o áudio gravado (ElevenLabs) pelo Web Audio, e a voz do aparelho fica só de reserva", async ({
  page,
}) => {
  await allowVoiceClips(page);
  await createChild(page, { canRead: true });
  await openPhase(page);
  // The learn screen says the first word by itself: it comes from the recorded MP3, not speechSynthesis.
  await expect.poll(async () => (await clips(page)).length).toBeGreaterThan(0);
  expect((await clips(page))[0]).toBeGreaterThan(0.3);
  await page.waitForTimeout(800);
  expect((await said(page)).map((s) => s.text)).not.toContain("Dog");
  // Tapping 🔊 plays the clip again.
  const before = (await clips(page)).length;
  await page.getByRole("button", { name: /Ouvir/ }).first().click();
  await expect.poll(async () => (await clips(page)).length).toBeGreaterThan(before);
  // In the quiz the right answer is said from the clip too, and "Continuar" waits for it.
  await finishLearning(page);
  await clearSaid(page);
  const inQuiz = (await clips(page)).length;
  await answer(page);
  await expect(page.getByRole("button", { name: /^(Continuar|Ver resultado)$/ })).toBeVisible();
  expect((await clips(page)).length).toBeGreaterThan(inQuiz);
  expect((await said(page)).map((s) => s.text)).toEqual([]);
});

test("R34 se o áudio gravado não carregar, a palavra é dita pela voz do aparelho", async ({ page }) => {
  // instrument() blocks the MP3s, like a failed download.
  await createChild(page, { canRead: true });
  await openPhase(page);
  await expect.poll(async () => (await said(page)).map((s) => s.text)).toContain("Dog");
  expect(await clips(page)).toEqual([]);
});

test("R35 se o áudio estiver bloqueado por um instante (iPhone depois de uma fala), espera e toca o gravado", async ({
  page,
}) => {
  await allowVoiceClips(page);
  // Like iOS: speech (even the blank one that unlocks the voice) leaves Web Audio "interrupted" for a moment.
  await page.addInitScript(() => {
    const w = window as unknown as { __blocked: boolean };
    w.__blocked = false;
    const desc = Object.getOwnPropertyDescriptor(BaseAudioContext.prototype, "state")!;
    Object.defineProperty(BaseAudioContext.prototype, "state", {
      get() {
        return w.__blocked ? "interrupted" : desc.get!.call(this);
      },
    });
  });
  await createChild(page, { canRead: true });
  await openPhase(page);
  await expect.poll(async () => (await clips(page)).length).toBeGreaterThan(0);
  await clearSaid(page);
  const before = (await clips(page)).length;
  await page.evaluate(() => {
    (window as unknown as { __blocked: boolean }).__blocked = true;
    setTimeout(() => ((window as unknown as { __blocked: boolean }).__blocked = false), 600);
  });
  await page.getByRole("button", { name: /Ouvir/ }).first().click();
  await expect.poll(async () => (await clips(page)).length).toBeGreaterThan(before);
  expect((await said(page)).map((s) => s.text)).not.toContain("Dog");
});

test("R36 áudio gravado numa velocidade calma (o 'Dog' dura pelo menos 0,9 s)", async ({ page }) => {
  await allowVoiceClips(page);
  await createChild(page, { canRead: true });
  await openPhase(page);
  await expect.poll(async () => (await clips(page)).length).toBeGreaterThan(0);
  expect((await clips(page))[0]).toBeGreaterThanOrEqual(0.9);
});

/** Opens the test version (port 4174) with a saved profile and no progress. */
async function openTestVersion(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "teste:sprout-profile",
      JSON.stringify({ id: "local", name: "Lia", age: 5, sex: "girl", can_read: true }),
    );
  });
  await page.goto("http://localhost:4174/");
  await expect(page.getByText("Escolha seu nível")).toBeVisible();
}

test("R37 versão de teste: todas as fases e níveis liberados, sem progresso", async ({ page }) => {
  await openTestVersion(page);
  await expect(page.getByRole("button", { name: /Nível 2 Números/ })).toBeEnabled();
  await page.getByRole("button", { name: /Nível 1/ }).click();
  await expect(page.getByRole("button", { name: /Animal 10\b/ })).toBeEnabled();
  await page.goto("http://localhost:4174/");
  await page.getByRole("button", { name: /Nível 2 Números/ }).click();
  await expect(page.getByRole("button", { name: /Número 7\b/ })).toBeEnabled();
});

test("R38 versão de teste: Área dos Pais abre sem a conta; a real continua pedindo", async ({ page }) => {
  await openTestVersion(page);
  await page.getByRole("button", { name: "Área dos pais" }).click();
  await expect(page.getByRole("button", { name: "Falas" })).toBeVisible();
  await expect(page.getByText(/Quanto é/)).toHaveCount(0);

  await seed(page);
  await page.getByRole("button", { name: "Área dos pais" }).click();
  await expect(page.getByText(/Quanto é/)).toBeVisible();
});

test("R39 versão de teste: Área dos Pais lista todos os animais, números e cores com imagem e toca o áudio de cada um", async ({
  page,
}) => {
  await allowVoiceClips(page);
  await openTestVersion(page);
  await page.getByRole("button", { name: "Área dos pais" }).click();
  await page.getByRole("button", { name: "Falas" }).click();
  const words = page.getByTestId("all-words").getByRole("button");
  await expect(words).toHaveCount(36);
  await expect(page.getByTestId("all-words").locator("img")).toHaveCount(36);
  for (const name of ["Elephant", "Ten", "Purple"]) {
    const before = (await clips(page)).length;
    await page.getByRole("button", { name: `Ouvir ${name}` }).click();
    await expect.poll(async () => (await clips(page)).length).toBeGreaterThan(before);
  }
  expect((await said(page)).map((s) => s.text)).toEqual([]);
});

test("R40 mapa limpo: só os brotos, sem caixa de texto, e o broto da vez pisca como botão", async ({ page }) => {
  await seed(page, { completed: [1, 2] });
  await page.getByRole("button", { name: /Nível 1/ }).first().click();
  const map = page.getByTestId("phase-map");
  await expect(map.getByRole("button")).toHaveCount(10);
  // No phase number, title or word list written on the map.
  await expect(map.getByText(/Fase \d/)).toHaveCount(0);
  await expect(map.getByText(/Animal \d/)).toHaveCount(0);
  await expect(page.getByText(/Complete as \d+ fases/)).toHaveCount(0);
  // Only the current phase (3) beckons; it opens the phase when tapped.
  const current = map.locator("[data-current]");
  await expect(current).toHaveCount(1);
  await expect(current).toHaveAttribute("data-phase", "3");
  await expect(current.locator(".animate-beckon")).toHaveCount(1);
  await expect(map.locator(".animate-beckon")).toHaveCount(1);
  await current.click();
  await expect(page.getByText("Começar a brotar")).toBeVisible();
});

test("R41 ao bloquear o celular (app em segundo plano) a música e o áudio param; ao voltar, a música volta", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // Which <audio> elements are playing, and the audio contexts the app made.
    const w = window as unknown as { __media: Set<HTMLMediaElement>; __ctxs: AudioContext[]; __hidden: boolean };
    w.__media = new Set();
    w.__ctxs = [];
    w.__hidden = false;
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      w.__media.add(this);
      return play.call(this);
    };
    const pause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.pause = function () {
      w.__media.delete(this);
      return pause.call(this);
    };
    const Ctx = window.AudioContext;
    window.AudioContext = class extends Ctx {
      constructor(o?: AudioContextOptions) {
        super(o);
        w.__ctxs.push(this);
      }
    } as typeof AudioContext;
    Object.defineProperty(document, "visibilityState", { get: () => (w.__hidden ? "hidden" : "visible") });
    Object.defineProperty(document, "hidden", { get: () => w.__hidden });
  });
  const setHidden = (hidden: boolean) =>
    page.evaluate((h) => {
      (window as unknown as { __hidden: boolean }).__hidden = h;
      document.dispatchEvent(new Event("visibilitychange"));
    }, hidden);
  const state = () =>
    page.evaluate(() => {
      const w = window as unknown as { __media: Set<HTMLMediaElement>; __ctxs: AudioContext[] };
      return { media: [...w.__media].filter((m) => !m.paused).length, ctx: w.__ctxs.map((c) => c.state) };
    });

  await seed(page);
  await page.getByText("Escolha seu nível").click(); // first tap unlocks audio
  expect(await notesDuring(page, 1500)).toBeGreaterThan(5);
  expect((await state()).media).toBeGreaterThan(0); // the silent keep-alive for the silent switch

  await setHidden(true);
  await page.waitForTimeout(500);
  expect(await state()).toEqual({ media: 0, ctx: ["suspended"] });
  expect(await notesDuring(page, 1500)).toBe(0);

  await setHidden(false);
  await page.getByText("Escolha seu nível").click(); // iOS may need a tap to restart sound
  expect(await notesDuring(page, 1500)).toBeGreaterThan(5);
});

test("R42 iPhone novo (com audioSession): nada de <audio> tocando, então não aparece player na tela bloqueada", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __played: number; __hidden: boolean };
    w.__played = 0;
    w.__hidden = false;
    HTMLMediaElement.prototype.play = function () {
      w.__played++;
      return Promise.resolve();
    };
    Object.defineProperty(navigator, "audioSession", { value: { type: "auto" } });
    Object.defineProperty(document, "visibilityState", { get: () => (w.__hidden ? "hidden" : "visible") });
  });
  const session = () => page.evaluate(() => (navigator as Navigator & { audioSession: { type: string } }).audioSession.type);
  await seed(page);
  await page.getByText("Escolha seu nível").click(); // first tap unlocks audio
  expect(await notesDuring(page, 1500)).toBeGreaterThan(5);
  expect(await session()).toBe("playback"); // plays through the silent switch
  expect(await page.evaluate(() => (window as unknown as { __played: number }).__played)).toBe(0);
  // Locking the phone hands the audio session back, so nothing stays on the lock screen.
  await page.evaluate(() => {
    (window as unknown as { __hidden: boolean }).__hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(await session()).toBe("auto");
});

test("R43 Área dos Pais tem a aba 'Falas' com o teste de som; as outras abas não mostram o teste", async ({ page }) => {
  await openTestVersion(page);
  await page.getByRole("button", { name: "Área dos pais" }).click();
  await expect(page.getByRole("button", { name: "Histórico" })).toBeVisible();
  await expect(page.getByTestId("sound-check")).toHaveCount(0);
  await expect(page.getByTestId("all-words")).toHaveCount(0);
  await page.getByRole("button", { name: "Falas" }).click();
  await expect(page.getByTestId("sound-check")).toBeVisible();
  await expect(page.getByTestId("all-words")).toBeVisible();
  await page.getByRole("button", { name: "Cadastro" }).click();
  await expect(page.getByTestId("sound-check")).toHaveCount(0);
});

test("R44 versão de teste: 'Escolher vozes' toca o atual e as gravações novas, guarda a escolhida e o app passa a usá-la", async ({
  page,
}) => {
  // Works with whatever word is under evaluation (src/assets/voice-takes/<id>-<take>.mp3).
  await allowVoiceClips(page);
  const mp3s: string[] = [];
  page.on("request", (r) => r.url().endsWith(".mp3") && mp3s.push(r.url().slice(r.url().lastIndexOf("/") + 1)));
  await openTestVersion(page);
  await page.getByRole("button", { name: "Área dos pais" }).click();
  await page.getByRole("button", { name: "Falas" }).click();
  const picker = page.getByTestId("voice-picker");
  await expect(picker).toBeVisible();
  if ((await picker.getByTestId("voice-word").count()) === 0) {
    // Nothing under evaluation right now: the section says so (the rest runs whenever takes exist).
    await expect(picker).toContainText("Nenhuma voz em avaliação");
    return;
  }
  const word = picker.getByTestId("voice-word").first();
  const id = (await word.getAttribute("data-word"))!;
  const options = word.getByRole("button", { name: /, versão [A-Z]$/ });
  expect(await options.count()).toBeGreaterThanOrEqual(2);
  const [first, last] = [(await options.first().getAttribute("aria-label"))!, (await options.last().getAttribute("aria-label"))!];
  const en = first.split(",")[0];
  const [t1, t2] = [first.slice(-1), last.slice(-1)];
  // Each option plays its own recording.
  const before = (await clips(page)).length;
  await options.last().click();
  await expect.poll(async () => (await clips(page)).length).toBeGreaterThan(before);
  expect(mp3s.some((u) => u.startsWith(`${id}-${t2.toLowerCase()}-`))).toBe(true);
  // Choosing another take is remembered and shown in the summary to send.
  await word.getByRole("radio", { name: `Usar ${t1}`, exact: true }).check();
  await expect(picker.getByTestId("voice-summary")).toContainText(`${en}: ${t1}`);
  mp3s.length = 0;
  await page.reload();
  await page.getByRole("button", { name: "Área dos pais" }).click();
  await page.getByRole("button", { name: "Falas" }).click();
  await expect(page.locator(`[data-word="${id}"]`).getByRole("radio", { name: `Usar ${t1}`, exact: true })).toBeChecked();
  // The app now says the word with that take (preloaded on the first tap after the reload).
  const n = (await clips(page)).length;
  await page.getByRole("button", { name: `Ouvir ${en}`, exact: true }).click();
  await expect.poll(async () => (await clips(page)).length).toBeGreaterThan(n);
  expect(mp3s.some((u) => u.startsWith(`${id}-${t1.toLowerCase()}-`))).toBe(true);
});

test("R45 versão oficial não tem 'Escolher vozes' nem carrega as gravações em avaliação", async ({ page }) => {
  await allowVoiceClips(page);
  const takes: string[] = [];
  page.on("request", (r) => /\/[a-z]+-[a-z]-[A-Za-z0-9_-]{8}\.mp3$/.test(r.url()) && takes.push(r.url()));
  await seed(page);
  await page.getByRole("button", { name: "Área dos pais" }).click();
  const [a, b] = (await page.getByText(/Quanto é/).textContent())!.match(/\d+/g)!.map(Number);
  await page.getByPlaceholder("Resposta").fill(String(a + b));
  await page.getByText("Entrar").click();
  await page.getByRole("button", { name: "Falas" }).click();
  await expect(page.getByTestId("sound-check")).toBeVisible();
  await expect(page.getByTestId("voice-picker")).toHaveCount(0);
  expect(takes).toEqual([]);
});

test("R46 nível 3 bloqueado até completar a Cerejeira (6 de 7 fases do nível 2)", async ({ page }) => {
  await seed(page, { completed: [...range(1, 10), ...range(201, 206)] });
  await expect(page.getByRole("button", { name: /Nível 3/ })).toBeDisabled();
});

test("R46 nível 3 = cores: liberado ao completar a Cerejeira, 7 fases, figuras das manchas e só as 11 cores", async ({
  page,
}) => {
  const colors = ["red", "blue", "yellow", "green", "orange", "purple", "pink", "brown", "black", "white", "gray"];
  await seed(page, { completed: [...range(1, 10), ...range(201, 207)] });
  await page.getByRole("button", { name: /Nível 3/ }).click();
  await expect(page.getByRole("heading", { name: "Nível 3" })).toBeVisible();
  await expect(page.getByTestId("phase-map").getByRole("button", { name: /Cor \d+/ })).toHaveCount(7);
  await page.getByRole("button", { name: /Cor 1\b/ }).click();
  await page.getByText("Começar a brotar").click();
  const red = page.getByRole("img", { name: "Red" });
  await expect(red).toBeVisible();
  expect(await red.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await finishLearning(page);
  for (;;) {
    const quiz = page.getByTestId("quiz");
    expect(colors).toContain(await quiz.getAttribute("data-answer"));
    for (const id of await quiz.locator("[data-word]").evaluateAll((els) => els.map((e) => e.getAttribute("data-word"))))
      expect(colors).toContain(id);
    await answer(page, true);
    if (await next(page)) break;
  }
  await expect(page.getByText("100%")).toBeVisible();
});

test("R48 fase com 100%: 'Perfeito!', elogio na voz gravada, estrelas com som e as figuras da fase para ouvir de novo", async ({
  page,
}) => {
  await allowVoiceClips(page);
  await createChild(page, { canRead: true });
  await openPhase(page);
  await finishLearning(page);
  for (;;) {
    await answer(page);
    const button = page.getByRole("button", { name: /^(Continuar|Ver resultado)$/ });
    if ((await button.textContent()) === "Ver resultado") break;
    await button.click();
  }
  await clearSaid(page);
  const before = (await clips(page)).length;
  const notesBefore = await notes(page);
  await page.getByRole("button", { name: "Ver resultado" }).click();
  await expect(page.getByText("100%")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Perfeito!" })).toBeVisible();
  // The praise ("Perfect!") is the recorded voice, not the phone's.
  await expect.poll(async () => (await clips(page)).length).toBeGreaterThan(before);
  await page.waitForTimeout(1500);
  expect((await said(page)).map((s) => s.text)).toEqual([]);
  // A chime per star on top of the fanfare.
  expect((await notes(page)) - notesBefore).toBeGreaterThanOrEqual(20);
  // The phase's figures, each with its picture; tapping one says the word again.
  const words = page.getByTestId("result-words").getByRole("button");
  expect(await words.count()).toBeGreaterThanOrEqual(2);
  await expect(page.getByTestId("result-words").locator("img")).toHaveCount(await words.count());
  const n = (await clips(page)).length;
  await words.first().click();
  await expect.poll(async () => (await clips(page)).length).toBeGreaterThan(n);
});

test("R49 fase aprovada sem 100% não mostra 'Perfeito!'", async ({ page }) => {
  await createChild(page, { canRead: true });
  await openPhase(page);
  await finishLearning(page);
  let first = true;
  for (;;) {
    await answer(page, !first);
    first = false;
    if (await next(page)) break;
  }
  await expect(page.getByText(/^\d+%$/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Perfeito!" })).toHaveCount(0);
});

test("R50 fim de fase: o elogio gravado toca sozinho, sem fanfarra nem 'plim' de estrela por cima", async ({ page }) => {
  await allowVoiceClips(page);
  // When each oscillator note starts, and when the praise clip starts and how long it is (audio clock).
  await page.addInitScript(() => {
    const w = window as unknown as { __noteTimes: number[]; __clipSpans: [number, number][] };
    w.__noteTimes = [];
    w.__clipSpans = [];
    const osc = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (when?: number) {
      w.__noteTimes.push(Math.max(when ?? 0, this.context.currentTime));
      return osc.call(this, when);
    };
    const src = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (when?: number, ...rest: number[]) {
      if (this.buffer && this.buffer.duration > 0.3 && this.buffer.duration !== 1)
        w.__clipSpans.push([this.context.currentTime, this.context.currentTime + this.buffer.duration]);
      return src.call(this, when, ...rest);
    };
  });
  await createChild(page, { canRead: true });
  await openPhase(page);
  await finishLearning(page);
  for (;;) {
    await answer(page);
    const button = page.getByRole("button", { name: /^(Continuar|Ver resultado)$/ });
    if ((await button.textContent()) === "Ver resultado") break;
    await button.click();
  }
  const clipsBefore = (await clips(page)).length;
  await page.getByRole("button", { name: "Ver resultado" }).click();
  await expect.poll(async () => (await clips(page)).length, { timeout: 8000 }).toBeGreaterThan(clipsBefore);
  await page.waitForTimeout(2000);
  const { notes: times, spans } = await page.evaluate(() => {
    const w = window as unknown as { __noteTimes: number[]; __clipSpans: [number, number][] };
    return { notes: w.__noteTimes, spans: w.__clipSpans };
  });
  const [start, end] = spans[spans.length - 1];
  const during = times.filter((t) => t > start - 0.05 && t < end);
  expect(during).toEqual([]);
});

test.describe("no fuso do Brasil", () => {
  test.use({ timezoneId: "America/Sao_Paulo" });

  test("R51 sequência de dias usa o dia do Brasil: jogar às 22h conta como hoje, não amanhã", async ({ page }) => {
    // 20/10 às 22:30 em São Paulo = 21/10 01:30 em UTC.
    await page.clock.setFixedTime(new Date("2026-10-21T01:30:00Z"));
    await page.addInitScript(() => {
      if (sessionStorage.getItem("seeded")) return;
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem(
        "sprout-profile",
        JSON.stringify({ id: "local", name: "Lia", age: 5, sex: "girl", can_read: true }),
      );
      localStorage.setItem(
        "sprout-progress-v2",
        JSON.stringify({ phases: {}, xp: 0, streak: 3, lastPlayed: "2026-10-19", wrongWords: {} }),
      );
    });
    await page.goto("./");
    await openPhase(page);
    await finishLearning(page);
    await playQuiz(page);
    await expect(page.getByText("100%")).toBeVisible();
    const progress = await page.evaluate(() => JSON.parse(localStorage.getItem("sprout-progress-v2")!));
    expect(progress.lastPlayed).toBe("2026-10-20");
    expect(progress.streak).toBe(4);
  });
});

test("R52 se uma tela der erro, aparece uma tela amigável com 'Tentar de novo' em vez de tela branca", async ({ page }) => {
  page.on("pageerror", () => {}); // the crash is expected
  await page.addInitScript(() => {
    localStorage.setItem(
      "sprout-profile",
      JSON.stringify({ id: "local", name: "Lia", age: 5, sex: "girl", can_read: true }),
    );
    // Damaged saved data that makes the levels screen crash.
    localStorage.setItem("sprout-progress-v2", JSON.stringify({ phases: null, xp: 0, streak: 0 }));
  });
  await page.goto("./");
  await expect(page.getByText("Ops! Algo deu errado")).toBeVisible();
  const retry = page.getByRole("button", { name: "Tentar de novo" });
  await expect(retry).toBeVisible();
  const reloaded = page.waitForEvent("load");
  await retry.click();
  await reloaded;
});

test.describe("com o cache offline ligado", () => {
  test.use({ serviceWorkers: "allow" });

  test("R53 figuras leves (WebP) e o app abre sem internet depois da primeira visita, com figuras e áudios", async ({
    page,
    context,
  }) => {
    await page.unroute("**/*.mp3"); // the recordings must come from the offline cache too
    await seed(page);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      // Wait until the worker controls the page (it claims it once everything is cached).
      if (!navigator.serviceWorker.controller)
        await new Promise((r) => navigator.serviceWorker.addEventListener("controllerchange", r, { once: true }));
    });
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText("Escolha seu nível")).toBeVisible();
    // A word never shown before still has its picture and its recording.
    await openPhase(page);
    const dog = page.getByRole("img", { name: "Dog" });
    await expect(dog).toBeVisible();
    expect(await dog.getAttribute("src")).toMatch(/\.webp$/);
    expect(await dog.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    const mp3 = await page.evaluate(async () => {
      const url = [...performance.getEntriesByType("resource")].map((e) => e.name).find((n) => n.endsWith(".mp3"));
      return url ? (await fetch(url)).ok : false;
    });
    expect(mp3).toBe(true);
  });
});

test("R54 tela de aprender não mostra a transcrição fonética (/faɪv/), só a palavra e a tradução", async ({ page }) => {
  await createChild(page, { canRead: true });
  await openPhase(page);
  await expect(page.getByText("Dog", { exact: true })).toBeVisible();
  await expect(page.getByText("Cachorro", { exact: true })).toBeVisible();
  await expect(page.getByText("/dɒɡ/")).toHaveCount(0);
});
