/**
 * Checker: national-portal-link
 * Clause: 5.1.12 — A prominent link to the National Portal (india.gov.in)
 *                   must be present and open in a new window.
 * Automation: automatable
 * Severity: low
 * Owner: Member B (B-005)
 *
 * Strategy: find an anchor pointing to india.gov.in, check for
 * target="_blank" (new window requirement).
 */

import type { CheckerModule, CheckerContext } from "./types.js";
import type { CheckerResult } from "@gigw/db";

const CHECKER_ID = "national-portal-link";
const CLAUSE_ID = "5.1.12";

// Matches href containing india.gov.in
const INDIA_PORTAL_HREF_RE = /<a\s([^>]*)href=["']([^"']*india\.gov\.in[^"']*)["']([^>]*)>/gi;

export const nationalPortalLinkChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  run(ctx: CheckerContext): Promise<CheckerResult[]> {
    const html = ctx.html;

    let match: RegExpExecArray | null;
    let found = false;
    let hasTargetBlank = false;
    let foundHref = "";

    // Reset lastIndex for global regex
    INDIA_PORTAL_HREF_RE.lastIndex = 0;

    while ((match = INDIA_PORTAL_HREF_RE.exec(html)) !== null) {
      found = true;
      foundHref = match[2] ?? "";
      const fullTag = `<a ${match[1] ?? ""}href="${foundHref}"${match[3] ?? ""}>`;
      if (/target=["']_blank["']/i.test(fullTag)) {
        hasTargetBlank = true;
        break;
      }
    }

    let status: CheckerResult["status"];
    let evidence: string;

    if (!found) {
      status = "fail";
      evidence = "No link to india.gov.in (National Portal) found on the page.";
    } else if (!hasTargetBlank) {
      status = "needs_review";
      evidence = `Link to india.gov.in found (${foundHref}) but target="_blank" is missing — should open in a new window.`;
    } else {
      status = "pass";
      evidence = `Link to india.gov.in found with target="_blank": ${foundHref}`;
    }

    const result: CheckerResult = {
      id: "",
      clauseId: CLAUSE_ID,
      pageUrl: ctx.pageUrl,
      status,
      severity: "low",
      evidence,
      detail: { found, hasTargetBlank, foundHref: foundHref || null },
      checkedAt: new Date(),
      pageReportId: null,
    };

    return Promise.resolve([result]);
  },
};
