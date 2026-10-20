/**
 * Checker: sec-cookies
 * Clause:  5.3.1-code-cookies — All cookies must have Secure and HttpOnly flags.
 * Automation: automatable
 * Severity:   high
 * Owner:      Member A (A-012)
 *
 * PASSIVE ONLY — requirements.md §7. No active scanning.
 *
 * Strategy:
 *  - Fetch the page URL and inspect Set-Cookie response headers
 *  - FAIL for any cookie missing the Secure flag on an HTTPS page
 *  - FAIL for any cookie missing the HttpOnly flag
 *  - Evidence lists cookie NAMES only — never values (security precaution)
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "sec-cookies";
const CLAUSE_ID = "5.3.1-code-cookies";

export const cookiesChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();

    try {
      // Fetch the page and inspect Set-Cookie headers
      const cookieInfo = await ctx.page.evaluate(async (url: string) => {
        const res = await fetch(url, { method: "GET", redirect: "follow" });
        // Set-Cookie headers are special — getSetCookie() returns array
        const setCookies = res.headers.getSetCookie();
        const cookies = setCookies.map((raw: string) => {
          const parts = raw.split(";");
          const nameValue = parts[0] ?? raw;
          const name = nameValue.split("=")[0]?.trim() ?? "unknown";
          const flags = parts.slice(1).map((p) => p.trim().toLowerCase());
          return {
            name,
            secure: flags.includes("secure"),
            httpOnly: flags.includes("httponly"),
          };
        });
        return { cookies, isHttps: url.startsWith("https://") };
      }, ctx.pageUrl);

      if (cookieInfo.cookies.length === 0) {
        return [
          {
            clauseId: CLAUSE_ID,
            pageUrl: ctx.pageUrl,
            status: "not_applicable",
            severity: "high",
            evidence: "No cookies set by this page.",
            detail: null,
            checkedAt: now,
          },
        ];
      }

      const issues: string[] = [];

      for (const cookie of cookieInfo.cookies) {
        if (!cookie.secure && cookieInfo.isHttps) {
          issues.push(`Cookie "${cookie.name}" missing Secure flag`);
        }
        if (!cookie.httpOnly) {
          issues.push(`Cookie "${cookie.name}" missing HttpOnly flag`);
        }
      }

      if (issues.length > 0) {
        return [
          {
            clauseId: CLAUSE_ID,
            pageUrl: ctx.pageUrl,
            status: "fail",
            severity: "high",
            evidence:
              `${String(issues.length)} cookie flag issue(s) found: ${issues.join("; ")}. ` +
              `All cookies must have Secure (on HTTPS) and HttpOnly flags.`,
            detail: {
              totalCookies: cookieInfo.cookies.length,
              issues,
              // Cookie names only — never values
              cookieNames: cookieInfo.cookies.map((c) => c.name),
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
            `All ${String(cookieInfo.cookies.length)} cookie(s) have Secure and HttpOnly flags set. ` +
            `Cookie names: ${cookieInfo.cookies.map((c) => c.name).join(", ")}`,
          detail: {
            totalCookies: cookieInfo.cookies.length,
            cookieNames: cookieInfo.cookies.map((c) => c.name),
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
          evidence: `Could not inspect cookie flags: ${String(err)}`,
          detail: null,
          checkedAt: now,
        },
      ];
    }
  },
};
