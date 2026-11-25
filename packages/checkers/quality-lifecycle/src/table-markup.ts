/**
 * Checker: quality-table-markup
 * Clause:  5.1.19 — Data tables must use proper row/column headers, associated cells.
 * Automation: automatable | Severity: medium | Owner: B
 */

import type { CheckerModule, CheckerContext, CheckerResultData } from "./types.js";

const CHECKER_ID = "quality-table-markup";
const CLAUSE_ID = "5.1.19";

export const tableMarkupChecker: CheckerModule = {
  checkerId: CHECKER_ID,
  clauseIds: [CLAUSE_ID],
  async run(ctx: CheckerContext): Promise<CheckerResultData[]> {
    const now = new Date();
    const tableInfo = await ctx.page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll("table"));
      if (tables.length === 0) return { tableCount: 0, issues: [] };
      const issues: string[] = [];
      for (const table of tables) {
        const hasHeaders = table.querySelector("th, [scope], thead") !== null;
        const hasCaption = table.querySelector("caption") !== null;
        const rowCount = table.querySelectorAll("tr").length;
        if (rowCount > 2 && !hasHeaders) {
          const summary = (table.textContent ?? "").trim().slice(0, 40);
          issues.push(`Table without <th> or scope (rows: ${String(rowCount)}): "${summary}"`);
        }
        if (rowCount > 2 && !hasCaption) {
          // caption is recommended — flag as needs_review not fail
        }
      }
      return { tableCount: tables.length, issues: issues.slice(0, 3) };
    });

    if (tableInfo.tableCount === 0) {
      return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "not_applicable", severity: "medium",
        evidence: "No tables found on this page.", detail: null, checkedAt: now }];
    }

    if (tableInfo.issues.length > 0) {
      return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "fail", severity: "medium",
        evidence: `${String(tableInfo.issues.length)} table(s) missing proper header markup: ${tableInfo.issues[0]}`,
        detail: tableInfo, checkedAt: now }];
    }

    return [{ clauseId: CLAUSE_ID, pageUrl: ctx.pageUrl, status: "needs_review", severity: "medium",
      evidence: `${String(tableInfo.tableCount)} table(s) found with header elements. Verify scope and caption attributes are correct.`,
      detail: { tableCount: tableInfo.tableCount }, checkedAt: now }];
  },
};
