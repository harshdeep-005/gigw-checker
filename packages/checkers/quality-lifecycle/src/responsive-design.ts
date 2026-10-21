/**
 * Checker: responsive-design
 * Clause: 5.1.15 — CSS-based layout and responsive design (viewport meta +
 *                   external stylesheet + media queries).
 * Automation: automatable
 * Severity: medium
 * Owner: Member B (B-005)
 *
 * Strategy: check for three signals:
 *   1. <meta name="viewport"> with width=device-width
 *   2. At least one external <link rel="stylesheet">
 *   3. @media query in inline styles or a <style> block (heuristic)
 * All three → pass. Missing viewport → fail. Missing others → needs_review.
 */

import type { CheckerModule, CheckerContext } from "./types.js";
import type { CheckerResult } from "@gigw/db";

const CHECKER_ID = "responsive-design";
const CLAUSE_ID = "5.1.15";

const VIEWPORT_RE = /<meta\s[^>]*name=["']viewport["'][^>]*content=["'][^"']*width\s*=\s*device-width[^"']*["']/i;
const VIEWPORT_ALT_RE = /<meta\s[^>]*content=["'][^"']*width\s*=\s*device-width[^"']*["'][^>]*name=["']viewport["']/i;
const STYLESHEET_RE = /<link\s[^>]*rel=["']stylesheet["'][^>]*>/i;
const MEDIA_QUERY_RE = /@media\s*[\w\s,():-]+\{/i;

export const responsiveDesignChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  run(ctx: CheckerContext): Promise<CheckerResult[]> {
    const html = ctx.html;

    const hasViewport = VIEWPORT_RE.test(html) || VIEWPORT_ALT_RE.test(html);
    const hasStylesheet = STYLESHEET_RE.test(html);
    const hasMediaQuery = MEDIA_QUERY_RE.test(html);

    let status: CheckerResult["status"];
    let evidence: string;

    if (hasViewport && hasStylesheet && hasMediaQuery) {
      status = "pass";
      evidence = "Responsive design signals found: viewport meta, external stylesheet, and @media queries present.";
    } else if (!hasViewport) {
      status = "fail";
      evidence = 'Missing <meta name="viewport" content="width=device-width"> — page is not configured for responsive/mobile layout.';
    } else {
      status = "needs_review";
      const missing: string[] = [];
      if (!hasStylesheet) missing.push("external stylesheet");
      if (!hasMediaQuery) missing.push("@media queries");
      evidence = `Viewport meta present but missing: ${missing.join(", ")}. Verify responsive layout manually.`;
    }

    const result: CheckerResult = {
      id: "",
      clauseId: CLAUSE_ID,
      pageUrl: ctx.pageUrl,
      status,
      severity: "medium",
      evidence,
      detail: { hasViewport, hasStylesheet, hasMediaQuery },
      checkedAt: new Date(),
      pageReportId: null,
    };

    return Promise.resolve([result]);
  },
};
