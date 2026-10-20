/**
 * Checker: sec-tls-comms
 * Clause:  5.3.1-code-tls-comms — 3rd-party/API comms visible in page
 *           network traffic must be encrypted.
 * Automation: semi-automatable
 * Severity:   high
 * Owner:      Member A (A-013)
 *
 * PASSIVE ONLY — requirements.md §7. Observes network traffic, does not
 * initiate any non-standard requests.
 *
 * Strategy:
 *  - Collect all 3rd-party requests made during page load
 *    (via PerformanceObserver entries — passive observation)
 *  - FAIL for any http:// request to a 3rd-party domain
 *  - NEEDS_REVIEW for https 3rd-party requests (can't verify their cert chain)
 *  - PASS if all 3rd-party comms are https
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "sec-tls-comms";
const CLAUSE_ID = "5.3.1-code-tls-comms";

export const tlsCommsChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();

    try {
      const commsInfo = await ctx.page.evaluate((pageUrl: string) => {
        const pageOrigin = new URL(pageUrl).origin;
        const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];

        const thirdParty = entries
          .filter((e) => {
            try {
              return new URL(e.name).origin !== pageOrigin;
            } catch {
              return false;
            }
          })
          .map((e) => ({
            url: e.name.slice(0, 100),
            protocol: new URL(e.name).protocol,
            isHttp: new URL(e.name).protocol === "http:",
          }));

        const httpCount = thirdParty.filter((t) => t.isHttp).length;
        return { thirdParty, httpCount, total: thirdParty.length };
      }, ctx.pageUrl);

      if (commsInfo.httpCount > 0) {
        const httpUrls = commsInfo.thirdParty
          .filter((t) => t.isHttp)
          .slice(0, 3)
          .map((t) => t.url);
        return [
          {
            clauseId: CLAUSE_ID,
            pageUrl: ctx.pageUrl,
            status: "fail",
            severity: "high",
            evidence:
              `${String(commsInfo.httpCount)} of ${String(commsInfo.total)} 3rd-party request(s) ` +
              `use unencrypted HTTP: ${httpUrls.join(", ")}. ` +
              `All 3rd-party API communications must be encrypted.`,
            detail: {
              totalThirdParty: commsInfo.total,
              httpCount: commsInfo.httpCount,
              httpUrls,
            },
            checkedAt: now,
          },
        ];
      }

      if (commsInfo.total > 0) {
        return [
          {
            clauseId: CLAUSE_ID,
            pageUrl: ctx.pageUrl,
            status: "needs_review",
            severity: "high",
            evidence:
              `All ${String(commsInfo.total)} 3rd-party request(s) use HTTPS. ` +
              `Cannot verify their TLS certificate chains from browser context — ` +
              `manual verification recommended.`,
            detail: { totalThirdParty: commsInfo.total, httpCount: 0 },
            checkedAt: now,
          },
        ];
      }

      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "not_applicable",
          severity: "high",
          evidence: "No 3rd-party network requests detected on this page.",
          detail: null,
          checkedAt: now,
        },
      ];
    } catch (err) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "needs_review",
          severity: "high",
          evidence: `Could not inspect 3rd-party comms: ${String(err)}`,
          detail: null,
          checkedAt: now,
        },
      ];
    }
  },
};
