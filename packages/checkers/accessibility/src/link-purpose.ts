/**
 * Checker: a11y-link-purpose
 * Clause:  5.2.30 — Link purpose must be determinable from text or context (WCAG 2.4.4)
 * Automation: semi-automatable
 * Severity:   medium
 * Owner:      Member A (A-010)
 *
 * Strategy:
 *  - FAIL: <a> elements whose accessible name is in the GENERIC_LINK_TEXTS set
 *  - PASS: all links have descriptive accessible names
 *  - NOT_APPLICABLE: no links on page
 *
 * Accessible name = aria-label || aria-labelledby content || text content.
 * Generic texts like "click here", "read more", "here", "more", "link" are flagged.
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "a11y-link-purpose";
const CLAUSE_ID = "5.2.30";

/** Link texts that convey no purpose out of context. */
const GENERIC_LINK_TEXTS = new Set([
  "click here",
  "click",
  "here",
  "read more",
  "more",
  "learn more",
  "link",
  "this",
  "this link",
  "go",
  "go here",
  "details",
  "info",
  "information",
  "continue",
  "next",
  "previous",
  "back",
  "open",
  "view",
  "see more",
  "see",
  "more info",
  "full article",
  "article",
  "page",
  "download",
  "here.",
  "read",
  "visit",
  "submit",
]);

export const linkPurposeChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();

    const links = await ctx.page.$$eval("a[href]", (anchors) =>
      anchors.map((a) => {
        const el = a as HTMLAnchorElement;
        const ariaLabel = el.getAttribute("aria-label")?.trim() ?? "";
        const textContent = (el.textContent ?? "").trim().replace(/\s+/g, " ");
        const accessibleName = ariaLabel || textContent;
        return {
          accessibleName: accessibleName.slice(0, 100),
          href: el.href.slice(0, 100),
        };
      }),
    );

    if (links.length === 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "not_applicable",
          severity: "medium",
          evidence: "No <a href> elements found on this page.",
          detail: null,
          checkedAt: now,
        },
      ];
    }

    const genericLinks = links.filter((l) =>
      GENERIC_LINK_TEXTS.has(l.accessibleName.toLowerCase()),
    );

    if (genericLinks.length > 0) {
      const examples = genericLinks
        .slice(0, 3)
        .map((l) => `"${l.accessibleName}"`)
        .join(", ");
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "fail",
          severity: "medium",
          evidence:
            `${String(genericLinks.length)} of ${String(links.length)} links have generic accessible names: ` +
            `${examples}. These are not descriptive out of context.`,
          detail: { total: links.length, generic: genericLinks.length },
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
        evidence: `All ${String(links.length)} links have non-generic accessible names.`,
        detail: { total: links.length },
        checkedAt: now,
      },
    ];
  },
};
