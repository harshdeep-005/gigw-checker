/**
 * Checker: lifecycle-accessible-docs
 * Clause:  5.4.9 — Documents must be in HTML or accessible formats (not scanned PDFs).
 * Automation: semi-automatable | Severity: medium | Owner: B
 *
 * Strategy: find PDF links and check if they're described as "scanned" or lack
 * accessible alternatives. Can't verify inside the PDF — flag for manual review.
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "lifecycle-accessible-docs";
const CLAUSE_ID = "5.4.9";

export const accessibleDocsChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],
  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();
    const pdfLinks = await ctx.page.$$eval("a[href]", (anchors) =>
      anchors
        .filter((a) => /\.pdf(\?.*)?$/i.test((a as HTMLAnchorElement).href))
        .map((a) => ({
          text: (a.textContent ?? "").trim().slice(0, 80),
          href: (a as HTMLAnchorElement).href.slice(0, 100),
        }))
        .slice(0, 10),
    );

    if (pdfLinks.length === 0) {
      return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "not_applicable", severity: "medium",
        evidence: "No PDF links found on this page.", detail: null, checkedAt: now }];
    }

    const suspectScanned = pdfLinks.filter((l) => /scan|image|photo/i.test(l.text + l.href));

    return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "needs_review", severity: "medium",
      evidence: `${String(pdfLinks.length)} PDF link(s) found${suspectScanned.length > 0 ? ` — ${String(suspectScanned.length)} may be scanned images` : ""}. Verify PDFs are tagged/accessible (not scanned-image-only). Consider providing HTML alternatives.`,
      detail: { pdfCount: pdfLinks.length, suspectScanned: suspectScanned.length }, checkedAt: now }];
  },
};
