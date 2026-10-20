/**
 * Checker: a11y-captions
 * Clause:  5.2.3 — Prerecorded audio in synchronised media must have captions (WCAG 1.2.2)
 * Automation: semi-automatable
 * Severity:   high
 * Owner:      Member A (A-010)
 *
 * Strategy:
 *  - FAIL:         <video> has no <track kind="captions"> child
 *  - NEEDS_REVIEW: <video> has a captions track but quality/accuracy is manual
 *  - NOT_APPLICABLE: no <video> elements on page
 *
 * Note: <audio> elements are covered by clause 5.2.2 (manual-only — transcript
 * presence cannot be detected from markup). This checker is video-only.
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "a11y-captions";
const CLAUSE_ID = "5.2.3";

export const captionsChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();

    const videoResults = await ctx.page.$$eval("video", (videos) =>
      videos.map((v) => {
        const tracks = Array.from(v.querySelectorAll("track"));
        const hasCaption = tracks.some((t) => t.kind === "captions" || t.kind === "subtitles");
        return {
          hasCaption,
          src: v.src.slice(0, 120),
          trackCount: tracks.length,
        };
      }),
    );

    if (videoResults.length === 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "not_applicable",
          severity: "high",
          evidence: "No <video> elements found on this page.",
          detail: null,
          checkedAt: now,
        },
      ];
    }

    const missing = videoResults.filter((v) => !v.hasCaption);

    if (missing.length > 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "fail",
          severity: "high",
          evidence:
            `${String(missing.length)} of ${String(videoResults.length)} <video> elements ` +
            `have no <track kind="captions"> or <track kind="subtitles">. ` +
            `First offender src: ${missing[0]?.src ?? "unknown"}`,
          detail: { total: videoResults.length, missing: missing.length },
          checkedAt: now,
        },
      ];
    }

    return [
      {
        clauseId: CLAUSE_ID,
        pageUrl: ctx.pageUrl,
        status: "needs_review",
        severity: "high",
        evidence:
          `All ${String(videoResults.length)} <video> elements have a captions/subtitles track. ` +
          `Verify caption accuracy and synchronisation manually.`,
        detail: { total: videoResults.length },
        checkedAt: now,
      },
    ];
  },
};
