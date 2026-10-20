/**
 * Checker: sec-headers
 * Clause:  5.3.1-code-headers — HTTP response headers must not disclose
 *           server type, version, or technology stack.
 * Automation: automatable
 * Severity:   medium
 * Owner:      Member A (A-012)
 *
 * PASSIVE ONLY — requirements.md §7. No active scanning.
 *
 * Strategy:
 *  - Fetch the page URL and inspect response headers
 *  - FAIL if Server header reveals version (e.g. "Apache/2.4.51")
 *  - FAIL if X-Powered-By reveals stack info (e.g. "PHP/8.1.2", "Express")
 *  - PASS if headers are absent or generic (e.g. "nginx" without version)
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "sec-headers";
const CLAUSE_ID = "5.3.1-code-headers";

/** Patterns that indicate version disclosure in Server header */
const VERSION_RE = /\/[\d.]+/; // e.g. "Apache/2.4.51", "nginx/1.18.0"

export const headersChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();

    try {
      // Use fetch inside the page context to get response headers
      const headerInfo = await ctx.page.evaluate(async (url: string) => {
        const res = await fetch(url, { method: "GET", redirect: "follow" });
        const headers: Record<string, string> = {};
        res.headers.forEach((value, key) => {
          headers[key.toLowerCase()] = value;
        });
        return {
          server: headers["server"] ?? null,
          xPoweredBy: headers["x-powered-by"] ?? null,
          statusCode: res.status,
        };
      }, ctx.pageUrl);

      const issues: string[] = [];

      // Check Server header for version disclosure
      if (headerInfo.server && VERSION_RE.test(headerInfo.server)) {
        issues.push(`Server header reveals version: "${headerInfo.server}"`);
      }

      // Check X-Powered-By for stack disclosure
      if (headerInfo.xPoweredBy) {
        issues.push(`X-Powered-By header discloses stack: "${headerInfo.xPoweredBy}"`);
      }

      if (issues.length > 0) {
        return [
          {
            clauseId: CLAUSE_ID,
            pageUrl: ctx.pageUrl,
            status: "fail",
            severity: "medium",
            evidence: issues.join(". ") + ". Remove or obscure these headers.",
            detail: {
              server: headerInfo.server,
              xPoweredBy: headerInfo.xPoweredBy,
              statusCode: headerInfo.statusCode,
            },
            checkedAt: now,
          },
        ];
      }

      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "pass",
          severity: "medium",
          evidence:
            `Response headers do not disclose server version or technology stack. ` +
            `Server: ${headerInfo.server ?? "(not set)"}. ` +
            `X-Powered-By: ${headerInfo.xPoweredBy ?? "(not set)"}.`,
          detail: {
            server: headerInfo.server,
            xPoweredBy: headerInfo.xPoweredBy,
          },
          checkedAt: now,
        },
      ];
    } catch (err) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "needs_review",
          severity: "medium",
          evidence: `Could not inspect response headers: ${String(err)}`,
          detail: null,
          checkedAt: now,
        },
      ];
    }
  },
};
