/**
 * Shared types for quality + lifecycle checkers.
 * Mirrors schema.md §3 and accessibility/src/types.ts exactly.
 */

import type { Page } from "playwright";
import type { CheckerResult } from "@gigw/db";

export interface CheckerContext {
  page: Page;
  pageUrl: string;
  html: string;
}

/**
 * The shape checkers produce. Omits `id` and `pageReportId` because:
 *  - `id` is assigned by the DB (cuid auto-generated). Checkers must NOT set it.
 *  - `pageReportId` is set during aggregation.
 *
 * Worker strips both before inserting:
 *   const { id: _id, pageReportId: _pr, ...data } = result;
 *   await prisma.checkerResult.create({ data });
 */
export type CheckerResultData = Omit<CheckerResult, "id" | "pageReportId">;

export type CheckerFn = (ctx: CheckerContext) => Promise<CheckerResultData[]>;

export interface CheckerModule {
  checkerId: string;
  clauseIds: string[];
  run: CheckerFn;
}
