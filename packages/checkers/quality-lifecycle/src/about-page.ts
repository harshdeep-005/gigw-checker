/**
 * Checker: about-page
 * Clause: 5.1.9 — An "About Us" section must be present and accessible.
 * Automation: semi (presence automatable; currency manual)
 * Severity: low
 * Owner: Member B (B-006)
 */

import type { CheckerModule, CheckerContext } from "./types.js";
import type { CheckerResult } from "@gigw/db";

const CHECKER_ID = "about-page";
const CLAUSE_ID = "5.1.9";

const ABOUT_LINK_RE = /<a\s[^>]*>([^<]*(?:about\s*us|about\s+the|हमारे\s+बारे)[^<]*)<\/a>/i;
const ABOUT_HREF_RE = /<a\s[^>]*href=["']([^"']*about[^"']*)["'][^>]*>/i;

export const aboutPageChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  run(ctx: CheckerContext): Promise<CheckerResult[]> {
    const html = ctx.html;
    const textMatch = ABOUT_LINK_RE.exec(html);
    const hrefMatch = ABOUT_HREF_RE.exec(html);
    const found = textMatch !== null || hrefMatch !== null;

    const result: CheckerResult = {
      id: "",
      clauseId: CLAUSE_ID,
      pageUrl: ctx.pageUrl,
      status: found ? "needs_review" : "fail",
      severity: "low",
      evidence: found
        ? `"About Us" link found — verify that the section is kept up to date. Link: "${hrefMatch?.[1] ?? textMatch?.[1] ?? ""}"`
        : 'No "About Us" link found on the page.',
      detail: { href: hrefMatch?.[1] ?? null, linkText: textMatch?.[1]?.trim() ?? null },
      checkedAt: new Date(),
      pageReportId: null,
    };

    return Promise.resolve([result]);
  },
};
