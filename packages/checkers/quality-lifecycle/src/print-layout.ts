/**
 * Checker: quality-print
 * Clause:  5.1.20 — Content must print correctly on A4.
 * Automation: semi-automatable | Severity: low | Owner: B
 *
 * Strategy: check for presence of @media print stylesheet.
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "quality-print";
const CLAUSE_ID = "5.1.20";

export const printLayoutChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],
  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();
    const hasPrintMedia = ctx.html.includes("@media print") || ctx.html.includes("media=\"print\"") || ctx.html.includes("media='print'");

    return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "needs_review", severity: "low",
      evidence: hasPrintMedia
        ? "@media print stylesheet detected. Verify content renders correctly on A4 by printing a test page."
        : "No @media print stylesheet detected. Content may not print correctly on A4. Consider adding print-specific CSS.",
      detail: { hasPrintMedia }, checkedAt: now }];
  },
};
