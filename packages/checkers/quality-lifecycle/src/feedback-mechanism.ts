/**
 * Checker: feedback-mechanism
 * Clause: 5.1.11 — A feedback/online form mechanism must be present.
 * Automation: semi (form presence automatable; response process manual)
 * Severity: low
 * Owner: Member B (B-006)
 */

import type { CheckerModule, CheckerContext } from "./types.js";
import type { CheckerResult } from "@gigw/db";

const CHECKER_ID = "feedback-mechanism";
const CLAUSE_ID = "5.1.11";

const FEEDBACK_LINK_RE = /<a\s[^>]*>([^<]*feedback[^<]*)<\/a>/i;
const FEEDBACK_HREF_RE = /<a\s[^>]*href=["']([^"']*feedback[^"']*)["'][^>]*>/i;
const FORM_RE = /<form\s[^>]*>/i;
const GRIEVANCE_RE = /<a\s[^>]*>([^<]*(?:grievance|complaint|suggest)[^<]*)<\/a>/i;

export const feedbackMechanismChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  run(ctx: CheckerContext): Promise<CheckerResult[]> {
    const html = ctx.html;
    const feedbackLink = FEEDBACK_LINK_RE.exec(html) ?? FEEDBACK_HREF_RE.exec(html);
    const hasForm = FORM_RE.test(html);
    const grievanceLink = GRIEVANCE_RE.exec(html);

    const found = feedbackLink !== null || grievanceLink !== null;

    const result: CheckerResult = {
      id: "",
      clauseId: CLAUSE_ID,
      pageUrl: ctx.pageUrl,
      status: found ? "needs_review" : (hasForm ? "needs_review" : "fail"),
      severity: "low",
      evidence: found
        ? `Feedback/grievance link found: "${(feedbackLink?.[1] ?? grievanceLink?.[1] ?? "").trim()}" — verify that submissions receive timely responses.`
        : hasForm
          ? "No explicit feedback link found, but a form is present — verify it serves as a feedback mechanism."
          : "No feedback mechanism (link or form) found on the page.",
      detail: {
        feedbackLink: feedbackLink?.[1]?.trim() ?? null,
        grievanceLink: grievanceLink?.[1]?.trim() ?? null,
        hasForm,
      },
      checkedAt: new Date(),
      pageReportId: null,
    };

    return Promise.resolve([result]);
  },
};
