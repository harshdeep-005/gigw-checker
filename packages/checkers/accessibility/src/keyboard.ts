/**
 * Checker: a11y-keyboard
 * Clauses: 5.2.21 — Keyboard operable (WCAG 2.1.1)
 *          5.2.22 — No keyboard trap (WCAG 2.1.2)
 * Automation: semi-automatable
 * Severity:   high
 * Owner:      Member A (A-010)
 *
 * Strategy for 5.2.21 (keyboard operable):
 *  - Detect interactive elements with tabindex="-1" that should be reachable
 *    (buttons, links, inputs, selects, textareas with tabindex="-1" explicitly set)
 *  - Detect onclick handlers on non-interactive elements with no keyboard equivalent
 *    (div/span with onclick but no role, tabindex, or keyboard handler)
 *
 * Strategy for 5.2.22 (no keyboard trap):
 *  - Tab through up to 20 focusable elements in sequence
 *  - If focus does not advance (same element focused twice in a row), flag as fail
 *
 * Both return needs_review by default — full keyboard testing requires human verification.
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "a11y-keyboard";
const CLAUSE_IDS = ["5.2.21", "5.2.22"] as const;

export const keyboardChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [...CLAUSE_IDS],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();
    const results: CheckerResultData[] = [];

    // ── 5.2.21 — Keyboard operable ──────────────────────────────────────────
    const keyboardIssues = await ctx.page.$$eval(
      "button, a, input, select, textarea, [role='button'], [role='link'], [role='menuitem']",
      (els) =>
        els
          .filter((el) => (el as HTMLElement).tabIndex === -1)
          .map((el) => ({
            tag: el.tagName.toLowerCase(),
            id: el.id,
            text: (el.textContent ?? "").trim().slice(0, 60),
          }))
          .slice(0, 5), // limit evidence to first 5
    );

    // Also check divs/spans with onclick but no keyboard support
    const clickOnlyElements = await ctx.page.$$eval("div[onclick], span[onclick]", (els) =>
      els
        .filter((el) => {
          const html = el as HTMLElement;
          return (
            !html.hasAttribute("tabindex") &&
            !html.hasAttribute("role") &&
            !html.hasAttribute("onkeydown") &&
            !html.hasAttribute("onkeypress") &&
            !html.hasAttribute("onkeyup")
          );
        })
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          text: (el.textContent ?? "").trim().slice(0, 60),
        }))
        .slice(0, 5),
    );

    if (keyboardIssues.length > 0 || clickOnlyElements.length > 0) {
      const parts: string[] = [];
      if (keyboardIssues.length > 0) {
        parts.push(
          `${String(keyboardIssues.length)} interactive element(s) have tabindex="-1": ` +
            keyboardIssues.map((e) => `<${e.tag}> "${e.text}"`).join(", "),
        );
      }
      if (clickOnlyElements.length > 0) {
        parts.push(
          `${String(clickOnlyElements.length)} element(s) have onclick but no keyboard equivalent`,
        );
      }
      results.push({
        clauseId: "5.2.21",
        pageUrl: ctx.pageUrl,
        status: "needs_review",
        severity: "high",
        evidence: parts.join(". ") + ". Verify full keyboard operability manually.",
        detail: { tabIndexMinus1: keyboardIssues.length, clickOnly: clickOnlyElements.length },
        checkedAt: now,
      });
    } else {
      results.push({
        clauseId: "5.2.21",
        pageUrl: ctx.pageUrl,
        status: "needs_review",
        severity: "high",
        evidence:
          "No obvious keyboard operability issues detected in markup. " +
          "Full keyboard navigation requires manual verification.",
        detail: null,
        checkedAt: now,
      });
    }

    // ── 5.2.22 — No keyboard trap ────────────────────────────────────────────
    // Tab through focusable elements and detect if focus gets stuck
    const MAX_TABS = 25;
    const focusedIds: string[] = [];
    let trapDetected = false;
    let trapEvidence = "";

    try {
      // Focus the first focusable element
      await ctx.page.keyboard.press("Tab");

      for (let i = 0; i < MAX_TABS; i++) {
        const focusedEl = await ctx.page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          return {
            tag: el.tagName.toLowerCase(),
            id: el.id,
            text: (el.textContent ?? "").trim().slice(0, 40),
          };
        });

        if (!focusedEl) break;

        const focusKey = `${focusedEl.tag}#${focusedEl.id}:${focusedEl.text}`;

        // If we see the same element twice consecutively — possible trap
        if (focusedIds.length > 0 && focusedIds[focusedIds.length - 1] === focusKey) {
          trapDetected = true;
          trapEvidence =
            `Focus appears trapped on: <${focusedEl.tag}> "${focusedEl.text}" ` +
            `(same element focused on consecutive Tab presses)`;
          break;
        }

        focusedIds.push(focusKey);
        await ctx.page.keyboard.press("Tab");
      }
    } catch {
      // If keyboard interaction fails, mark as needs_review
      results.push({
        clauseId: "5.2.22",
        pageUrl: ctx.pageUrl,
        status: "needs_review",
        severity: "high",
        evidence: "Could not complete keyboard trap test — verify manually.",
        detail: null,
        checkedAt: now,
      });
      return results;
    }

    results.push({
      clauseId: "5.2.22",
      pageUrl: ctx.pageUrl,
      status: trapDetected ? "fail" : "needs_review",
      severity: "high",
      evidence: trapDetected
        ? trapEvidence
        : `Tabbed through ${String(focusedIds.length)} elements without detecting a trap. ` +
          "Full verification requires manual testing.",
      detail: { tabsPerformed: focusedIds.length, trapDetected },
      checkedAt: now,
    });

    return results;
  },
};
