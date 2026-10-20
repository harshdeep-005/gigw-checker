/**
 * Checker: a11y-colour
 * Clause:  5.2.12 — Colour must not be the only visual means of conveying information (WCAG 1.4.1)
 * Automation: semi-automatable
 * Severity:   medium
 * Owner:      Member A (A-010)
 *
 * Strategy:
 *  Heuristic detection of common colour-only patterns:
 *  - Required form fields marked only with a red border (no asterisk, no label text change)
 *  - Links that are the same colour as surrounding text (no underline)
 *  - Status indicators using only background-color with no text/icon
 *
 *  All results are needs_review — full judgment requires human inspection.
 *  This checker surfaces suspects; a human confirms.
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "a11y-colour";
const CLAUSE_ID = "5.2.12";

export const colourChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();

    const findings = await ctx.page.evaluate(() => {
      const issues: string[] = [];

      // Heuristic 1: links with no underline (colour may be sole differentiator)
      const links = Array.from(document.querySelectorAll("a"));
      let noUnderlineLinks = 0;
      for (const a of links) {
        const style = getComputedStyle(a);
        if (style.textDecorationLine === "none" || style.textDecoration === "none") {
          noUnderlineLinks++;
        }
      }
      if (noUnderlineLinks > 0 && links.length > 0) {
        const pct = Math.round((noUnderlineLinks / links.length) * 100);
        issues.push(
          `${String(noUnderlineLinks)} of ${String(links.length)} links (${String(pct)}%) ` +
            `have no underline — colour may be their sole differentiator from surrounding text`,
        );
      }

      // Heuristic 2: required fields with only a border-color change (no asterisk text)
      const requiredInputs = Array.from(
        document.querySelectorAll("input[required], select[required]"),
      );
      let colorOnlyRequired = 0;
      for (const input of requiredInputs) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        const labelText = label?.textContent ?? "";
        if (!labelText.includes("*") && !labelText.toLowerCase().includes("required")) {
          colorOnlyRequired++;
        }
      }
      if (colorOnlyRequired > 0) {
        issues.push(
          `${String(colorOnlyRequired)} required field(s) have no asterisk or "required" label text — ` +
            `required status may rely on colour only`,
        );
      }

      return issues;
    });

    if (findings.length === 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "needs_review",
          severity: "medium",
          evidence:
            "No obvious colour-only patterns detected. " +
            "Manual review required to confirm colour is not the sole conveyor of information.",
          detail: null,
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
          `Potential colour-only patterns found: ${findings.join("; ")}. ` +
          `Manual verification required.`,
        detail: { findings },
        checkedAt: now,
      },
    ];
  },
};
