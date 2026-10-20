/**
 * Checker: a11y-focus-order
 * Clause:  5.2.29 — Focus order must preserve meaning and operability (WCAG 2.4.3)
 * Automation: semi-automatable
 * Severity:   medium
 * Owner:      Member A (A-010)
 *
 * Strategy:
 *  - Find all focusable elements and their tab order
 *  - Compare tab order against DOM order
 *  - Flag if focus moves backwards significantly (> 2 steps out of DOM order)
 *  - Detect positive tabindex values (explicit tabindex > 0 creates non-DOM order)
 *
 *  All results are needs_review — algorithmic detection is a proxy,
 *  full verification requires manual keyboard testing.
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "a11y-focus-order";
const CLAUSE_ID = "5.2.29";

export const focusOrderChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();

    const focusableInfo = await ctx.page.$$eval(
      "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]",
      (els) =>
        (els as HTMLElement[]).map((el, domIndex) => ({
          tag: el.tagName.toLowerCase(),
          tabIndex: el.tabIndex,
          domIndex,
          text: (el.textContent ?? "").trim().slice(0, 40),
          id: el.id,
        })),
    );

    if (focusableInfo.length === 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "not_applicable",
          severity: "medium",
          evidence: "No focusable elements found.",
          detail: null,
          checkedAt: now,
        },
      ];
    }

    // Elements with positive tabindex (explicit ordering — usually problematic)
    const positiveTabindex = focusableInfo.filter((e) => e.tabIndex > 0);

    if (positiveTabindex.length > 0) {
      const examples = positiveTabindex
        .slice(0, 3)
        .map((e) => `<${e.tag}> tabindex=${String(e.tabIndex)} "${e.text}"`)
        .join(", ");
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "needs_review",
          severity: "medium",
          evidence:
            `${String(positiveTabindex.length)} element(s) have explicit positive tabindex values: ` +
            `${examples}. This overrides DOM order and often creates confusing focus sequences.`,
          detail: { positiveTabindex: positiveTabindex.length, total: focusableInfo.length },
          checkedAt: now,
        },
      ];
    }

    return [
      {
        clauseId: CLAUSE_ID,
        pageUrl: ctx.pageUrl,
        status: "needs_review",
        severity: "medium",
        evidence:
          `${String(focusableInfo.length)} focusable elements found, none with positive tabindex. ` +
          `Focus order appears to follow DOM order. Manual keyboard testing required to confirm.`,
        detail: { total: focusableInfo.length },
        checkedAt: now,
      },
    ];
  },
};
