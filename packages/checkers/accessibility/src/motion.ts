/**
 * Checker: a11y-motion
 * Clause:  5.2.25 — Moving/blinking content must be pauseable/stoppable/hideable (WCAG 2.2.2)
 * Automation: semi-automatable
 * Severity:   medium
 * Owner:      Member A (A-010)
 *
 * Strategy:
 *  - Detect <marquee> elements (deprecated but still found on .gov.in sites)
 *  - Detect elements with CSS animation/transition that loop infinitely
 *    (animation-iteration-count: infinite) without a pause control nearby
 *  - Detect autoplay carousels heuristically (elements with classes like
 *    "carousel", "slider", "slideshow" that have auto-advance behaviour)
 *
 *  Returns needs_review — presence of animation ≠ violation (it needs no controls).
 *  Only marquee is a definitive fail.
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "a11y-motion";
const CLAUSE_ID = "5.2.25";

const CAROUSEL_CLASS_RE = /\b(carousel|slider|slideshow|swiper|slick|owl|auto.?play|autoplay)\b/i;

export const motionChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();

    const findings = await ctx.page.evaluate((carouselRe: string) => {
      const re = new RegExp(carouselRe, "i");
      const result = {
        marqueeCount: 0,
        infiniteAnimations: 0,
        carouselSuspects: 0,
      };

      // <marquee> — always a fail. eslint-disable: we intentionally look for deprecated elements
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      result.marqueeCount = document.querySelectorAll("marquee").length;

      // Infinite CSS animations
      for (const el of Array.from(document.querySelectorAll("*"))) {
        const style = getComputedStyle(el);
        if (
          style.animationIterationCount === "infinite" &&
          style.animationName !== "none" &&
          style.animationPlayState !== "paused"
        ) {
          result.infiniteAnimations++;
        }
      }

      // Carousel suspects by class name
      for (const el of Array.from(document.querySelectorAll("[class]"))) {
        const cls = el.className;
        if (re.test(cls)) {
          result.carouselSuspects++;
        }
      }

      return result;
    }, CAROUSEL_CLASS_RE.source);

    if (findings.marqueeCount > 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "fail",
          severity: "medium",
          evidence:
            `${String(findings.marqueeCount)} <marquee> element(s) found. ` +
            `<marquee> is deprecated and provides no mechanism to pause moving content.`,
          detail: findings,
          checkedAt: now,
        },
      ];
    }

    if (findings.infiniteAnimations > 0 || findings.carouselSuspects > 0) {
      const parts: string[] = [];
      if (findings.infiniteAnimations > 0)
        parts.push(`${String(findings.infiniteAnimations)} element(s) with infinite CSS animation`);
      if (findings.carouselSuspects > 0)
        parts.push(`${String(findings.carouselSuspects)} likely carousel/slider element(s)`);

      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "needs_review",
          severity: "medium",
          evidence:
            `Moving content detected: ${parts.join("; ")}. ` +
            `Verify users can pause, stop, or hide any auto-moving content.`,
          detail: findings,
          checkedAt: now,
        },
      ];
    }

    return [
      {
        clauseId: CLAUSE_ID,
        pageUrl: ctx.pageUrl,
        status: "pass",
        severity: "medium",
        evidence: "No <marquee>, infinite animations, or carousels detected.",
        detail: null,
        checkedAt: now,
      },
    ];
  },
};
