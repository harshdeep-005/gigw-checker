/**
 * Checker: lifecycle-hyperlinks
 * Clause:  5.4.4 — Hyperlink accuracy checked; external links clearly indicated.
 * Automation: semi-automatable | Severity: medium | Owner: B
 *
 * Strategy:
 *  - Check external links have a visual indicator (icon, "(external)", target=_blank)
 *  - Check anchor text matches destination context (heuristic)
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "lifecycle-hyperlinks";
const CLAUSE_ID = "5.4.4";

export const hyperlinkAccuracyChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],
  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();
    const result = await ctx.page.evaluate(() => {
      const origin = window.location.origin;
      const externalLinks = Array.from(document.querySelectorAll("a[href]")).filter((a) => {
        try {
          const url = new URL((a as HTMLAnchorElement).href);
          return url.origin !== origin && url.protocol.startsWith("http");
        } catch { return false; }
      });

      const withoutIndicator = externalLinks.filter((a) => {
        const hasNewTab = (a as HTMLAnchorElement).target === "_blank";
        const hasIcon = a.querySelector("img, svg, [class*='external'], [class*='icon']") !== null;
        const hasText = /(external|new\s+window|opens\s+in)/i.test(a.getAttribute("aria-label") ?? "") ||
                        /(external|new\s+window)/i.test(a.textContent ?? "");
        return !hasNewTab && !hasIcon && !hasText;
      });

      return { total: externalLinks.length, withoutIndicator: withoutIndicator.length };
    });

    if (result.total === 0) {
      return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "not_applicable", severity: "medium",
        evidence: "No external links found on this page.", detail: null, checkedAt: now }];
    }

    if (result.withoutIndicator > 0) {
      return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "fail", severity: "medium",
        evidence: `${String(result.withoutIndicator)} of ${String(result.total)} external link(s) have no indicator (no target="_blank", icon, or "(external)" text).`,
        detail: result, checkedAt: now }];
    }

    return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "needs_review", severity: "medium",
      evidence: `All ${String(result.total)} external link(s) have indicators. Verify link text accurately describes the destination.`,
      detail: result, checkedAt: now }];
  },
};
