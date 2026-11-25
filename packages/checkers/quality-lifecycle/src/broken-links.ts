/**
 * Checker: broken-links
 * Clause: 5.4.7 — No broken links (internal or external).
 * Automation: automatable
 * Severity: medium
 * Owner: Member B (B-007)
 *
 * Strategy: extract all <a href> URLs from the page, HEAD-request each one,
 * flag any that return 4xx/5xx or timeout. Skips mailto:, tel:, javascript:,
 * and fragment-only anchors. Caps at 50 links per page to stay within
 * reasonable execution time.
 *
 * Note: this checker IS async — it fires real HTTP requests.
 */

import type { CheckerModule, CheckerContext } from "./types.js";
import type { CheckerResult } from "@gigw/db";

const CHECKER_ID = "broken-links";
const CLAUSE_ID = "5.4.7";

const MAX_LINKS = 50;
const TIMEOUT_MS = 8000;

/** Extract unique absolute URLs from all <a href> attributes. */
function extractLinks(html: string, baseUrl: string): string[] {
  const hrefs: string[] = [];
  const re = /href=["']([^"'#][^"']*)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = re.exec(html)) !== null) {
    const raw = match[1]?.trim() ?? "";
    if (!raw || /^(?:mailto:|tel:|javascript:|#)/i.test(raw)) continue;
    try {
      const absolute = new URL(raw, baseUrl).href;
      // Only http/https
      if (absolute.startsWith("http")) hrefs.push(absolute);
    } catch {
      // unparseable href — skip
    }
  }

  // Deduplicate
  return [...new Set(hrefs)].slice(0, MAX_LINKS);
}

/** HEAD-request a URL, return the status code or null on error/timeout. */
async function headRequest(url: string): Promise<number | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; gigw-checker/1.0)" },
    });
    return res.status;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const brokenLinksChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResult[]> {
    const links = extractLinks(ctx.html, ctx.pageUrl);

    if (links.length === 0) {
      return [
        {
          id: "",
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "not_applicable",
          severity: "medium",
          evidence: "No external or internal links found on this page.",
          detail: { checked: 0, broken: [] },
          checkedAt: new Date(),
          pageReportId: null,
        },
      ];
    }

    // Check all links concurrently (bounded by the MAX_LINKS cap)
    const statuses = await Promise.all(
      links.map(async (url) => ({ url, status: await headRequest(url) })),
    );

    const broken = statuses.filter((s) => s.status === null || s.status >= 400);

    const result: CheckerResult = {
      id: "",
      clauseId: CLAUSE_ID,
      pageUrl: ctx.pageUrl,
      status: broken.length === 0 ? "pass" : "fail",
      severity: "medium",
      evidence:
        broken.length === 0
          ? `All ${String(links.length)} links checked are reachable.`
          : `${String(broken.length)} broken link(s) found out of ${String(links.length)} checked: ${broken.map((b) => `${b.url} (${b.status !== null ? String(b.status) : "timeout"})`).join("; ")}`,
      detail: {
        checked: links.length,
        broken: broken.map((b) => ({ url: b.url, status: b.status })),
      },
      checkedAt: new Date(),
      pageReportId: null,
    };

    return [result];
  },
};
