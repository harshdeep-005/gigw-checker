/**
 * Checker: a11y-images-of-text
 * Clause:  5.2.16 — Images of text must be avoided except where essential (WCAG 1.4.5)
 * Automation: semi-automatable
 * Severity:   low
 * Owner:      Member A (A-010)
 *
 * Strategy:
 *  Heuristic — cannot run OCR, so we infer from signals:
 *  - <img> whose alt text reads like a sentence (> 4 words) — likely contains text
 *  - <img> whose src/alt suggests a banner, heading, or button label
 *  - <img> inside a <h1>–<h6> or <button> (structural signal)
 *
 *  All results are needs_review — confirmed by human.
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "a11y-images-of-text";
const CLAUSE_ID = "5.2.16";

const WORD_COUNT_THRESHOLD = 4; // alts with more words are likely text images

const TEXT_IMAGE_FILENAME_RE = /\b(banner|heading|title|button|label|text|slide|header)\b/i;

export const imagesOfTextChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();

    const WORD_THRESHOLD = WORD_COUNT_THRESHOLD;
    const FILE_RE_SOURCE = TEXT_IMAGE_FILENAME_RE.source;

    const suspects = await ctx.page.$$eval("img", (imgs) => {
      const threshold = 4;
      const re = new RegExp("\\b(banner|heading|title|button|label|text|slide|header)\\b", "i");
      return imgs
        .filter((img) => {
          const alt = img.alt;
          const src = img.src;
          const wordCount = alt.trim().split(/\s+/).filter(Boolean).length;
          const inHeading = !!img.closest("h1,h2,h3,h4,h5,h6");
          const inButton = !!img.closest("button");
          const altLooksLikeText = wordCount > threshold;
          const filenameSuggestsText = re.test(src) || re.test(alt);
          return inHeading || inButton || altLooksLikeText || filenameSuggestsText;
        })
        .map((img) => ({
          alt: img.alt.slice(0, 80),
          src: img.src.slice(0, 80),
          inHeading: !!img.closest("h1,h2,h3,h4,h5,h6"),
          inButton: !!img.closest("button"),
        }))
        .slice(0, 5);
    });
    void WORD_THRESHOLD;
    void FILE_RE_SOURCE; // constants defined above for clarity

    if (suspects.length === 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "needs_review",
          severity: "low",
          evidence:
            "No obvious images-of-text patterns detected heuristically. " +
            "Visual inspection recommended for banners and decorative elements.",
          detail: null,
          checkedAt: now,
        },
      ];
    }

    const examples = suspects
      .slice(0, 3)
      .map((s) => {
        const ctx2 = s.inHeading ? " (inside heading)" : s.inButton ? " (inside button)" : "";
        return `"${s.alt || s.src}"${ctx2}`;
      })
      .join(", ");

    return [
      {
        clauseId: CLAUSE_ID,
        pageUrl: ctx.pageUrl,
        status: "needs_review",
        severity: "low",
        evidence:
          `${String(suspects.length)} image(s) may contain text: ${examples}. ` +
          `Verify these are not images of text (use real text + CSS instead).`,
        detail: { suspects: suspects.length },
        checkedAt: now,
      },
    ];
  },
};
