/**
 * Checker: a11y-headings
 * Clause:  5.2.32 — Headings and labels must describe topic or purpose (WCAG 2.4.6)
 * Automation: semi-automatable
 * Severity:   medium
 * Owner:      Member A (A-010)
 *
 * Strategy:
 *  - FAIL: no <h1> on the page
 *  - FAIL: heading levels skip (e.g. h1 → h3 with no h2)
 *  - NEEDS_REVIEW: multiple <h1> elements (valid in HTML5 sectioning but discouraged)
 *  - NEEDS_REVIEW: headings are present and structured — descriptiveness is manual
 *  - PASS: exactly one h1, no skipped levels
 *  - NOT_APPLICABLE: no headings at all (possibly a non-content page)
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "a11y-headings";
const CLAUSE_ID = "5.2.32";

export const headingsChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();

    const headings = await ctx.page.$$eval("h1, h2, h3, h4, h5, h6", (els) =>
      els.map((el) => ({
        level: parseInt(el.tagName.slice(1), 10),
        text: (el.textContent ?? "").trim().slice(0, 80),
      })),
    );

    if (headings.length === 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "not_applicable",
          severity: "medium",
          evidence: "No heading elements (h1–h6) found on this page.",
          detail: null,
          checkedAt: now,
        },
      ];
    }

    const h1Count = headings.filter((h) => h.level === 1).length;

    // Missing h1
    if (h1Count === 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "fail",
          severity: "medium",
          evidence: `No <h1> element found. Every page should have exactly one <h1>.`,
          detail: { headingCount: headings.length, h1Count: 0 },
          checkedAt: now,
        },
      ];
    }

    // Detect skipped heading levels
    const levels = headings.map((h) => h.level);
    const skips: string[] = [];
    for (let i = 1; i < levels.length; i++) {
      const prev = levels[i - 1];
      const curr = levels[i];
      if (prev !== undefined && curr !== undefined && curr > prev + 1) {
        skips.push(`h${String(prev)} → h${String(curr)}`);
      }
    }

    if (skips.length > 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "fail",
          severity: "medium",
          evidence:
            `Heading level(s) skipped: ${skips.join(", ")}. ` +
            `Skipping levels breaks document structure for screen reader users.`,
          detail: { headingCount: headings.length, skips },
          checkedAt: now,
        },
      ];
    }

    // Multiple h1s — needs review but not an outright fail
    if (h1Count > 1) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "needs_review",
          severity: "medium",
          evidence:
            `${String(h1Count)} <h1> elements found. Multiple h1s are allowed in HTML5 ` +
            `sectioning contexts but are discouraged — verify each is within a distinct section.`,
          detail: { headingCount: headings.length, h1Count },
          checkedAt: now,
        },
      ];
    }

    // Structure looks good — descriptiveness still needs human check
    return [
      {
        clauseId: CLAUSE_ID,
        pageUrl: ctx.pageUrl,
        status: "needs_review",
        severity: "medium",
        evidence:
          `Heading structure is valid: 1 <h1>, no skipped levels, ${String(headings.length)} headings total. ` +
          `Verify heading text is descriptive of its section.`,
        detail: { headingCount: headings.length, h1Count, firstH1: headings[0]?.text ?? "" },
        checkedAt: now,
      },
    ];
  },
};
