/**
 * Checker: a11y-reflow
 * Clauses: 5.2.15 — Resize text to 200% without loss of content (WCAG 1.4.4)
 *          5.2.17 — Reflow at 320px without horizontal scroll (WCAG 1.4.10)
 * Automation: semi-automatable (5.2.15), automatable (5.2.17)
 * Severity:   medium
 * Owner:      Member A (A-010)
 *
 * Strategy for 5.2.17 (reflow):
 *  - Set viewport to 320px wide
 *  - Check if body scrollWidth > clientWidth (horizontal scroll present)
 *  - FAIL if horizontal scroll exists
 *
 * Strategy for 5.2.15 (resize text):
 *  - Check CSS uses relative units (em/rem/%) for font-size on body/html
 *  - NEEDS_REVIEW if all absolute units (px/pt) — cannot fully automate
 *  - PASS if relative units found (likely reflows correctly)
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "a11y-reflow";
const CLAUSE_IDS = ["5.2.15", "5.2.17"] as const;

export const reflowChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [...CLAUSE_IDS],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();
    const results: CheckerResultData[] = [];

    // ── 5.2.17 — Reflow at 320px ─────────────────────────────────────────────
    const originalViewport = ctx.page.viewportSize();

    try {
      await ctx.page.setViewportSize({ width: 320, height: 568 });
      // Wait for layout to settle
      await ctx.page.waitForTimeout(300);

      const scrollInfo = await ctx.page.evaluate(() => ({
        scrollWidth: document.body.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasHorizontalScroll: document.body.scrollWidth > document.documentElement.clientWidth,
      }));

      results.push({
        clauseId: "5.2.17",
        pageUrl: ctx.pageUrl,
        status: scrollInfo.hasHorizontalScroll ? "fail" : "pass",
        severity: "medium",
        evidence: scrollInfo.hasHorizontalScroll
          ? `Horizontal scroll detected at 320px viewport width ` +
            `(scrollWidth: ${String(scrollInfo.scrollWidth)}px, ` +
            `clientWidth: ${String(scrollInfo.clientWidth)}px). ` +
            `Content does not reflow correctly.`
          : `No horizontal scroll at 320px viewport width — content reflows correctly.`,
        detail: {
          scrollWidth: scrollInfo.scrollWidth,
          clientWidth: scrollInfo.clientWidth,
        },
        checkedAt: now,
      });
    } catch (err) {
      results.push({
        clauseId: "5.2.17",
        pageUrl: ctx.pageUrl,
        status: "needs_review",
        severity: "medium",
        evidence: `Could not test reflow at 320px: ${String(err)}`,
        detail: null,
        checkedAt: now,
      });
    } finally {
      // Restore original viewport
      const vp = originalViewport ?? { width: 1280, height: 720 };
      await ctx.page.setViewportSize(vp);
    }

    // ── 5.2.15 — Resize text 200% ─────────────────────────────────────────────
    const fontSizeInfo = await ctx.page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      const htmlFs = getComputedStyle(html).fontSize;
      const bodyFs = getComputedStyle(body).fontSize;

      // Check for user-scalable=no in viewport meta
      const viewportMeta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
      const viewportContent = viewportMeta?.content ?? "";
      const blocksScaling =
        /user-scalable\s*=\s*no/i.test(viewportContent) ||
        /maximum-scale\s*=\s*1/i.test(viewportContent);

      return { htmlFs, bodyFs, blocksScaling, viewportContent };
    });

    if (fontSizeInfo.blocksScaling) {
      results.push({
        clauseId: "5.2.15",
        pageUrl: ctx.pageUrl,
        status: "fail",
        severity: "medium",
        evidence:
          `Viewport meta blocks user scaling: "${fontSizeInfo.viewportContent}". ` +
          `This prevents text resizing to 200%.`,
        detail: { viewportContent: fontSizeInfo.viewportContent },
        checkedAt: now,
      });
    } else {
      // Heuristic: if computed font-size on html/body is exactly 16px (browser default),
      // the site likely uses relative units. If it's something unusual, flag for review.
      const isProbablyRelative = fontSizeInfo.htmlFs === "16px" || fontSizeInfo.bodyFs === "16px";

      results.push({
        clauseId: "5.2.15",
        pageUrl: ctx.pageUrl,
        status: "needs_review",
        severity: "medium",
        evidence:
          `Viewport scaling is not blocked. ` +
          `html font-size: ${fontSizeInfo.htmlFs}, body font-size: ${fontSizeInfo.bodyFs}. ` +
          (isProbablyRelative
            ? "Likely uses relative units — verify text resizes to 200% without content loss."
            : "Verify text resizes to 200% without content loss."),
        detail: {
          htmlFontSize: fontSizeInfo.htmlFs,
          bodyFontSize: fontSizeInfo.bodyFs,
          blocksScaling: fontSizeInfo.blocksScaling,
        },
        checkedAt: now,
      });
    }

    return results;
  },
};
