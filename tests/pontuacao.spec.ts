// Scoring rules from the recreation guide (section 4). Pure functions, no browser.
import { expect, test } from "@playwright/test";
import { scoreFor, starsFor, xpFor } from "../src/lib/scoring";

test("R05 estrelas nos limites 59/60/79/80/94/95", () => {
  expect([59, 60, 79, 80, 94, 95, 100].map(starsFor)).toEqual([0, 1, 1, 2, 2, 3, 3]);
});

test("R05 XP por tentativa: nota/5 + 10 se passou", () => {
  expect(xpFor(100, true)).toBe(30);
  expect(xpFor(80, true)).toBe(26);
  expect(xpFor(70, true)).toBe(24);
  expect(xpFor(60, false)).toBe(12);
});

test("R05 nota arredondada", () => {
  expect(scoreFor(2, 3)).toBe(67);
  expect(scoreFor(5, 5)).toBe(100);
  expect(scoreFor(0, 0)).toBe(0);
});
