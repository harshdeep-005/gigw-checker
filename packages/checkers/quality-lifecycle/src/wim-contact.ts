/**
 * Checker: wim-contact
 * Clause: 5.4.1 — Web Information Manager (WIM) contact details must be
 *                  displayed on the site.
 * Automation: semi (presence automatable; formal nomination is manual)
 * Severity: medium
 * Owner: Member B (B-008)
 *
 * Strategy: scan for "Web Information Manager", "WIM", or similar
 * role labels near contact-detail patterns (email, phone).
 */

import type { CheckerModule, CheckerContext } from "./types.js";
import type { CheckerResult } from "@gigw/db";

const CHECKER_ID = "wim-contact";
const CLAUSE_ID = "5.4.1";

const WIM_RE = /web\s+information\s+manager|(?:\bWIM\b)/i;
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/; // eslint-disable-line no-useless-escape
const PHONE_RE = /(?:\+91[\s-]?)?[0-9]{10}|[0-9]{2,5}[\s-][0-9]{6,8}/;

export const wimContactChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  run(ctx: CheckerContext): Promise<CheckerResult[]> {
    const html = ctx.html;

    const wimFound = WIM_RE.test(html);
    const emailFound = EMAIL_RE.test(html);
    const phoneFound = PHONE_RE.test(html);

    let status: CheckerResult["status"];
    let evidence: string;

    if (wimFound && (emailFound || phoneFound)) {
      status = "needs_review";
      evidence =
        "WIM label and contact details detected — verify that the named official holds the required JS-rank and is formally nominated.";
    } else if (wimFound) {
      status = "needs_review";
      evidence =
        "WIM label found but no associated email or phone number detected nearby — verify contact details are complete.";
    } else if (emailFound || phoneFound) {
      status = "needs_review";
      evidence =
        "Contact details (email/phone) present but no 'Web Information Manager' label — verify WIM is explicitly identified.";
    } else {
      status = "fail";
      evidence =
        "No WIM label or contact details found. Web Information Manager contact details are required on the site.";
    }

    const result: CheckerResult = {
      id: "",
      clauseId: CLAUSE_ID,
      pageUrl: ctx.pageUrl,
      status,
      severity: "medium",
      evidence,
      detail: { wimFound, emailFound, phoneFound },
      checkedAt: new Date(),
      pageReportId: null,
    };

    return Promise.resolve([result]);
  },
};
