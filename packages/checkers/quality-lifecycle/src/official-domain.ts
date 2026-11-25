/**
 * Checker: quality-domain
 * Clause: 5.1.21 — The website must be on an official government domain.
 *
 * Accepted domains:
 * .gov.in, .nic.in — government websites
 * .edu.in, .res.in, .ac.in — eligible academic/research institutions
 *
 * Automation: automatable
 * Severity: high
 * Owner: Member B (B-004 / B-005)
 *
 * Strategy: inspect the page URL — no additional HTTP request is needed
 * beyond what the crawler already performed.
 *
 * Includes the clause ID and checker ID fix to match the seed definition.
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

// Must match ClauseDefinition.checkerId in the seed for clause 5.1.21.
const CHECKER_ID = "quality-domain";
const CLAUSE_ID = "5.1.21";

/**
 * Accepted TLD suffixes for Indian government and eligible
 * academic/research institution websites.
 */
const OFFICIAL_DOMAIN_SUFFIXES = [".gov.in", ".nic.in", ".ac.in", ".res.in", ".edu.in"];

function isOfficialDomain(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    const normalizedHostname = hostname.toLowerCase();

    // Match root domains and their subdomains.
    return OFFICIAL_DOMAIN_SUFFIXES.some(
      (suffix) => normalizedHostname === suffix.slice(1) || normalizedHostname.endsWith(suffix),
    );
  } catch {
    return false;
  }
}

export const officialDomainChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    let hostname = "";

    try {
      hostname = new URL(ctx.pageUrl).hostname;
    } catch {
      // Invalid URLs are treated as non-official.
    }

    const official = isOfficialDomain(ctx.pageUrl);

    const result: CheckerResultData = {
      clauseId: CLAUSE_ID,
      pageUrl: ctx.pageUrl,
      status: official ? "pass" : "fail",
      severity: "high",
      evidence: official
        ? `Domain is an official government/institution domain: ${hostname}`
        : `Domain does not end with .gov.in, .nic.in, .edu.in, .res.in, or .ac.in: ${ctx.pageUrl}`,
      detail: null,
      checkedAt: new Date(),
    };

    return Promise.resolve([result]);
  },
};
