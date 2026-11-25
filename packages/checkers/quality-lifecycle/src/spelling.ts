/**
 * Checker: quality-spelling
 * Clause:  5.1.25 — Content must be free from spelling/grammatical errors.
 * Automation: semi-automatable | Severity: low | Owner: B
 *
 * Strategy: heuristic — detect common patterns that indicate copy-paste
 * or placeholder text, repeated words, obvious misspellings in key UI text.
 * Full grammar checking requires a language API (Phase 5 enhancement).
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "quality-spelling";
const CLAUSE_ID = "5.1.25";
const PLACEHOLDER_RE = /\b(lorem ipsum|placeholder|todo|fixme|tbd|coming soon|under construction)\b/i;
const REPEATED_WORD_RE = /\b(\w{3,})\s+\1\b/i;

export const spellingChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],
  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();
    const bodyText = (await ctx.page.evaluate(() => document.body.textContent ?? "")).slice(0, 20_000);
    const issues: string[] = [];

    if (PLACEHOLDER_RE.test(bodyText)) {
      const match = PLACEHOLDER_RE.exec(bodyText);
      issues.push(`Placeholder/incomplete text detected: "${match?.[0] ?? ""}"`);
    }

    const repeated = REPEATED_WORD_RE.exec(bodyText);
    if (repeated) issues.push(`Repeated word detected: "${repeated[0]}"`);

    if (issues.length > 0) {
      return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "needs_review", severity: "low",
        evidence: `Potential spelling/content issues: ${issues.join("; ")}. Full grammar review required.`,
        detail: { issues }, checkedAt: now }];
    }

    return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "needs_review", severity: "low",
      evidence: "No obvious placeholder or repeated-word patterns detected. Full spelling/grammar review requires manual or API-based checking.",
      detail: null, checkedAt: now }];
  },
};
