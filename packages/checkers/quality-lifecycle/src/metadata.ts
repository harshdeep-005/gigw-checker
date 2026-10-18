/**
 * Checker: metadata
 * Clause: 5.1.21 — Pages must have a meaningful <title>, <meta name="description">,
 *                  and <meta name="keywords">.
 * Automation: automatable
 * Severity: medium
 * Owner: Member B (B-004 / B-005)
 *
 * Strategy: parse the HTML string (no extra network request). Produces one
 * CheckerResult per sub-check so the dashboard can show granular evidence.
 */

import type { CheckerModule, CheckerContext } from "./types.js";
import type { CheckerResult } from "@gigw/db";

const CHECKER_ID = "metadata";
const CLAUSE_ID = "5.1.21";

interface MetaCheck {
  name: string;
  extract: (html: string) => string | null;
  emptyEvidence: string;
  presentEvidence: (value: string) => string;
}

const META_CHECKS: MetaCheck[] = [
  {
    name: "page-title",
    extract: (html) => {
      const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
      return match?.[1]?.trim() ?? null;
    },
    emptyEvidence: "Page <title> is missing or empty.",
    presentEvidence: (v) => `Page <title> present: "${v.slice(0, 120)}"`,
  },
  {
    name: "meta-description",
    extract: (html) => {
      const match =
        /<meta\s+(?:[^>]*\s)?name=["']description["'][^>]*content=["']([^"']+)["']/i.exec(html) ??
        /<meta\s+(?:[^>]*\s)?content=["']([^"']+)["'][^>]*name=["']description["']/i.exec(html);
      return match?.[1]?.trim() ?? null;
    },
    emptyEvidence: '<meta name="description"> is missing or empty.',
    presentEvidence: (v) => `<meta name="description"> present: "${v.slice(0, 120)}"`,
  },
  {
    name: "meta-keywords",
    extract: (html) => {
      const match =
        /<meta\s+(?:[^>]*\s)?name=["']keywords["'][^>]*content=["']([^"']+)["']/i.exec(html) ??
        /<meta\s+(?:[^>]*\s)?content=["']([^"']+)["'][^>]*name=["']keywords["']/i.exec(html);
      return match?.[1]?.trim() ?? null;
    },
    emptyEvidence: '<meta name="keywords"> is missing or empty.',
    presentEvidence: (v) => `<meta name="keywords"> present: "${v.slice(0, 120)}"`,
  },
];

export const metadataChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  run(ctx: CheckerContext): Promise<CheckerResult[]> {
    const now = new Date();

    const results = META_CHECKS.map((check) => {
      const value = check.extract(ctx.html);
      const present = value !== null && value.length > 0;

      const result: CheckerResult = {
        id: "",
        clauseId: CLAUSE_ID,
        pageUrl: ctx.pageUrl,
        status: present ? "pass" : "fail",
        severity: "medium",
        evidence: present ? check.presentEvidence(value) : check.emptyEvidence,
        detail: { subCheck: check.name, value: value ?? null },
        checkedAt: now,
        pageReportId: null,
      };

      return result;
    });

    return Promise.resolve(results);
  },
};
