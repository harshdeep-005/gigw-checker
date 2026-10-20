/**
 * Checker: a11y-status-messages
 * Clause:  5.2.50 — Status messages must be determinable without receiving focus (WCAG 4.1.3)
 * Automation: semi-automatable
 * Severity:   medium
 * Owner:      Member A (A-010)
 *
 * Strategy:
 *  - Detect elements with role="status", role="alert", role="log",
 *    aria-live="polite", aria-live="assertive"
 *  - FAIL if dynamic content is likely present (forms, search results, alerts)
 *    but none of the above patterns exist
 *  - NEEDS_REVIEW if patterns found — content accuracy needs manual check
 *  - PASS if page has no dynamic content indicators
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "a11y-status-messages";
const CLAUSE_ID = "5.2.50";

export const statusMessagesChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();

    const ariaInfo = await ctx.page.evaluate(() => {
      // Live regions and status roles
      const liveRegions = Array.from(
        document.querySelectorAll(
          "[role='status'], [role='alert'], [role='log'], [aria-live='polite'], [aria-live='assertive']",
        ),
      ).map((el) => ({
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute("role") ?? "",
        ariaLive: el.getAttribute("aria-live") ?? "",
        text: (el.textContent ?? "").trim().slice(0, 60),
      }));

      // Indicators that dynamic status messages might exist
      const hasForm = document.querySelectorAll("form").length > 0;
      const hasSearchInput = !!(
        document.querySelector("input[type='search']") ??
        document.querySelector("input[name='q'], input[name='query']")
      );
      const hasLoadingIndicators = !!(
        document.querySelector("[aria-busy='true']") ??
        document.querySelector(".loading, .spinner, .progress")
      );

      return { liveRegions, hasForm, hasSearchInput, hasLoadingIndicators };
    });

    const hasDynamicContent =
      ariaInfo.hasForm || ariaInfo.hasSearchInput || ariaInfo.hasLoadingIndicators;

    if (ariaInfo.liveRegions.length > 0) {
      const regionSummary = ariaInfo.liveRegions
        .slice(0, 3)
        .map((r) => {
          const attr = r.role ? `role="${r.role}"` : `aria-live="${r.ariaLive}"`;
          return `<${r.tag} ${attr}>`;
        })
        .join(", ");

      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "needs_review",
          severity: "medium",
          evidence:
            `${String(ariaInfo.liveRegions.length)} ARIA live region(s) found: ${regionSummary}. ` +
            `Verify status messages are announced correctly without requiring focus.`,
          detail: {
            liveRegionCount: ariaInfo.liveRegions.length,
            hasDynamicContent,
          },
          checkedAt: now,
        },
      ];
    }

    if (hasDynamicContent) {
      const indicators: string[] = [];
      if (ariaInfo.hasForm) indicators.push("forms");
      if (ariaInfo.hasSearchInput) indicators.push("search input");
      if (ariaInfo.hasLoadingIndicators) indicators.push("loading indicators");

      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "fail",
          severity: "medium",
          evidence:
            `Page has dynamic content (${indicators.join(", ")}) but no ARIA live regions ` +
            `(role="status", role="alert", or aria-live). ` +
            `Status messages from form submissions and search results will not be announced to screen readers.`,
          detail: { liveRegionCount: 0, indicators },
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
        evidence: "No dynamic content indicators found; no ARIA live regions needed on this page.",
        detail: null,
        checkedAt: now,
      },
    ];
  },
};
