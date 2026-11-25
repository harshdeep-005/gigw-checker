/**
 * Checker: quality-circular-meta
 * Clause:  5.1.7 — Circulars/notifications/forms must list title, language, purpose, validity.
 * Automation: semi-automatable | Severity: medium | Owner: B
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "quality-circular-meta";
const CLAUSE_ID = "5.1.7";
const CIRCULAR_RE = /\b(circular|notification|notification|form|scheme|order|act|regulation)\b/i;
const DATE_RE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/i;

export const circularMetaChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],
  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();
    const hasCircularSection = await ctx.page.evaluate((re: string) => {
      const pattern = new RegExp(re, "i");
      const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6,th,caption"));
      return headings.some((h) => pattern.test(h.textContent ?? ""));
    }, CIRCULAR_RE.source);

    if (!hasCircularSection) {
      return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "not_applicable", severity: "medium",
        evidence: "No circulars/notifications/forms section detected on this page.", detail: null, checkedAt: now }];
    }

    const hasDateInfo = DATE_RE.test(ctx.html);
    return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "needs_review", severity: "medium",
      evidence: `Circulars/notifications section detected. ${hasDateInfo ? "Date information found — verify title, language, purpose, and validity are listed for each item." : "No date information found — verify each item has title, language, purpose, and validity."}`,
      detail: { hasDateInfo }, checkedAt: now }];
  },
};
