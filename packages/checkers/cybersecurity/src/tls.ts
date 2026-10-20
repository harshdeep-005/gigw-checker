/**
 * Checker: sec-tls
 * Clauses: 5.3.2-tls    — Valid SSL/TLS certificate (≥2048-bit SHA-256)
 *          5.3.2-https  — HTTPS enforced, HTTP disabled, HSTS present
 *          5.3.2-ciphers — Weak protocols/ciphers disabled
 * Automation: automatable
 * Severity:   high
 * Owner:      Member A (A-012)
 *
 * PASSIVE ONLY — requirements.md §7. No active scanning.
 *
 * Strategy:
 *  - 5.3.2-tls: Check page is served over HTTPS. If Playwright loaded it,
 *    the TLS handshake already succeeded — cert is valid. If invalid,
 *    Playwright would have thrown (caught by crawler, page marked error).
 *  - 5.3.2-https: Check location.protocol === "https:". Check for HSTS
 *    header via fetch. Check for mixed-content (http:// resources on page).
 *  - 5.3.2-ciphers: Cannot fully check cipher suite from browser context.
 *    Flag as needs_review — requires server-side TLS scan (e.g. SSL Labs).
 *    Detect mixed-content as a proxy for weak configuration.
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "sec-tls";
const CLAUSE_IDS = ["5.3.2-tls", "5.3.2-https", "5.3.2-ciphers"] as const;

export const tlsChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [...CLAUSE_IDS],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();
    const results: CheckerResultData[] = [];

    // ── Inspect protocol, HSTS, and mixed content ────────────────────────────
    const tlsInfo = await ctx.page.evaluate(async (url: string) => {
      const protocol = window.location.protocol;
      const isHttps = protocol === "https:";

      // Check for HSTS header
      let hstsHeader: string | null = null;
      try {
        const res = await fetch(url, { method: "GET" });
        hstsHeader = res.headers.get("strict-transport-security");
      } catch {
        // fetch may fail for various reasons — HSTS check is best-effort
      }

      // Check for mixed content — http:// resources on an https page
      const mixedContent: string[] = [];
      if (isHttps) {
        // Check all resource-loading elements
        const elements = Array.from(
          document.querySelectorAll(
            "img[src], script[src], link[href], iframe[src], video[src], audio[src], source[src], embed[src], object[data]",
          ),
        );
        for (const el of elements) {
          const src =
            el.getAttribute("src") || el.getAttribute("href") || el.getAttribute("data") || "";
          if (src.startsWith("http://")) {
            mixedContent.push(src.slice(0, 80));
          }
        }
      }

      return { protocol, isHttps, hstsHeader, mixedContent: mixedContent.slice(0, 5) };
    }, ctx.pageUrl);

    // ── 5.3.2-tls — Valid SSL/TLS certificate ────────────────────────────────
    // If we're on HTTPS, the cert is valid (Playwright would have rejected
    // an invalid cert during navigation). If HTTP, fail.
    if (tlsInfo.isHttps) {
      results.push({
        clauseId: "5.3.2-tls",
        pageUrl: ctx.pageUrl,
        status: "pass",
        severity: "high",
        evidence:
          "Page is served over HTTPS with a valid TLS certificate " +
          "(Playwright validated the certificate during navigation). " +
          "Note: key strength and SHA-256 verification requires a server-side TLS scan.",
        detail: { protocol: tlsInfo.protocol },
        checkedAt: now,
      });
    } else {
      results.push({
        clauseId: "5.3.2-tls",
        pageUrl: ctx.pageUrl,
        status: "fail",
        severity: "high",
        evidence:
          `Page is served over ${tlsInfo.protocol} — no TLS certificate in use. ` +
          "HTTPS is required for all government websites.",
        detail: { protocol: tlsInfo.protocol },
        checkedAt: now,
      });
    }

    // ── 5.3.2-https — HTTPS enforced, HSTS present ────────────────────────────
    const httpsIssues: string[] = [];
    if (!tlsInfo.isHttps) {
      httpsIssues.push("Page is not served over HTTPS");
    }
    if (tlsInfo.isHttps && !tlsInfo.hstsHeader) {
      httpsIssues.push("Strict-Transport-Security (HSTS) header is not set");
    }
    if (tlsInfo.mixedContent.length > 0) {
      httpsIssues.push(
        `Mixed content detected: ${String(tlsInfo.mixedContent.length)} HTTP resource(s) on HTTPS page`,
      );
    }

    if (httpsIssues.length > 0) {
      results.push({
        clauseId: "5.3.2-https",
        pageUrl: ctx.pageUrl,
        status: "fail",
        severity: "high",
        evidence: httpsIssues.join("; ") + ".",
        detail: {
          isHttps: tlsInfo.isHttps,
          hsts: tlsInfo.hstsHeader,
          mixedContentCount: tlsInfo.mixedContent.length,
        },
        checkedAt: now,
      });
    } else {
      results.push({
        clauseId: "5.3.2-https",
        pageUrl: ctx.pageUrl,
        status: "pass",
        severity: "high",
        evidence: "HTTPS is enforced and HSTS header is present. No mixed content detected.",
        detail: {
          isHttps: tlsInfo.isHttps,
          hsts: tlsInfo.hstsHeader,
        },
        checkedAt: now,
      });
    }

    // ── 5.3.2-ciphers — Weak protocols/ciphers disabled ───────────────────────
    // Cannot fully check cipher suite from browser context. Needs server-side
    // TLS scan (e.g. SSL Labs approach). Mark as needs_review.
    if (tlsInfo.mixedContent.length > 0) {
      results.push({
        clauseId: "5.3.2-ciphers",
        pageUrl: ctx.pageUrl,
        status: "fail",
        severity: "high",
        evidence:
          `Mixed content indicates weak TLS configuration: ${String(tlsInfo.mixedContent.length)} ` +
          `HTTP resource(s) loaded on HTTPS page. Full cipher suite verification ` +
          `requires an authorized TLS scan (e.g. SSL Labs).`,
        detail: { mixedContent: tlsInfo.mixedContent },
        checkedAt: now,
      });
    } else {
      results.push({
        clauseId: "5.3.2-ciphers",
        pageUrl: ctx.pageUrl,
        status: "needs_review",
        severity: "high",
        evidence:
          "No mixed content detected. Full cipher suite verification (SSLv2/v3, " +
          "TLS 1.0/1.1, 3DES, RC4) requires a server-side TLS scan — not verifiable " +
          "from browser context. Recommend running an SSL Labs test.",
        detail: null,
        checkedAt: now,
      });
    }

    return results;
  },
};
