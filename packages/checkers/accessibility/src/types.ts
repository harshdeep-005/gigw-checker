/**
 * Shared types for accessibility checkers.
 * CheckerModule / CheckerFn / CheckerContext mirror schema.md §3 exactly.
 * Import from here inside this package; other packages import from @gigw/db for
 * the DB-side types (CheckerResult, Severity, CheckStatus).
 */

import type { Page } from "playwright";
import type { CheckerResult } from "@gigw/db";

export interface CheckerContext {
  page: Page; // Playwright Page, already navigated to pageUrl
  pageUrl: string;
  html: string; // rendered HTML snapshot (page.content())
}

/**
 * The shape checkers produce. Omits `id` and `pageReportId` because:
 *  - `id` is assigned by the DB (cuid auto-generated). Checkers must NOT set it —
 *    passing id:"" to prisma.checkerResult.create() would insert an empty-string PK.
 *  - `pageReportId` is set during aggregation when the PageReport is created.
 *
 * The worker strips both fields before inserting:
 *   const { id: _id, pageReportId: _pr, ...data } = result;
 *   await prisma.checkerResult.create({ data });
 */
export type CheckerResultData = Omit<CheckerResult, "id" | "pageReportId">;

export type CheckerFn = (ctx: CheckerContext) => Promise<CheckerResultData[]>;

export interface CheckerModule {
  checkerId: string; // unique, e.g. "a11y-contrast" — matches ClauseDefinition.checkerId
  clauseIds: string[]; // which clause(s) this checker covers, e.g. ["5.2.14"]
  run: CheckerFn;
}
