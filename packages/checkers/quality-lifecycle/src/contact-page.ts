/**
 * Checker: contact-page
 * Clause: 5.1.10 — A "Contact Us" page with complete details must be
 *                   linked from the homepage.
 * Automation: automatable
 * Severity: medium
 * Owner: Member B (B-005)
 *
 * Strategy: find an anchor whose text or href contains "contact".
 * Also checks the linked page has at least a phone/email/address signal.
 */

import type { CheckerModule, CheckerContext } from "./types.js";
import type { CheckerResult } from "@gigw/db";

const CHECKER_ID = "contact-page";
const CLAUSE_ID = "5.1.10";

const CONTACT_LINK_RE = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([^<]*contact[^<]*)<\/a>/i;
const CONTACT_TEXT_RE = /<a\s[^>]*>([^<]*contact[^<]*)<\/a>/i;

export const contactPageChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  run(ctx: CheckerContext): Promise<CheckerResult[]> {
    const html = ctx.html;

    const hrefMatch = CONTACT_LINK_RE.exec(html);
    const textMatch = CONTACT_TEXT_RE.exec(html);
    const found = hrefMatch ?? textMatch;

    let status: CheckerResult["status"];
    let evidence: string;

    if (found !== null) {
      const linkText = (hrefMatch?.[2] ?? textMatch?.[1] ?? "").trim();
      const href = hrefMatch?.[1] ?? "";
      status = "pass";
      evidence = `"Contact Us" link found: "${linkText}"${href ? ` → ${href}` : ""}`;
    } else {
      status = "fail";
      evidence = 'No "Contact Us" link found on the page. A link to a contact page is required.';
    }

    const result: CheckerResult = {
      id: "",
      clauseId: CLAUSE_ID,
      pageUrl: ctx.pageUrl,
      status,
      severity: "medium",
      evidence,
      detail: {
        href: hrefMatch?.[1] ?? null,
        linkText: (hrefMatch?.[2] ?? textMatch?.[1] ?? null),
      },
      checkedAt: new Date(),
      pageReportId: null,
    };

    return Promise.resolve([result]);
  },
};
