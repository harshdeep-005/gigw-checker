/**
 * Checker: sec-error-page
 * Clause:  5.3.1-code-errors — Custom error pages must not expose stack traces.
 * Automation: semi-automatable
 * Severity:   high
 * Owner:      Member A (A-013)
 *
 * PASSIVE ONLY — requirements.md §7. This is the exact boundary.
 *
 * Strategy:
 *  - Navigate to a genuinely non-existent URL on the same origin
 *    (this is just visiting a page that doesn't exist — no different from
 *    a normal 404, NOT a probing technique per §7)
 *  - FAIL if response body contains stack trace patterns:
 *    "at Object.", "stack:", "Traceback", "Exception in thread",
 *    "NullPointerException", "at java.", "at sun."
 *  - FAIL if response body contains server file paths:
 *    "/var/www/", "/home/", "/usr/share/", "C:\\", "/opt/"
 *  - PASS if page is a clean custom error page
 *
 * BOUNDARY: This checker navigates to one non-existent URL. It does NOT
 * probe admin paths, config files, or use any exploit technique.
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "sec-error-page";
const CLAUSE_ID = "5.3.1-code-errors";

/** Stack trace patterns that indicate technology exposure */
const STACK_TRACE_PATTERNS = [
  /at Object\./,
  /at Function\./,
  /\bstack:/i,
  /Traceback \(most recent call last\)/,
  /Exception in thread/,
  /NullPointerException/,
  /at java\./,
  /at sun\./,
  /at org\./,
  /at com\./,
  /PHP (Fatal error|Warning|Notice)/,
  /Symfony\\Component/,
  /Django\.core\.exceptions/,
  /at Module\./,
  /node:internal/,
];

/** Server file path patterns */
const SERVER_PATH_PATTERNS = [
  /\/var\/www\//,
  /\/home\/\w/,
  /\/usr\/share\//,
  /\/opt\//,
  /C:\\(?:inetpub|Program Files|Users)/,
  /\/srv\//,
];

export const errorPageChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();

    try {
      // Construct a genuinely non-existent URL — this is just visiting
      // a page that doesn't exist, per requirements.md §7
      const errorUrl = new URL(
        `/this-page-does-not-exist-gigw-checker-${String(Date.now())}`,
        ctx.pageUrl,
      ).href;

      const errorInfo = await ctx.page.evaluate(async (url: string) => {
        const res = await fetch(url, { method: "GET", redirect: "follow" });
        const body = await res.text();
        return {
          status: res.status,
          bodyLength: body.length,
          bodyPreview: body.slice(0, 2000), // first 2KB for pattern matching
        };
      }, errorUrl);

      // Check for stack trace patterns
      const foundStackTraces = STACK_TRACE_PATTERNS.filter((re) => re.test(errorInfo.bodyPreview));
      const foundPaths = SERVER_PATH_PATTERNS.filter((re) => re.test(errorInfo.bodyPreview));

      if (foundStackTraces.length > 0 || foundPaths.length > 0) {
        const issues: string[] = [];
        if (foundStackTraces.length > 0) {
          issues.push(
            `stack trace patterns detected: ${foundStackTraces
              .map((r) => r.source)
              .slice(0, 3)
              .join(", ")}`,
          );
        }
        if (foundPaths.length > 0) {
          issues.push(
            `server file paths exposed: ${foundPaths
              .map((r) => r.source)
              .slice(0, 3)
              .join(", ")}`,
          );
        }
        return [
          {
            clauseId: CLAUSE_ID,
            pageUrl: ctx.pageUrl,
            status: "fail",
            severity: "high",
            evidence:
              `Error page (HTTP ${String(errorInfo.status)}) exposes internal information: ` +
              issues.join("; ") +
              `. Custom error pages must not reveal stack traces or server paths.`,
            detail: {
              errorHttpStatus: errorInfo.status,
              bodyLength: errorInfo.bodyLength,
              stackTraces: foundStackTraces.map((r) => r.source),
              serverPaths: foundPaths.map((r) => r.source),
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
          severity: "high",
          evidence:
            `Error page (HTTP ${String(errorInfo.status)}) does not expose stack traces or server paths. ` +
            `Body length: ${String(errorInfo.bodyLength)} bytes.`,
          detail: {
            errorHttpStatus: errorInfo.status,
            bodyLength: errorInfo.bodyLength,
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
          severity: "high",
          evidence: `Could not test error page: ${String(err)}`,
          detail: null,
          checkedAt: now,
        },
      ];
    }
  },
};
