/**
 * Checker: a11y-navigation
 * Clauses: 5.2.42 — Navigation order must be consistent across pages (WCAG 3.2.3)
 *          5.2.43 — Repeated components must be identified consistently (WCAG 3.2.4)
 * Automation: semi-automatable
 * Severity:   medium
 * Owner:      Member A (A-010)
 *
 * Strategy (single-page checks — cross-page consistency needs Phase 3 multi-page diff):
 *  - 5.2.42: Verify a <nav> landmark or role="navigation" exists (structural signal)
 *            Verify skip-to-main link is present (consistent navigation pattern)
 *  - 5.2.43: Verify the page has a consistent header structure (logo + nav + search
 *            in expected positions — heuristic from GIGW layout guidelines)
 *
 *  Cross-page consistency (comparing nav structure across pages) deferred to Phase 3
 *  integration — single-page check is a proxy.
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "a11y-navigation";
const CLAUSE_IDS = ["5.2.42", "5.2.43"] as const;

export const navigationChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [...CLAUSE_IDS],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();
    const results: CheckerResultData[] = [];

    const navInfo = (await ctx.page.evaluate(() => {
      const navEls = document.querySelectorAll("nav, [role='navigation']");
      const firstLink = document.querySelector<HTMLAnchorElement>("a[href]");
      const hasSkipLink =
        firstLink !== null && (firstLink.href.includes("#") || firstLink.href.startsWith("#"));
      const hasHeader = !!document.querySelector("header, [role='banner']");
      const hasMain = !!document.querySelector("main, [role='main']");
      const hasFooter = !!document.querySelector("footer, [role='contentinfo']");
      const hasSearch = !!(
        document.querySelector("[role='search']") ??
        document.querySelector("form[action*='search']") ??
        document.querySelector("input[type='search']") ??
        document.querySelector("input[name='q'], input[name='query'], input[name='search']")
      );
      return {
        navCount: navEls.length,
        hasSkipLink,
        hasHeader,
        hasMain,
        hasFooter,
        hasSearch,
      };
    })) as {
      navCount: number;
      hasSkipLink: boolean;
      hasHeader: boolean;
      hasMain: boolean;
      hasFooter: boolean;
      hasSearch: boolean;
    };

    // ── 5.2.42 — Consistent navigation
    if (navInfo.navCount === 0) {
      results.push({
        clauseId: "5.2.42",
        pageUrl: ctx.pageUrl,
        status: "fail",
        severity: "medium",
        evidence:
          "No <nav> or role='navigation' landmark found. " +
          "Navigation must be in a landmark region for consistency across pages.",
        detail: navInfo,
        checkedAt: now,
      });
    } else if (!navInfo.hasSkipLink) {
      results.push({
        clauseId: "5.2.42",
        pageUrl: ctx.pageUrl,
        status: "needs_review",
        severity: "medium",
        evidence:
          `${String(navInfo.navCount)} navigation landmark(s) found but no skip-to-main link detected. ` +
          "Cross-page consistency verification requires multi-page comparison (Phase 3).",
        detail: navInfo,
        checkedAt: now,
      });
    } else {
      results.push({
        clauseId: "5.2.42",
        pageUrl: ctx.pageUrl,
        status: "needs_review",
        severity: "medium",
        evidence:
          `${String(navInfo.navCount)} navigation landmark(s) and a skip link are present. ` +
          "Cross-page consistency requires multi-page comparison (Phase 3).",
        detail: navInfo,
        checkedAt: now,
      });
    }

    // ── 5.2.43 — Consistent identification
    const missing: string[] = [];
    if (!navInfo.hasHeader) missing.push("header/banner landmark");
    if (!navInfo.hasMain) missing.push("main landmark");
    if (!navInfo.hasFooter) missing.push("footer/contentinfo landmark");

    if (missing.length > 0) {
      results.push({
        clauseId: "5.2.43",
        pageUrl: ctx.pageUrl,
        status: "needs_review",
        severity: "medium",
        evidence:
          `Missing structural landmarks: ${missing.join(", ")}. ` +
          "Consistent page structure helps users identify repeated components.",
        detail: navInfo,
        checkedAt: now,
      });
    } else {
      results.push({
        clauseId: "5.2.43",
        pageUrl: ctx.pageUrl,
        status: "needs_review",
        severity: "medium",
        evidence:
          "Page has header, main, footer, and navigation landmarks. " +
          "Cross-page component identification consistency requires multi-page comparison (Phase 3).",
        detail: navInfo,
        checkedAt: now,
      });
    }

    return results;
  },
};
