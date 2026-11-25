/**
 * Checker: ownership-info
 * Clause: 5.1.2 — Ownership information must be present on the homepage
 *                  and all entry pages (typically in header or footer).
 * Automation: automatable
 * Severity: medium
 * Owner: Member B (B-005)
 *
 * Strategy: look for ownership keywords in the HTML — ministry name,
 * "Government of India", "GoI", department name near header/footer.
 * Returns needs_review if partial signals found so a human can confirm.
 */

import type { CheckerModule, CheckerContext } from "./types.js";
import type { CheckerResult } from "@gigw/db";

const CHECKER_ID = "ownership-info";
const CLAUSE_ID = "5.1.2";

const STRONG_SIGNALS = [
  /government\s+of\s+india/i,
  /भारत\s+सरकार/, // "Bharat Sarkar" in Devanagari
  /ministry\s+of\s+/i,
  /department\s+of\s+/i,
  /national\s+(?:authority|commission|board|council|institute)/i,
];

const WEAK_SIGNALS = [
  /\bGo[Ii]\b/, // "GoI"
  /(?:govt|gov)\.in/i,
  /nic\.in/i,
];

export const ownershipInfoChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  run(ctx: CheckerContext): Promise<CheckerResult[]> {
    const html = ctx.html;

    const strongMatch = STRONG_SIGNALS.find((re) => re.test(html));
    const weakMatch = WEAK_SIGNALS.find((re) => re.test(html));

    let status: CheckerResult["status"];
    let evidence: string;

    if (strongMatch !== undefined) {
      status = "pass";
      evidence = `Ownership information found: matched pattern "${String(strongMatch)}"`;
    } else if (weakMatch !== undefined) {
      status = "needs_review";
      evidence = `Partial ownership signal found ("${String(weakMatch)}") — verify that ministry/department name is clearly displayed.`;
    } else {
      status = "fail";
      evidence =
        "No ownership information detected. Ministry/department name and 'Government of India' should appear on the page.";
    }

    const result: CheckerResult = {
      id: "",
      clauseId: CLAUSE_ID,
      pageUrl: ctx.pageUrl,
      status,
      severity: "medium",
      evidence,
      detail: {
        strongMatch: strongMatch ? String(strongMatch) : null,
        weakMatch: weakMatch ? String(weakMatch) : null,
      },
      checkedAt: new Date(),
      pageReportId: null,
    };

    return Promise.resolve([result]);
  },
};
