/**
 * Checker: official-domain
 * Clause: 5.1.1 — The website must be on an official government domain (.gov.in or .nic.in).
 * Automation: automatable
 * Severity: high
 * Owner: Member B (B-004 / B-005)
 *
 * Strategy: inspect the page URL — no HTTP request needed beyond what the
 * crawler already did. Returns a single result per page.
 */

import type { CheckerModule, CheckerContext } from "./types.js";
import type { CheckerResult } from "@gigw/db";

const CHECKER_ID = "official-domain";
const CLAUSE_ID = "5.1.1";

/** Accepted TLDs for Indian government websites. */
const OFFICIAL_DOMAINS = [".gov.in", ".nic.in"];

function isOfficialDomain(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return OFFICIAL_DOMAINS.some((suffix) => hostname.endsWith(suffix));
  } catch {
    return false;
  }
}

export const officialDomainChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  run(ctx: CheckerContext): Promise<CheckerResult[]> {
    const official = isOfficialDomain(ctx.pageUrl);

    const result: CheckerResult = {
      id: "",            // assigned by DB on insert
      clauseId: CLAUSE_ID,
      pageUrl: ctx.pageUrl,
      status: official ? "pass" : "fail",
      severity: "high",
      evidence: official
        ? `Domain is an official government domain: ${new URL(ctx.pageUrl).hostname}`
        : `Domain does not end with .gov.in or .nic.in: ${ctx.pageUrl}`,
      detail: null,
      checkedAt: new Date(),
      pageReportId: null,
    };

    return Promise.resolve([result]);
  },
};
