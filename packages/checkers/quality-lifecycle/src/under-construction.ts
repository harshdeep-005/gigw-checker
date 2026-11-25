/**
 * Checker: under-construction
 * Clause: 5.4.8 — No "under construction" pages.
 * Automation: automatable
 * Severity: low
 * Owner: Member B (B-007)
 *
 * Strategy: look for common "under construction" / "coming soon" text
 * patterns in the page body.
 */

import type { CheckerModule, CheckerContext } from "./types.js";
import type { CheckerResult } from "@gigw/db";

const CHECKER_ID = "under-construction";
const CLAUSE_ID = "5.4.8";

const PATTERNS = [
  /under\s+construction/i,
  /coming\s+soon/i,
  /page\s+is\s+(?:being\s+)?(?:updated|developed|built)/i,
  /work\s+in\s+progress/i,
  /site\s+(?:is\s+)?under\s+maintenance/i,
  /निर्माणाधीन/, // "under construction" in Hindi
];

export const underConstructionChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  run(ctx: CheckerContext): Promise<CheckerResult[]> {
    const html = ctx.html;
    const matchedPattern = PATTERNS.find((re) => re.test(html));

    const result: CheckerResult = {
      id: "",
      clauseId: CLAUSE_ID,
      pageUrl: ctx.pageUrl,
      status: matchedPattern !== undefined ? "fail" : "pass",
      severity: "low",
      evidence:
        matchedPattern !== undefined
          ? `"Under construction" text detected on page: matched "${String(matchedPattern)}".`
          : "No 'under construction' or 'coming soon' text detected.",
      detail: { matchedPattern: matchedPattern ? String(matchedPattern) : null },
      checkedAt: new Date(),
      pageReportId: null,
    };

    return Promise.resolve([result]);
  },
};
