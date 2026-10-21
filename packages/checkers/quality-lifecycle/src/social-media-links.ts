/**
 * Checker: social-media-links
 * Clause: 5.1.24 — Two-way social media integration (links to official
 *                   social media accounts present on the page).
 * Automation: automatable
 * Severity: low
 * Owner: Member B (B-005)
 *
 * Strategy: detect anchor hrefs pointing to known social media platforms.
 */

import type { CheckerModule, CheckerContext } from "./types.js";
import type { CheckerResult } from "@gigw/db";

const CHECKER_ID = "social-media-links";
const CLAUSE_ID = "5.1.24";

const SOCIAL_PLATFORMS: { name: string; pattern: RegExp }[] = [
  { name: "Twitter/X", pattern: /href=["'][^"']*(?:twitter\.com|x\.com)\/[^"']+["']/i },
  { name: "Facebook", pattern: /href=["'][^"']*facebook\.com\/[^"']+["']/i },
  { name: "YouTube", pattern: /href=["'][^"']*youtube\.com\/(?:channel|c|user|@)[^"']+["']/i },
  { name: "Instagram", pattern: /href=["'][^"']*instagram\.com\/[^"']+["']/i },
  { name: "LinkedIn", pattern: /href=["'][^"']*linkedin\.com\/[^"']+["']/i },
  { name: "Koo", pattern: /href=["'][^"']*kooapp\.com\/[^"']+["']/i },
  { name: "ShareChat", pattern: /href=["'][^"']*sharechat\.com\/[^"']+["']/i },
];

export const socialMediaLinksChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  run(ctx: CheckerContext): Promise<CheckerResult[]> {
    const html = ctx.html;

    const found = SOCIAL_PLATFORMS.filter((p) => p.pattern.test(html)).map((p) => p.name);

    let status: CheckerResult["status"];
    let evidence: string;

    if (found.length >= 2) {
      status = "pass";
      evidence = `Social media links found: ${found.join(", ")}.`;
    } else if (found.length === 1) {
      status = "needs_review";
      evidence = `Only one social media platform linked (${found[0] ?? ""}). GIGW recommends integration with multiple platforms — verify if this is intentional.`;
    } else {
      status = "fail";
      evidence = "No social media links found. Links to official social media accounts are required.";
    }

    const result: CheckerResult = {
      id: "",
      clauseId: CLAUSE_ID,
      pageUrl: ctx.pageUrl,
      status,
      severity: "low",
      evidence,
      detail: { foundPlatforms: found },
      checkedAt: new Date(),
      pageReportId: null,
    };

    return Promise.resolve([result]);
  },
};
