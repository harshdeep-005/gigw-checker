/**
 * Checker: quality-india-portal-integration
 * Clause:  5.1.22 — API integration with India Portal ecosystem.
 * Automation: semi-automatable | Severity: medium | Owner: B
 *
 * Strategy: detect presence of integration links/widgets for DigiLocker,
 * Aadhaar, SSO, MyGov, MyScheme, india.gov.in, Data Platform.
 * Full functional integration cannot be verified by crawling.
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "quality-india-portal-integration";
const CLAUSE_ID = "5.1.22";
const INTEGRATIONS = [
  { name: "india.gov.in", re: /india\.gov\.in/i },
  { name: "DigiLocker", re: /digilocker/i },
  { name: "Aadhaar", re: /aadhaar/i },
  { name: "MyGov", re: /mygov\.in/i },
  { name: "MyScheme", re: /myscheme\.gov\.in/i },
  { name: "SSO/e-Gov", re: /\b(sso|e-?gov|digiseva|umang)\b/i },
];

export const indiaPortalIntegrationChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],
  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();
    const bodyText = ctx.html.toLowerCase();
    const found = INTEGRATIONS.filter((i) => i.re.test(bodyText)).map((i) => i.name);

    if (found.length === 0) {
      return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "needs_review", severity: "medium",
        evidence: "No India Portal ecosystem integration signals detected (DigiLocker, Aadhaar, MyGov, MyScheme, SSO, india.gov.in). Verify integration with applicable services.",
        detail: null, checkedAt: now }];
    }

    return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "needs_review", severity: "medium",
      evidence: `India Portal integration signals found: ${found.join(", ")}. Verify functional integration is correctly implemented (not just linked).`,
      detail: { found }, checkedAt: now }];
  },
};
