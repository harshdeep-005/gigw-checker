/**
 * Checker: quality-min-content
 * Clause:  5.1.18 — Homepage must have minimum prescribed content elements.
 * Automation: automatable | Severity: high | Owner: B
 *
 * Required elements per GIGW §5.1.18:
 *   - State Emblem / Ministry logo
 *   - Site name / organisation name
 *   - Link to National Portal (india.gov.in)
 *   - Contact Us link
 *   - About Us link
 *   - Skip to main content link
 *   - Last updated date
 *   - Website search
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "quality-min-content";
const CLAUSE_ID = "5.1.18";

export const minContentChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],
  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();
    const checks = await ctx.page.evaluate(() => {
      const text = (document.body.textContent ?? "").toLowerCase();
      const links = Array.from(document.querySelectorAll("a[href]")).map((a) => ({
        text: (a.textContent ?? "").toLowerCase().trim(),
        href: ((a as HTMLAnchorElement).href ?? "").toLowerCase(),
      }));

      const hasLogo = !!(document.querySelector("img[alt*='logo'], img[alt*='emblem'], img[alt*='Logo'], img[alt*='Emblem']") ??
                        document.querySelector("header img"));
      const hasSearch = !!(document.querySelector("input[type='search'], input[name='q'], input[name='query'], [role='search']"));
      const hasSkipLink = links.some((l) => l.href.includes("#") && /skip|main|content/i.test(l.text));
      const hasContactLink = links.some((l) => /contact/i.test(l.text) || /contact/i.test(l.href));
      const hasAboutLink = links.some((l) => /about/i.test(l.text) || /about/i.test(l.href));
      const hasNationalPortal = links.some((l) => l.href.includes("india.gov.in"));
      const hasDate = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})\b/i.test(text);

      return { hasLogo, hasSearch, hasSkipLink, hasContactLink, hasAboutLink, hasNationalPortal, hasDate };
    });

    const missing: string[] = [];
    if (!checks.hasLogo) missing.push("State Emblem / Ministry logo");
    if (!checks.hasSearch) missing.push("Website search");
    if (!checks.hasSkipLink) missing.push("Skip to main content link");
    if (!checks.hasContactLink) missing.push("Contact Us link");
    if (!checks.hasAboutLink) missing.push("About Us link");
    if (!checks.hasNationalPortal) missing.push("Link to india.gov.in (National Portal)");
    if (!checks.hasDate) missing.push("Last updated date");

    if (missing.length > 0) {
      return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "fail", severity: "high",
        evidence: `Missing required homepage content: ${missing.join(", ")}.`,
        detail: checks, checkedAt: now }];
    }

    return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "pass", severity: "high",
      evidence: "All minimum prescribed homepage content elements are present.",
      detail: checks, checkedAt: now }];
  },
};
