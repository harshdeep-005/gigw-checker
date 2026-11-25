/**
 * Checker: quality-no-css
 * Clause:  5.1.16 — Content must remain readable with style sheets disabled.
 * Automation: semi-automatable | Severity: medium | Owner: B
 *
 * Strategy: Check if the page uses CSS-based layout techniques that may hide
 * content when CSS is disabled (display:none, visibility:hidden on non-trivial
 * elements, text set via CSS content property).
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "quality-no-css";
const CLAUSE_ID = "5.1.16";

export const noCssReadableChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],
  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();
    const issues = await ctx.page.evaluate(() => {
      const hidden: string[] = [];
      const els = Array.from(document.querySelectorAll("p, h1, h2, h3, li, td, article, section, main"));
      for (const el of els.slice(0, 200)) {
        const style = getComputedStyle(el);
        const text = (el.textContent ?? "").trim();
        if (text.length > 10 && (style.display === "none" || style.visibility === "hidden")) {
          hidden.push(text.slice(0, 50));
          if (hidden.length >= 3) break;
        }
      }
      return hidden;
    });

    if (issues.length > 0) {
      return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "fail", severity: "medium",
        evidence: `${String(issues.length)} content element(s) are hidden via CSS display:none or visibility:hidden: "${issues[0]}". This content would be invisible without CSS.`,
        detail: { hiddenElements: issues }, checkedAt: now }];
    }

    return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "needs_review", severity: "medium",
      evidence: "No critical content found hidden via CSS. Full verification requires manually disabling stylesheets.",
      detail: null, checkedAt: now }];
  },
};
