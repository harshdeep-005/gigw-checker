/**
 * Checker: sec-policies
 * Clause:  5.3.3 — Security Policy, Privacy Policy, and Contingency Plan
 *           must be defined and published on the site.
 * Automation: semi-automatable
 * Severity:   medium
 * Owner:      Member A (A-013)
 *
 * PASSIVE ONLY — requirements.md §7. Only checks for presence of policy
 * links, does not evaluate policy content.
 *
 * Strategy:
 *  - Search for links containing policy-related keywords:
 *    "privacy", "security-policy", "security policy", "cookie-policy",
 *    "contingency", "terms", "disclaimer"
 *  - FAIL if no privacy policy link found on the page
 *  - NEEDS_REVIEW if links found — content adequacy requires manual review
 *  - NOT_APPLICABLE: unlikely, but handle empty page gracefully
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "sec-policies";
const CLAUSE_ID = "5.3.3";

const POLICY_KEYWORDS = {
  privacy: ["privacy", "privacy-policy", "data-protection", "data-policy"],
  security: ["security-policy", "security policy", "security-guidelines"],
  contingency: ["contingency", "disaster-recovery", "business-continuity"],
  terms: ["terms", "terms-and-conditions", "tnc", "disclaimer"],
};

export const policiesChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();

    const linkAnalysis = await ctx.page.$$eval("a[href]", (anchors) =>
      anchors.map((a) => ({
        text: (a.textContent ?? "").trim().toLowerCase().slice(0, 80),
        href: (a as HTMLAnchorElement).href.toLowerCase().slice(0, 120),
      })),
    );

    const found: { privacy: string[]; security: string[]; contingency: string[]; terms: string[] } =
      {
        privacy: [],
        security: [],
        contingency: [],
        terms: [],
      };

    for (const [policyType, keywords] of Object.entries(POLICY_KEYWORDS) as Array<
      [keyof typeof found, string[]]
    >) {
      for (const link of linkAnalysis) {
        for (const kw of keywords) {
          if (link.text.includes(kw) || link.href.includes(kw)) {
            found[policyType].push(link.href.slice(0, 80));
            break;
          }
        }
      }
    }

    const missingPolicies = Object.entries(found)
      .filter(([, urls]) => urls.length === 0)
      .map(([type]) => type);

    // Privacy policy is the most critical — fail if missing
    if (found.privacy.length === 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "fail",
          severity: "medium",
          evidence:
            "No privacy policy link found on this page. " +
            "GIGW 3.0 §5.3.3 requires a published privacy policy. " +
            (missingPolicies.length > 1
              ? `Also missing: ${missingPolicies.slice(1).join(", ")}.`
              : ""),
          detail: { found, missing: missingPolicies },
          checkedAt: now,
        },
      ];
    }

    // Privacy policy found — other policies may be missing
    if (missingPolicies.length > 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "needs_review",
          severity: "medium",
          evidence:
            `Privacy policy link found: ${found.privacy[0] ?? "(url unavailable)"}. ` +
            `Missing: ${missingPolicies.join(", ")}. ` +
            `Verify that required policies are published and adequate.`,
          detail: { found, missing: missingPolicies },
          checkedAt: now,
        },
      ];
    }

    return [
      {
        clauseId: CLAUSE_ID,
        pageUrl: ctx.pageUrl,
        status: "needs_review",
        severity: "medium",
        evidence:
          `All policy types found (privacy, security, contingency, terms). ` +
          `Verify policy content is current and approved by the WIM.`,
        detail: { found, missing: [] },
        checkedAt: now,
      },
    ];
  },
};
