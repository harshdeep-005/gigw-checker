/**
 * Checker: lifecycle-content-moderation
 * Clause:  5.4.5 — Content must be free of offensive/discriminatory language.
 * Automation: semi-automatable | Severity: high | Owner: B
 *
 * Strategy: keyword scan for obviously inappropriate content patterns.
 * Note: heuristic only — full toxicity analysis requires a content moderation API.
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "lifecycle-content-moderation";
const CLAUSE_ID = "5.4.5";

// Very conservative list — only the most obvious patterns
const OFFENSIVE_PATTERNS = [
  /\b(hate\s+speech|racial\s+slur|discriminat[eo]ry)\b/i,
  /\b(offensive\s+content|vulgar|obscen[ei])\b/i,
];

export const contentModerationChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],
  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();
    const bodyText = ctx.html.slice(0, 50_000);
    const found = OFFENSIVE_PATTERNS.filter((re) => re.test(bodyText));

    if (found.length > 0) {
      return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "needs_review", severity: "high",
        evidence: "Potential offensive/discriminatory content patterns detected. Manual review required.",
        detail: null, checkedAt: now }];
    }

    return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "needs_review", severity: "high",
      evidence: "No obviously offensive patterns detected in automated scan. Full content moderation requires manual review or a content moderation API.",
      detail: null, checkedAt: now }];
  },
};
