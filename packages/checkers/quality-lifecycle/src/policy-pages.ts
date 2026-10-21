/**
 * Checker: policy-pages
 * Clause: 5.4.3 — Copyright, Hyperlinking, Terms & Conditions, and Privacy
 *                  Policy pages must be defined and linked.
 * Automation: semi (link presence automatable; WIM-approval status manual)
 * Severity: medium
 * Owner: Member B (B-008)
 */

import type { CheckerModule, CheckerContext } from "./types.js";
import type { CheckerResult } from "@gigw/db";

const CHECKER_ID = "policy-pages";
const CLAUSE_ID = "5.4.3";

interface PolicyCheck {
  name: string;
  pattern: RegExp;
}

const POLICIES: PolicyCheck[] = [
  { name: "Copyright Policy", pattern: /copyright\s*policy/i },
  { name: "Privacy Policy", pattern: /privacy\s*policy/i },
  { name: "Terms & Conditions", pattern: /terms\s*(?:and|&|of)\s*(?:use|conditions?|service)/i },
  { name: "Hyperlinking Policy", pattern: /hyperlinking\s*policy/i },
];

export const policyPagesChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  run(ctx: CheckerContext): Promise<CheckerResult[]> {
    const html = ctx.html;
    const now = new Date();

    return Promise.resolve(
      POLICIES.map((policy) => {
        const found = policy.pattern.test(html);
        const result: CheckerResult = {
          id: "",
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: found ? "needs_review" : "fail",
          severity: "medium",
          evidence: found
            ? `"${policy.name}" link/text found — verify the policy is complete and WIM-approved.`
            : `"${policy.name}" not found on the page.`,
          detail: { subCheck: policy.name, found },
          checkedAt: now,
          pageReportId: null,
        };
        return result;
      }),
    );
  },
};
