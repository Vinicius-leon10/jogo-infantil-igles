/** Quiz scoring rules (see the recreation guide, section 4). */

export type Stars = 0 | 1 | 2 | 3;

/** Percentage of right answers, rounded. */
export function scoreFor(correct: number, total: number): number {
  return total ? Math.round((correct / total) * 100) : 0;
}

/** Below 60: 0 stars · 60–79: 1 · 80–94: 2 · 95+: 3. */
export function starsFor(score: number): Stars {
  return score >= 95 ? 3 : score >= 80 ? 2 : score >= 60 ? 1 : 0;
}

/** XP for one attempt: score/5 rounded, plus 10 when the phase is passed. */
export function xpFor(score: number, passed: boolean): number {
  return Math.round(score / 5) + (passed ? 10 : 0);
}
