/**
 * Shared types for cybersecurity checkers.
 * Mirrors schema.md §3 — keep in sync with the accessibility and
 * quality-lifecycle packages' types.ts.
 */

import type { Page } from "playwright";
import type { CheckerResult } from "@gigw/db";

export interface CheckerContext {
  page: Page;
  pageUrl: string;
  html: string;
}

/**
 * The shape checkers produce. Omits `id` and `pageReportId` — see
 * accessibility/src/types.ts for the full explanation.
 */
export type CheckerResultData = Omit<CheckerResult, "id" | "pageReportId">;

export type CheckerFn = (ctx: CheckerContext) => Promise<CheckerResultData[]>;

export interface CheckerModule {
  checkerId: string;
  clauseIds: string[];
  run: CheckerFn;
}
