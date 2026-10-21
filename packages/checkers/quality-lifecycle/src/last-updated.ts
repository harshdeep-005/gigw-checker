/**
 * Checker: last-updated
 * Clause: 5.1.5 — Pages must show a "last updated/reviewed" date.
 * Automation: automatable
 * Severity: low
 * Owner: Member B (B-005)
 *
 * Strategy: scan HTML for date patterns near keywords like
 * "last updated", "last reviewed", "updated on", etc.
 */

import type { CheckerModule, CheckerContext } from "./types.js";
import type { CheckerResult } from "@gigw/db";

const CHECKER_ID = "last-updated";
const CLAUSE_ID = "5.1.5";

// Matches "Last Updated: 12 Jan 2024", "Updated on 01/02/2025", etc.
const DATE_LABEL_RE =
  /(?:last\s+(?:updated|reviewed|modified)|updated\s+on|reviewed\s+on)\s*[:\-–]?\s*(\d{1,2}[\s\-.]\w+[\s\-.]\d{2,4}|\w+\s+\d{1,2},?\s+\d{4})/i;

// Also accept a <time> or <meta> lastmod pattern
const TIME_TAG_RE = /<time[^>]*datetime=["']([^"']+)["'][^>]*>/i;
const META_LASTMOD_RE = /<meta[^>]+(?:name=["'](?:last-modified|revised)["'][^>]*content=["']([^"']+)["']|content=["']([^"']+)["'][^>]*name=["'](?:last-modified|revised)["'])/i;

export const lastUpdatedChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  run(ctx: CheckerContext): Promise<CheckerResult[]> {
    const html = ctx.html;

    const labelMatch = DATE_LABEL_RE.exec(html);
    const timeMatch = TIME_TAG_RE.exec(html);
    const metaMatch = META_LASTMOD_RE.exec(html);

    let status: CheckerResult["status"];
    let evidence: string;
    let foundDate: string | null = null;

    if (labelMatch?.[1] !== undefined) {
      foundDate = labelMatch[1];
      status = "pass";
      evidence = `Last updated date found in page text: "${foundDate}"`;
    } else if (timeMatch?.[1] !== undefined) {
      foundDate = timeMatch[1];
      status = "pass";
      evidence = `Last updated date found in <time datetime>: "${foundDate}"`;
    } else if (metaMatch?.[1] !== undefined || metaMatch?.[2] !== undefined) {
      foundDate = metaMatch[1] ?? metaMatch[2] ?? null;
      status = "pass";
      evidence = `Last updated date found in <meta> tag: "${foundDate ?? ""}"`;
    } else {
      status = "fail";
      evidence = 'No "last updated" or "last reviewed" date found on the page.';
    }

    const result: CheckerResult = {
      id: "",
      clauseId: CLAUSE_ID,
      pageUrl: ctx.pageUrl,
      status,
      severity: "low",
      evidence,
      detail: { foundDate },
      checkedAt: new Date(),
      pageReportId: null,
    };

    return Promise.resolve([result]);
  },
};
