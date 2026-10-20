/**
 * Checker: a11y-text-alternatives
 * Clause:  5.2.1 — All non-text content must have a text alternative (WCAG 1.1.1)
 * Automation: semi-automatable
 * Severity:   high
 * Owner:      Member A (A-010)
 *
 * Strategy:
 *  - FAIL:         <img> with no alt attribute at all
 *  - NEEDS_REVIEW: <img> with an alt that is generic/meaningless
 *                  (empty string on decorative is valid — flagged as needs_review
 *                  because we cannot tell if decorative intent is correct)
 *  - NEEDS_REVIEW: <img> whose alt looks like a filename (contains extension)
 *  - PASS:         <img> with a non-empty, non-generic alt
 *  - NOT_APPLICABLE: page has no <img> elements
 *
 * axe-core already catches missing alt (image-alt rule → 5.2.49). This checker
 * adds the meaningfulness heuristic that axe cannot judge.
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "a11y-text-alternatives";
const CLAUSE_ID = "5.2.1";

/** Generic / placeholder alt texts that are not meaningful. */
const GENERIC_ALTS = new Set([
  "image",
  "photo",
  "picture",
  "icon",
  "logo",
  "banner",
  "img",
  "graphic",
  "figure",
  "thumbnail",
  "spacer",
  "pixel",
  "1x1",
  ".",
  "*",
]);

const FILENAME_RE = /\.(jpe?g|png|gif|svg|webp|bmp|ico|tiff?)$/i;

function classifyAlt(alt: string | null): "missing" | "empty" | "generic" | "filename" | "ok" {
  if (alt === null) return "missing";
  const trimmed = alt.trim();
  if (trimmed === "") return "empty";
  if (GENERIC_ALTS.has(trimmed.toLowerCase())) return "generic";
  if (FILENAME_RE.test(trimmed)) return "filename";
  return "ok";
}

export const textAlternativesChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();

    // Collect all img elements with their alt + src for evidence
    const images = await ctx.page.$$eval("img", (imgs) =>
      imgs.map((el) => ({
        alt: el.hasAttribute("alt") ? el.alt : null,
        src: el.src.slice(0, 120),
      })),
    );

    if (images.length === 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "not_applicable",
          severity: "high",
          evidence: "No <img> elements found on this page.",
          detail: null,
          checkedAt: now,
        },
      ];
    }

    const missing = images.filter((i) => classifyAlt(i.alt) === "missing");
    const empty = images.filter((i) => classifyAlt(i.alt) === "empty");
    const generic = images.filter((i) => classifyAlt(i.alt) === "generic");
    const filename = images.filter((i) => classifyAlt(i.alt) === "filename");
    const ok = images.filter((i) => classifyAlt(i.alt) === "ok");

    // Missing alt is a definitive fail
    if (missing.length > 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "fail",
          severity: "high",
          evidence:
            `${String(missing.length)} of ${String(images.length)} <img> elements have no alt attribute. ` +
            `First offender src: ${missing[0]?.src ?? "unknown"}`,
          detail: { total: images.length, missing: missing.length, ok: ok.length },
          checkedAt: now,
        },
      ];
    }

    // Generic or filename-like alts need human review
    const suspicious = [...generic, ...filename];
    if (suspicious.length > 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "needs_review",
          severity: "high",
          evidence:
            `${String(suspicious.length)} of ${String(images.length)} <img> elements have ` +
            `generic or filename-like alt text. ` +
            `First: alt="${suspicious[0]?.alt ?? ""}" src="${suspicious[0]?.src ?? ""}"`,
          detail: {
            total: images.length,
            suspicious: suspicious.length,
            empty: empty.length,
            ok: ok.length,
          },
          checkedAt: now,
        },
      ];
    }

    // All images have empty alt (decorative) or meaningful alt — needs review for empty
    if (empty.length > 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "needs_review",
          severity: "high",
          evidence:
            `${String(empty.length)} of ${String(images.length)} <img> elements have alt="" ` +
            `(decorative intent). Verify these are genuinely decorative.`,
          detail: { total: images.length, empty: empty.length, ok: ok.length },
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
        evidence: `All ${String(images.length)} <img> elements have non-empty, non-generic alt text.`,
        detail: { total: images.length, ok: ok.length },
        checkedAt: now,
      },
    ];
  },
};
