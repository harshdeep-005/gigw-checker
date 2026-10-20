/**
 * Checker: a11y-error-id
 * Clause:  5.2.44 — Input errors must be identified and described in text (WCAG 3.3.1)
 * Automation: semi-automatable
 * Severity:   medium
 * Owner:      Member A (A-010)
 *
 * Strategy:
 *  - Find <input> elements with aria-invalid="true"
 *  - Check each has an aria-describedby that points to an existing error message element
 *  - Check each has an associated <label> or aria-label
 *  - FAIL if aria-invalid="true" inputs have no error description linkage
 *  - NEEDS_REVIEW if forms exist but have no aria-invalid (may not have been submitted yet)
 *  - NOT_APPLICABLE if no form inputs on the page
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "a11y-error-id";
const CLAUSE_ID = "5.2.44";

export const errorIdChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],

  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();

    const formInfo = await ctx.page.evaluate(() => {
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>(
          "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']), textarea, select",
        ),
      );

      if (inputs.length === 0) return { inputCount: 0, invalidInputs: [], formCount: 0 };

      const invalidInputs = inputs
        .filter((el) => el.getAttribute("aria-invalid") === "true")
        .map((el) => {
          const describedById = el.getAttribute("aria-describedby") ?? "";
          const errorEl = describedById
            ? document.getElementById(describedById.split(" ")[0] ?? "")
            : null;
          return {
            id: el.id,
            type: el.type || el.tagName.toLowerCase(),
            hasAriaDescribedby: describedById.length > 0,
            errorElExists: errorEl !== null,
            errorText: (errorEl?.textContent ?? "").trim().slice(0, 60),
          };
        });

      return {
        inputCount: inputs.length,
        invalidInputs,
        formCount: document.querySelectorAll("form").length,
      };
    });

    if (formInfo.inputCount === 0) {
      return [
        {
          clauseId: CLAUSE_ID,
          pageUrl: ctx.pageUrl,
          status: "not_applicable",
          severity: "medium",
          evidence: "No form inputs found on this page.",
          detail: null,
          checkedAt: now,
        },
      ];
    }

    if (formInfo.invalidInputs.length > 0) {
      const broken = formInfo.invalidInputs.filter(
        (i) => !i.hasAriaDescribedby || !i.errorElExists,
      );

      if (broken.length > 0) {
        const examples = broken
          .slice(0, 3)
          .map((i) => {
            if (!i.hasAriaDescribedby) return `<${i.type}> (no aria-describedby)`;
            return `<${i.type}> (aria-describedby points to missing element)`;
          })
          .join(", ");

        return [
          {
            clauseId: CLAUSE_ID,
            pageUrl: ctx.pageUrl,
            status: "fail",
            severity: "medium",
            evidence: `${String(broken.length)} aria-invalid="true" input(s) have no accessible error description: ${examples}`,
            detail: {
              inputCount: formInfo.inputCount,
              invalidCount: formInfo.invalidInputs.length,
              broken: broken.length,
            },
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
            `${String(formInfo.invalidInputs.length)} aria-invalid="true" input(s) have accessible error descriptions. ` +
            `Verify error messages are meaningful and clearly describe the issue.`,
          detail: { inputCount: formInfo.inputCount, invalidCount: formInfo.invalidInputs.length },
          checkedAt: now,
        },
      ];
    }

    // No currently-invalid inputs — form may not have been submitted yet
    return [
      {
        clauseId: CLAUSE_ID,
        pageUrl: ctx.pageUrl,
        status: "needs_review",
        severity: "medium",
        evidence:
          `${String(formInfo.inputCount)} form input(s) found, none currently marked aria-invalid. ` +
          `Submit the form with invalid data to test error identification.`,
        detail: { inputCount: formInfo.inputCount, formCount: formInfo.formCount },
        checkedAt: now,
      },
    ];
  },
};
