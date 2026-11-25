/**
 * Checker: quality-help-link
 * Clause:  5.1.14 — Help section must be linked from all pages in a consistent location.
 * Automation: semi-automatable | Severity: low | Owner: B
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "quality-help-link";
const CLAUSE_ID = "5.1.14";
const HELP_RE = /\b(help|faq|frequently\s+asked|support|assistance|guide|how.to)\b/i;

export const helpLinkChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],
  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();
    const helpLinks = await ctx.page.$$eval("a[href]", (anchors) =>
      anchors
        .filter((a) => /\b(help|faq|frequently|support|assistance|guide|how.to)\b/i.test(a.textContent ?? "") ||
                       /\b(help|faq|support)\b/i.test((a as HTMLAnchorElement).href))
        .map((a) => ({ text: (a.textContent ?? "").trim().slice(0, 60), href: (a as HTMLAnchorElement).href.slice(0, 80) }))
        .slice(0, 5),
    );

    if (helpLinks.length === 0) {
      return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "fail", severity: "low",
        evidence: "No help/FAQ link found on this page. A help section must be linked from all pages.",
        detail: null, checkedAt: now }];
    }

    return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "needs_review", severity: "low",
      evidence: `Help/FAQ link found: "${helpLinks[0]?.text}" (${helpLinks[0]?.href}). Verify it appears in a consistent location across all pages.`,
      detail: { helpLinks }, checkedAt: now }];
  },
};
