/**
 * Checker: sec-waf
 * Clause:  5.3.2-waf — Web Application Firewall must be present.
 * Automation: semi-automatable
 * Severity:   medium
 * Owner:      Member A (A-013)
 *
 * PASSIVE ONLY — requirements.md §7. Infers WAF presence from response
 * headers and behaviour, does not send any test payloads.
 *
 * Strategy:
 *  - Check for common WAF indicator headers:
 *    X-Sucuri-ID, CF-RAY (Cloudflare), X-Cache (various),
 *    Server: cloudflare, X-CDN, x-akamai-transformed
 *  - NEEDS_REVIEW if no WAF indicators found (absence of headers ≠ no WAF)
 *  - PASS if WAF indicator headers are present
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "sec-waf";
const CLAUSE_ID = "5.3.2-waf";

/** Headers that indicate a WAF/CDN is in front of the site */
const WAF_HEADER_PATTERNS: { header: string; waf: string }[] = [
  { header: "x-sucuri-id", waf: "Sucuri" },
  { header: "cf-ray", waf: "Cloudflare" },
  { header: "x-cdn", waf: "CDN" },
  { header: "x-akamai-transformed", waf: "Akamai" },
  { header: "x-amz-cf-id", waf: "AWS CloudFront" },
  { header: "x-fastly-request-id", waf: "Fastly" },
  { header: "x-incapsula-request", waf: "Incapsula/Imperva" },
  { header: "x-cdn-cache-status", waf: "CDN" },
];

const WAF_SERVER_PATTERNS = ["cloudflare", "sucuri", "imperva", "akamai"];

export const wafChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();

    try {
      const headerInfo = await ctx.page.evaluate(async (url: string) => {
        const res = await fetch(url, { method: "GET" });
        const headers: Record<string, string> = {};
        res.headers.forEach((value, key) => {
          headers[key.toLowerCase()] = value;
        });
        return { server: headers["server"] ?? "", allHeaders: Object.keys(headers) };
      }, ctx.pageUrl);

      // Check for WAF indicator headers
      const foundWAFs: string[] = [];
      for (const pattern of WAF_HEADER_PATTERNS) {
        if (headerInfo.allHeaders.includes(pattern.header)) {
          foundWAFs.push(pattern.waf);
        }
      }

      // Check Server header for WAF names
      const serverLower = headerInfo.server.toLowerCase();
      for (const wafName of WAF_SERVER_PATTERNS) {
        if (serverLower.includes(wafName)) {
          foundWAFs.push(wafName.charAt(0).toUpperCase() + wafName.slice(1));
        }
      }

      if (foundWAFs.length > 0) {
        return [
          {
            clauseId: CLAUSE_ID,
            pageUrl: ctx.pageUrl,
            status: "pass",
            severity: "medium",
            evidence:
              `WAF/CDN detected: ${[...new Set(foundWAFs)].join(", ")}. ` +
              `Indicator headers present in response.`,
            detail: { wafs: [...new Set(foundWAFs)] },
            checkedAt: now,
          },
        ];
      }

      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "needs_review",
          severity: "medium",
          evidence:
            "No WAF indicator headers detected. " +
            "Note: absence of these headers does not confirm no WAF is present — " +
            "some WAFs operate transparently. Manual verification recommended.",
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
          severity: "medium",
          evidence: `Could not check for WAF indicators: ${String(err)}`,
          detail: null,
          checkedAt: now,
        },
      ];
    }
  },
};
