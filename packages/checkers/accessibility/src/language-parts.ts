/**
 * Checker: a11y-language-parts
 * Clause:  5.2.39 — Language of parts must be marked when different from page language (WCAG 3.1.2)
 * Automation: semi-automatable
 * Severity:   medium
 * Owner:      Member A (A-010)
 *
 * Strategy:
 *  - Verify page has a valid lang attribute on <html> (covered by axe-core 5.2.38,
 *    but we also check here for the parts-specific context)
 *  - Find elements with a lang attribute that differs from the page lang
 *  - Validate those lang values are valid BCP-47 tags
 *  - Heuristic: detect Devanagari (Hindi) text on pages declaring lang="en" —
 *    common on Indian government sites that mix English and Hindi without marking parts
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "a11y-language-parts";
const CLAUSE_ID = "5.2.39";

/** Basic BCP-47 tag pattern: 2-3 letter language code, optional region */
const BCP47_RE = /^[a-z]{2,3}(-[A-Z]{2,3})?(-[a-zA-Z0-9]{2,8})*$/;

export const languagePartsChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();

    const pageInfo = await ctx.page.evaluate(() => {
      const html = document.documentElement;
      const pageLang = html.lang.trim();

      // Elements with explicit lang attributes (cast to HTMLElement for .lang access)
      const langEls = Array.from(document.querySelectorAll<HTMLElement>("[lang]")).filter(
        (el) => el !== html,
      );

      const parts = langEls.map((el) => ({
        tag: el.tagName.toLowerCase(),
        lang: el.lang,
        text: (el.textContent ?? "").trim().slice(0, 40),
      }));

      // Heuristic: does body text contain Devanagari on an English page?
      const bodyText = document.body.textContent ?? "";
      const hasDevanagari = /[\u0900-\u097F]/.test(bodyText);

      return { pageLang, parts: parts.slice(0, 10), hasDevanagari, bodyLength: bodyText.length };
    });

    const typedPageInfo = pageInfo as {
      pageLang: string;
      parts: Array<{ tag: string; lang: string; text: string }>;
      hasDevanagari: boolean;
      bodyLength: number;
    };

    // No page lang — axe-core already catches this, just note it
    if (!typedPageInfo.pageLang) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "needs_review",
          severity: "medium",
          evidence:
            "Page has no lang attribute on <html> — cannot check language of parts. " +
            "Add lang attribute first (clause 5.2.38).",
          detail: null,
          checkedAt: now,
        },
      ];
    }

    // Check for invalid BCP-47 lang values on part elements
    const invalidLangs = typedPageInfo.parts.filter((p) => !BCP47_RE.test(p.lang));
    if (invalidLangs.length > 0) {
      const examples = invalidLangs
        .slice(0, 3)
        .map((p) => `<${p.tag} lang="${p.lang}">`)
        .join(", ");
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "fail",
          severity: "medium",
          evidence: `${String(invalidLangs.length)} element(s) have invalid BCP-47 lang values: ${examples}`,
          detail: { pageLang: typedPageInfo.pageLang, invalidLangs: invalidLangs.length },
          checkedAt: now,
        },
      ];
    }

    // Heuristic: Hindi/Devanagari text on an English page with no lang-marked parts
    const pageIsEnglish = typedPageInfo.pageLang.toLowerCase().startsWith("en");
    if (pageIsEnglish && typedPageInfo.hasDevanagari && typedPageInfo.parts.length === 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "needs_review",
          severity: "medium",
          evidence:
            `Page declares lang="${typedPageInfo.pageLang}" but contains Devanagari script. ` +
            `Hindi/regional content blocks should have lang="hi" (or appropriate) on their container.`,
          detail: {
            pageLang: typedPageInfo.pageLang,
            hasDevanagari: true,
            markedParts: 0,
          },
          checkedAt: now,
        },
      ];
    }

    // Parts are marked
    if (typedPageInfo.parts.length > 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "needs_review",
          severity: "medium",
          evidence:
            `Page lang="${typedPageInfo.pageLang}". ` +
            `${String(typedPageInfo.parts.length)} element(s) have explicit lang attributes. ` +
            `Verify these correctly mark all non-primary-language passages.`,
          detail: { pageLang: typedPageInfo.pageLang, markedParts: typedPageInfo.parts.length },
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
          `Page lang="${typedPageInfo.pageLang}". No explicit lang attributes on sub-elements found. ` +
          `If the page contains passages in other languages, mark them with lang attributes.`,
        detail: { pageLang: typedPageInfo.pageLang, markedParts: 0 },
        checkedAt: now,
      },
    ];
  },
};
