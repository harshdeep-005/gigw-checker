/**
 * Checker: quality-download-meta
 * Clause:  5.1.6 — Downloadable material must show title, size, format, instructions.
 * Automation: semi-automatable | Severity: low | Owner: B
 *
 * Strategy: find all download links (<a href> ending in .pdf, .doc, .xls, etc.)
 * and check whether nearby text indicates size/format.
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "quality-download-meta";
const CLAUSE_ID = "5.1.6";
const DOWNLOAD_EXT_RE = /\.(pdf|docx?|xlsx?|pptx?|zip|csv|odt|ods)(\?.*)?$/i;
const SIZE_RE = /\d+\s*(kb|mb|gb|bytes?)/i;
const FORMAT_RE = /\b(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|csv)\b/i;

export const downloadMetadataChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],
  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();
    const downloadLinks = await ctx.page.$$eval("a[href]", (anchors) =>
      anchors
        .filter((a) => /\.(pdf|docx?|xlsx?|pptx?|zip|csv|odt|ods)(\?.*)?$/i.test((a as HTMLAnchorElement).href))
        .map((a) => ({
          href: (a as HTMLAnchorElement).href.slice(0, 100),
          text: (a.textContent ?? "").trim().slice(0, 80),
          parentText: ((a as HTMLAnchorElement).closest("li,td,p")?.textContent ?? "").trim().slice(0, 120),
        }))
        .slice(0, 20),
    );

    if (downloadLinks.length === 0) {
      return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "not_applicable", severity: "low", evidence: "No downloadable files found on this page.", detail: null, checkedAt: now }];
    }

    const missing = downloadLinks.filter(
      (l) => !SIZE_RE.test(l.parentText) || !FORMAT_RE.test(l.parentText + " " + l.text),
    );

    if (missing.length > 0) {
      return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "needs_review", severity: "low",
        evidence: `${String(missing.length)} of ${String(downloadLinks.length)} download link(s) may lack size/format metadata. First: "${missing[0]?.text}" (${missing[0]?.href})`,
        detail: { total: downloadLinks.length, missingMeta: missing.length }, checkedAt: now }];
    }

    return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "pass", severity: "low",
      evidence: `All ${String(downloadLinks.length)} download link(s) appear to have format/size context.`,
      detail: { total: downloadLinks.length }, checkedAt: now }];
  },
};
