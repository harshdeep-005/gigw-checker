/**
 * Checker: quality-domain
 * Clause: 5.1.21 — The website must be on an official government domain
 *                  (.gov.in or .nic.in).
 * Automation: automatable
 * Severity: high
 * Owner: Member B (B-004 / B-005)
 *
 * Strategy: inspect the page URL — no HTTP request needed beyond what the
 * crawler already did. Returns a single result per page.
 *
 * Fix (bug #21): was wrongly set to clauseId "5.1.1" (State Emblem) and
 * checkerId "official-domain". Corrected to clauseId "5.1.21" and
 * checkerId "quality-domain" to match the seed.
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

// Must match ClauseDefinition.checkerId in seed for clause 5.1.21
const CHECKER_ID = "quality-domain";
const CLAUSE_ID = "5.1.21";

/** Accepted TLDs for Indian government websites per GIGW 3.0 §4 clause 5.1.21.
 *  Includes root domains (gov.in, nic.in) and subdomains (.gov.in, .nic.in). */
const OFFICIAL_DOMAIN_SUFFIXES = [".gov.in", ".nic.in"];

function isOfficialDomain(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    // Match both root domains (gov.in) and subdomains (something.gov.in)
    return OFFICIAL_DOMAIN_SUFFIXES.some(
      (suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix),
    );
  } catch {
    return false;
  }
}

export const officialDomainChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const official = isOfficialDomain(ctx.pageUrl);

    const result: CheckerResultData = {
      clauseId: CLAUSE_ID,
      pageUrl: ctx.pageUrl,
      status: official ? "pass" : "fail",
      severity: "high",
      evidence: official
        ? `Domain is an official government domain: ${new URL(ctx.pageUrl).hostname}`
        : `Domain does not end with .gov.in or .nic.in: ${ctx.pageUrl}`,
      detail: null,
      checkedAt: new Date(),
    };

    return Promise.resolve([result]);
  },
};
