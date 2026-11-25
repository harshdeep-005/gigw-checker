/**
 * Checker: lifecycle-multilang-sync
 * Clause:  5.4.6 — Multi-language versions must be updated simultaneously.
 * Automation: semi-automatable | Severity: medium | Owner: B
 *
 * Strategy: detect if the page has a language switcher and if both
 * language versions show the same last-updated date (proxy for simultaneous update).
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "lifecycle-multilang-sync";
const CLAUSE_ID = "5.4.6";

export const multilangSyncChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],
  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();
    const hasLangSwitcher = await ctx.page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a[href], button"));
      return links.some((el) => {
        const text = (el.textContent ?? "").toLowerCase().trim();
        return text === "hindi" || text === "english" || text === "हिंदी" || text === "english / हिंदी" ||
               /lang|language/i.test(el.className ?? "") || /lang/i.test((el as HTMLElement).getAttribute("hreflang") ?? "");
      });
    });

    if (!hasLangSwitcher) {
      return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "needs_review", severity: "medium",
        evidence: "No language switcher detected. If the site is bilingual, verify both language versions are updated simultaneously.",
        detail: { hasLangSwitcher: false }, checkedAt: now }];
    }

    return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "needs_review", severity: "medium",
      evidence: "Language switcher detected. Verify that the Hindi and English versions are updated simultaneously — compare last-updated dates on both.",
      detail: { hasLangSwitcher: true }, checkedAt: now }];
  },
};
