/**
 * Checker: quality-stale-content
 * Clause:  5.1.8 — Outdated content must be removed or archived.
 * Automation: semi-automatable | Severity: medium | Owner: B
 *
 * Strategy: heuristic — look for year references significantly in the past (>2 years),
 * "archived", "deprecated", "old version" text, or stale copyright years.
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "quality-stale-content";
const CLAUSE_ID = "5.1.8";

export const staleContentChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],
  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const staleYearRe = new RegExp(`\\b(${String(currentYear - 3)}|${String(currentYear - 4)}|${String(currentYear - 5)})\\b`);
    const archiveRe = /\b(archived|deprecated|outdated|old\s+version|superseded)\b/i;

    const bodyText = (await ctx.page.evaluate(() => document.body.textContent ?? "")).slice(0, 50_000);

    const hasStaleYear = staleYearRe.test(bodyText);
    const hasArchiveText = archiveRe.test(bodyText);

    if (hasStaleYear || hasArchiveText) {
      return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "needs_review", severity: "medium",
        evidence: `Potentially outdated content signals detected: ${[hasStaleYear ? `year references ≤ ${String(currentYear - 3)}` : "", hasArchiveText ? "archive/deprecated language" : ""].filter(Boolean).join(", ")}. Verify content is current or properly archived.`,
        detail: { hasStaleYear, hasArchiveText }, checkedAt: now }];
    }

    return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "needs_review", severity: "medium",
      evidence: "No obvious stale content signals detected. Manual review recommended to confirm all content is current.",
      detail: null, checkedAt: now }];
  },
};
