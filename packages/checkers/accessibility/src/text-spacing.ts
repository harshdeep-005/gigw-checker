/**
 * Checker: a11y-text-spacing
 * Clause:  5.2.19 — No loss of content when text spacing is overridden (WCAG 1.4.12)
 * Automation: semi-automatable
 * Severity:   medium
 * Owner:      Member A (A-010)
 *
 * Strategy:
 *  - Inject the WCAG 1.4.12 spacing overrides via a <style> tag:
 *      line-height: 1.5 × font-size
 *      letter-spacing: 0.12 × font-size
 *      word-spacing: 0.16 × font-size
 *      spacing after paragraphs: 2 × font-size
 *  - Check for elements that overflow their container (scrollHeight > clientHeight
 *    for elements with overflow:hidden)
 *  - FAIL if any element clips content after the override
 *  - PASS if no clipping detected
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "a11y-text-spacing";
const CLAUSE_ID = "5.2.19";

/** WCAG 1.4.12 spacing override CSS */
const SPACING_OVERRIDE_CSS = `
  * {
    line-height: 1.5 !important;
    letter-spacing: 0.12em !important;
    word-spacing: 0.16em !important;
  }
  p {
    margin-bottom: 2em !important;
  }
`;

export const textSpacingChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();

    let clippedElements: Array<{ tag: string; text: string }> = [];

    try {
      // Inject spacing overrides
      await ctx.page.addStyleTag({ content: SPACING_OVERRIDE_CSS });
      await ctx.page.waitForTimeout(300);

      // Find elements with overflow:hidden where content is clipped
      clippedElements = await ctx.page.$$eval("*", (els) =>
        (els as HTMLElement[])
          .filter((el) => {
            const style = getComputedStyle(el);
            return (
              (style.overflow === "hidden" || style.overflowY === "hidden") &&
              el.scrollHeight > el.clientHeight + 2 && // +2px tolerance
              el.clientHeight > 0 &&
              (el.textContent ?? "").trim().length > 0
            );
          })
          .map((el) => ({
            tag: el.tagName.toLowerCase(),
            text: (el.textContent ?? "").trim().slice(0, 60),
          }))
          .slice(0, 5),
      );
    } catch (err) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "needs_review",
          severity: "medium",
          evidence: `Could not inject text spacing overrides: ${String(err)}`,
          detail: null,
          checkedAt: now,
        },
      ];
    }

    if (clippedElements.length > 0) {
      const examples = clippedElements
        .slice(0, 3)
        .map((e) => `<${e.tag}> "${e.text}"`)
        .join(", ");
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "fail",
          severity: "medium",
          evidence:
            `${String(clippedElements.length)} element(s) clip content when text spacing is increased: ` +
            `${examples}. These elements have overflow:hidden and scrollHeight > clientHeight.`,
          detail: { clipped: clippedElements.length },
          checkedAt: now,
        },
      ];
    }

    return [
      {
        clauseId: CLAUSE_ID,
        pageUrl: ctx.pageUrl,
        status: "pass",
        severity: "medium",
        evidence: "No content clipping detected after applying WCAG 1.4.12 text spacing overrides.",
        detail: null,
        checkedAt: now,
      },
    ];
  },
};
