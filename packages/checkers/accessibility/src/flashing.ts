/**
 * Checker: a11y-flashing
 * Clause:  5.2.26 — No content flashes more than 3 times per second (WCAG 2.3.1)
 * Automation: semi-automatable
 * Severity:   high
 * Owner:      Member A (A-010)
 *
 * Strategy:
 *  - Detect CSS animations with animation-iteration-count: infinite AND
 *    animation-duration <= 333ms (i.e. >= 3 cycles/second = >= 3Hz)
 *  - Detect <blink> elements (obsolete but worth checking)
 *  - Detect GIFs heuristically (src ends in .gif on an <img>) — GIFs can flash
 *
 *  FAIL if any fast-cycling infinite animations are detected.
 *  NEEDS_REVIEW for GIFs (cannot check frame rate without downloading the file).
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "a11y-flashing";
const CLAUSE_ID = "5.2.26";

/** Maximum safe animation duration: 1000ms / 3Hz = 333ms */
const MAX_SAFE_DURATION_MS = 333;

export const flashingChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();

    const findings = await ctx.page.evaluate((maxDuration: number) => {
      const flashingElements: Array<{ tag: string; duration: string }> = [];
      let blinkCount = 0;
      let gifCount = 0;

      // CSS animations that flash faster than 3Hz
      for (const el of Array.from(document.querySelectorAll("*"))) {
        const style = getComputedStyle(el);
        if (style.animationIterationCount === "infinite" && style.animationName !== "none") {
          // Parse duration (e.g. "0.2s" or "200ms")
          const durationStr = style.animationDuration;
          let durationMs = 0;
          if (durationStr.endsWith("ms")) {
            durationMs = parseFloat(durationStr);
          } else if (durationStr.endsWith("s")) {
            durationMs = parseFloat(durationStr) * 1000;
          }
          if (durationMs > 0 && durationMs <= maxDuration) {
            flashingElements.push({
              tag: el.tagName.toLowerCase(),
              duration: durationStr,
            });
          }
        }
      }

      // <blink> elements (obsolete) — eslint-disable because we intentionally query for deprecated elements
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      blinkCount = document.querySelectorAll("blink").length;

      // Animated GIFs (heuristic — can't check frame rate)
      for (const img of Array.from(document.querySelectorAll("img"))) {
        if (img.src.toLowerCase().endsWith(".gif")) {
          gifCount++;
        }
      }

      return { flashingElements: flashingElements.slice(0, 5), blinkCount, gifCount };
    }, MAX_SAFE_DURATION_MS);

    const parts: string[] = [];

    if (findings.flashingElements.length > 0) {
      const examples = findings.flashingElements
        .slice(0, 3)
        .map((e) => `<${e.tag}> (${e.duration})`)
        .join(", ");
      parts.push(
        `${String(findings.flashingElements.length)} element(s) with fast infinite animation: ${examples}`,
      );
    }

    if (findings.blinkCount > 0) {
      parts.push(`${String(findings.blinkCount)} <blink> element(s) (always flashes)`);
    }

    if (findings.flashingElements.length > 0 || findings.blinkCount > 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "fail",
          severity: "high",
          evidence: `Content may flash more than 3 times per second: ${parts.join("; ")}`,
          detail: findings,
          checkedAt: now,
        },
      ];
    }

    if (findings.gifCount > 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "needs_review",
          severity: "high",
          evidence:
            `${String(findings.gifCount)} GIF image(s) found. ` +
            `Animated GIFs may flash — verify frame rate is below 3Hz or images are static.`,
          detail: { gifCount: findings.gifCount },
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
        evidence: "No fast-cycling animations, <blink> elements, or GIFs detected.",
        detail: null,
        checkedAt: now,
      },
    ];
  },
};
