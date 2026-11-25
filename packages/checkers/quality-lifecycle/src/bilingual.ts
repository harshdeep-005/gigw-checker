/**
 * Checker: bilingual
 * Clause: 5.4.10 — Bilingual support: prominent language selector (Hindi +
 *                   English), and Unicode characters used.
 * Automation: automatable
 * Severity: medium
 * Owner: Member B (B-007)
 *
 * Strategy:
 *   1. Look for a language switcher link/button (Hindi ↔ English)
 *   2. Check <html lang> attribute is set
 *   3. Check charset=UTF-8 (Unicode)
 * Returns separate results for each sub-check.
 */

import type { CheckerModule, CheckerContext } from "./types.js";
import type { CheckerResult } from "@gigw/db";

const CHECKER_ID = "bilingual";
const CLAUSE_ID = "5.4.10";

// Language switcher — link/button text containing Hindi/English toggle words
const HINDI_LINK_RE = /(?:href|onclick)[^>]*>(?:[^<]*(?:हिन्दी|हिंदी|hindi)[^<]*)<\/(?:a|button)/i;
const ENGLISH_LINK_RE = /(?:href|onclick)[^>]*>(?:[^<]*(?:english|अंग्रेज़ी)[^<]*)<\/(?:a|button)/i;
const LANG_ATTR_RE = /<html[^>]+lang=["']([^"']+)["']/i;
const CHARSET_UTF8_RE = /<meta[^>]+charset=["']?utf-8["']?/i;

export const bilingualChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  run(ctx: CheckerContext): Promise<CheckerResult[]> {
    const html = ctx.html;
    const now = new Date();

    const hasHindiLink = HINDI_LINK_RE.test(html);
    const hasEnglishLink = ENGLISH_LINK_RE.test(html);
    const langMatch = LANG_ATTR_RE.exec(html);
    const hasUtf8 = CHARSET_UTF8_RE.test(html);

    const results: CheckerResult[] = [
      // Sub-check 1: language selector
      {
        id: "",
        clauseId: CLAUSE_ID,
        pageUrl: ctx.pageUrl,
        status: hasHindiLink || hasEnglishLink ? "pass" : "fail",
        severity: "medium",
        evidence:
          hasHindiLink || hasEnglishLink
            ? `Language selector found (Hindi: ${String(hasHindiLink)}, English: ${String(hasEnglishLink)}).`
            : "No language selector (Hindi/English toggle) found on the page.",
        detail: { subCheck: "language-selector", hasHindiLink, hasEnglishLink },
        checkedAt: now,
        pageReportId: null,
      },
      // Sub-check 2: lang attribute
      {
        id: "",
        clauseId: CLAUSE_ID,
        pageUrl: ctx.pageUrl,
        status: langMatch !== null ? "pass" : "fail",
        severity: "medium",
        evidence:
          langMatch !== null
            ? `<html lang="${langMatch[1] ?? ""}"> attribute present.`
            : "<html> tag is missing the lang attribute.",
        detail: { subCheck: "lang-attribute", langValue: langMatch?.[1] ?? null },
        checkedAt: now,
        pageReportId: null,
      },
      // Sub-check 3: UTF-8 charset
      {
        id: "",
        clauseId: CLAUSE_ID,
        pageUrl: ctx.pageUrl,
        status: hasUtf8 ? "pass" : "fail",
        severity: "medium",
        evidence: hasUtf8
          ? "UTF-8 charset declared — Unicode characters supported."
          : "No UTF-8 charset meta tag found. Unicode/Devanagari characters may not render correctly.",
        detail: { subCheck: "utf8-charset", hasUtf8 },
        checkedAt: now,
        pageReportId: null,
      },
    ];

    return Promise.resolve(results);
  },
};
